/**
 * useAuth — Unified auth context
 * Wraps both wallet (dapp-kit) and zkLogin into a single interface.
 * All game actions use this — they never need to know which auth method is active.
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useDisconnectWallet,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useZkLogin } from './useZkLogin';

interface AuthContextType {
  address: string | null;
  isConnected: boolean;
  method: 'wallet' | 'zklogin' | null;
  zkLoginProvider: string | null;
  isZkLoginAvailable: boolean;
  isZkLoginLoading: boolean;
  beginZkLogin: (provider: 'Google') => Promise<void>;
  zkLoginLogout: () => void;
  signAndExecuteTransaction: (txBuilder: (tx: Transaction) => void) => Promise<{ digest: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Wallet state
  const walletAccount = useCurrentAccount();
  const { mutateAsync: walletSignAndExecute } = useSignAndExecuteTransaction();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  // zkLogin state
  const zkLogin = useZkLogin();

  // Wallet takes priority if both are connected
  const method: 'wallet' | 'zklogin' | null = walletAccount
    ? 'wallet'
    : zkLogin.account
      ? 'zklogin'
      : null;

  const address = walletAccount?.address ?? zkLogin.account?.userAddr ?? null;

  const signAndExecuteTransaction = useCallback(
    async (txBuilder: (tx: Transaction) => void): Promise<{ digest: string }> => {
      if (walletAccount) {
        // Wallet path
        const tx = new Transaction();
        txBuilder(tx);
        const result = await walletSignAndExecute({ transaction: tx });
        return { digest: result.digest };
      }

      if (zkLogin.account) {
        // zkLogin path
        return zkLogin.executeTransaction(txBuilder);
      }

      throw new Error('Not connected');
    },
    [walletAccount, walletSignAndExecute, zkLogin],
  );

  const zkLoginLogout = useCallback(() => {
    if (walletAccount) {
      disconnectWallet();
    }
    zkLogin.logout();
  }, [walletAccount, disconnectWallet, zkLogin]);

  const value: AuthContextType = {
    address,
    isConnected: !!address,
    method,
    zkLoginProvider: zkLogin.account?.provider ?? null,
    isZkLoginAvailable: zkLogin.isAvailable,
    isZkLoginLoading: zkLogin.isLoggingIn,
    beginZkLogin: zkLogin.beginZkLogin,
    zkLoginLogout,
    signAndExecuteTransaction,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
