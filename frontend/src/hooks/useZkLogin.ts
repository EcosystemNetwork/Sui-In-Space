/**
 * useZkLogin Hook
 * Core zkLogin logic: ephemeral keypair, Google OAuth flow, Shinami ZK prover, tx signing.
 * Adapted from polymedia-zklogin-demo.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  genAddressSeed,
  getZkLoginSignature,
} from '@mysten/sui/zklogin';
import { jwtDecode } from 'jwt-decode';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SHINAMI_API_KEY = import.meta.env.VITE_SHINAMI_API_KEY || '';

// In dev, proxy through Vite to avoid CORS. In prod, call Shinami directly.
const SHINAMI_PROVER_URL = import.meta.env.DEV
  ? '/api/shinami'
  : 'https://api.shinami.com/sui/zkprover/v1';

const SESSION_STORAGE_KEY = 'zklogin:account';
const SETUP_STORAGE_KEY = 'zklogin:setup';

export interface AccountData {
  provider: string;
  userAddr: string;
  zkProofs: ZkProofs;
  ephemeralPrivateKey: string;
  ephemeralPublicKey: string;
  userSalt: string;
  sub: string;
  aud: string;
  maxEpoch: number;
  jwtRandomness: string;
}

interface SetupData {
  provider: string;
  maxEpoch: number;
  jwtRandomness: string;
  ephemeralPrivateKey: string;
  ephemeralPublicKey: string;
}

interface ZkProofs {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
  addressSeed: string;
}

interface DecodedJwt {
  sub: string;
  aud: string;
  iss: string;
  nonce?: string;
}

export function useZkLogin() {
  const suiClient = useSuiClient();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const completingRef = useRef(false);

  const isAvailable = !!GOOGLE_CLIENT_ID && !!SHINAMI_API_KEY;

  // Restore account from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        setAccount(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Complete login after Google OAuth redirect
  useEffect(() => {
    if (completingRef.current) return;
    const hash = window.location.hash;
    if (!hash.includes('id_token=')) return;
    completingRef.current = true;
    completeZkLogin();
  }, []);

  const beginZkLogin = useCallback(async (provider: 'Google') => {
    setIsLoggingIn(true);
    try {
      // Get current epoch from Sui
      const { epoch } = await suiClient.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 2; // valid for ~2 epochs

      // Generate ephemeral keypair
      const ephemeralKeypair = new Ed25519Keypair();
      const jwtRandomness = generateRandomness();
      const nonce = generateNonce(
        ephemeralKeypair.getPublicKey(),
        maxEpoch,
        jwtRandomness,
      );

      // Save setup data to sessionStorage
      const setupData: SetupData = {
        provider,
        maxEpoch,
        jwtRandomness,
        ephemeralPrivateKey: ephemeralKeypair.getSecretKey(),
        ephemeralPublicKey: ephemeralKeypair.getPublicKey().toBase64(),
      };
      sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setupData));

      // Build Google OAuth URL
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: window.location.origin,
        response_type: 'id_token',
        scope: 'openid',
        nonce: nonce,
      });

      // Redirect to Google
      window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
      console.error('beginZkLogin failed:', error);
      setIsLoggingIn(false);
      throw error;
    }
  }, [suiClient]);

  const completeZkLogin = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      // Extract JWT from URL hash
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const jwt = params.get('id_token');
      if (!jwt) {
        throw new Error('No id_token in URL hash');
      }

      // Clean the URL
      window.history.replaceState(null, '', window.location.pathname);

      // Restore setup data
      const setupStr = sessionStorage.getItem(SETUP_STORAGE_KEY);
      if (!setupStr) {
        throw new Error('No setup data in sessionStorage');
      }
      const setupData: SetupData = JSON.parse(setupStr);
      sessionStorage.removeItem(SETUP_STORAGE_KEY);

      // Decode JWT
      const decoded = jwtDecode<DecodedJwt>(jwt);
      const { sub, aud } = decoded;

      // Fetch salt (dummy for dev)
      const saltResponse = await fetch('/dummy-salt-service.json');
      const saltData = await saltResponse.json();
      const userSalt = saltData.salt;

      // Derive Sui address
      const userAddr = jwtToAddress(jwt, userSalt, false);

      // Reconstruct ephemeral keypair
      const ephemeralKeypair = Ed25519Keypair.fromSecretKey(setupData.ephemeralPrivateKey);
      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
        ephemeralKeypair.getPublicKey(),
      );

      // Call Shinami ZK prover with retry
      const zkProofs = await fetchZkProofs(
        jwt,
        setupData.maxEpoch,
        extendedEphemeralPublicKey,
        setupData.jwtRandomness,
        userSalt,
      );

      // Build account data
      const accountData: AccountData = {
        provider: setupData.provider,
        userAddr,
        zkProofs,
        ephemeralPrivateKey: setupData.ephemeralPrivateKey,
        ephemeralPublicKey: setupData.ephemeralPublicKey,
        userSalt,
        sub,
        aud: typeof aud === 'string' ? aud : aud[0],
        maxEpoch: setupData.maxEpoch,
        jwtRandomness: setupData.jwtRandomness,
      };

      // Save to sessionStorage
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(accountData));
      setAccount(accountData);
    } catch (error) {
      console.error('completeZkLogin failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const executeTransaction = useCallback(
    async (txBuilder: (tx: Transaction) => void): Promise<{ digest: string }> => {
      if (!account) {
        throw new Error('No zkLogin account');
      }

      const tx = new Transaction();
      tx.setSender(account.userAddr);
      txBuilder(tx);

      // Sign with ephemeral key
      const ephemeralKeypair = Ed25519Keypair.fromSecretKey(account.ephemeralPrivateKey);
      const { bytes, signature: userSignature } = await tx.sign({
        client: suiClient,
        signer: ephemeralKeypair,
      });

      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(account.userSalt),
        'sub',
        account.sub,
        account.aud,
      ).toString();

      // Build zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...account.zkProofs,
          addressSeed,
        },
        maxEpoch: account.maxEpoch,
        userSignature,
      });

      // Execute
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });

      return { digest: result.digest };
    },
    [account, suiClient],
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SETUP_STORAGE_KEY);
    setAccount(null);
  }, []);

  return {
    account,
    isAvailable,
    isLoggingIn,
    beginZkLogin,
    executeTransaction,
    logout,
  };
}

async function fetchZkProofs(
  jwt: string,
  maxEpoch: number,
  extendedEphemeralPublicKey: string,
  jwtRandomness: string,
  salt: string,
  retries = 3,
): Promise<ZkProofs> {
  const rpcPayload = {
    jsonrpc: '2.0',
    method: 'shinami_zkp_createZkLoginProof',
    params: [
      jwt,
      String(maxEpoch),
      extendedEphemeralPublicKey,
      jwtRandomness,
      salt,
      'sub',
    ],
    id: 1,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(SHINAMI_PROVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': SHINAMI_API_KEY,
        },
        body: JSON.stringify(rpcPayload),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Shinami error: ${JSON.stringify(data.error)}`);
      }

      return data.result.zkProof || data.result;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw new Error('Failed to fetch ZK proofs');
}

export default useZkLogin;
