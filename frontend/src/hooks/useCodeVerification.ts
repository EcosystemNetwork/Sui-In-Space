/**
 * useCodeVerification — Compares local game-rules Merkle root against on-chain root.
 * On app load:
 *   1. Fetches public/game-rules/manifest.json (local root)
 *   2. Reads CodeRegistry shared object from Sui
 *   3. Compares roots
 *
 * If CodeRegistry doesn't exist yet (pre-deploy) → skip, return verified.
 */

import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { CODE_REGISTRY_ID } from '../config/contracts';
import type { CodeVerificationState, RulesManifest } from '../types';

export function useCodeVerification(): CodeVerificationState {
  const suiClient = useSuiClient();
  const [state, setState] = useState<CodeVerificationState>({
    isVerified: false,
    isLoading: true,
    localRoot: null,
    onChainRoot: null,
    version: 0,
    mismatch: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        // If no registry configured, skip verification (pre-deploy)
        if (!CODE_REGISTRY_ID) {
          if (!cancelled) {
            setState({
              isVerified: true,
              isLoading: false,
              localRoot: null,
              onChainRoot: null,
              version: 0,
              mismatch: false,
              error: null,
            });
          }
          return;
        }

        // 1. Fetch local manifest
        let manifest: RulesManifest;
        try {
          const resp = await fetch('/game-rules/manifest.json');
          if (!resp.ok) throw new Error('manifest not found');
          manifest = await resp.json();
        } catch {
          // No manifest yet — skip verification
          if (!cancelled) {
            setState({
              isVerified: true,
              isLoading: false,
              localRoot: null,
              onChainRoot: null,
              version: 0,
              mismatch: false,
              error: null,
            });
          }
          return;
        }

        // 2. Read on-chain CodeRegistry
        const obj = await suiClient.getObject({
          id: CODE_REGISTRY_ID,
          options: { showContent: true },
        });

        if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
          // Object not found — skip
          if (!cancelled) {
            setState({
              isVerified: true,
              isLoading: false,
              localRoot: manifest.root,
              onChainRoot: null,
              version: manifest.version,
              mismatch: false,
              error: null,
            });
          }
          return;
        }

        const fields = obj.data.content.fields as Record<string, unknown>;
        // merkle_root is stored as vector<u8>, comes back as number[]
        const rootBytes = fields.merkle_root as number[];
        const onChainRoot = rootBytes.length > 0
          ? Array.from(rootBytes).map(b => b.toString(16).padStart(2, '0')).join('')
          : '';
        const version = Number(fields.version ?? 0);

        // 3. Compare
        const mismatch = onChainRoot.length > 0 && manifest.root !== onChainRoot;

        if (!cancelled) {
          setState({
            isVerified: !mismatch,
            isLoading: false,
            localRoot: manifest.root,
            onChainRoot: onChainRoot || null,
            version,
            mismatch,
            error: null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: e instanceof Error ? e.message : 'Verification failed',
          }));
        }
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [suiClient]);

  return state;
}
