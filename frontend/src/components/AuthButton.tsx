/**
 * AuthButton — Unified login UI
 * Handles both wallet connection and zkLogin (Google) authentication.
 * Styled to match the holographic cyan/purple theme.
 */

import { useState, useRef, useEffect } from 'react';
import { ConnectModal, useDisconnectWallet } from '@mysten/dapp-kit';
import { useAuth } from '../hooks/useAuth';

export function AuthButton() {
  const auth = useAuth();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Connected state
  if (auth.isConnected && auth.address) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            navigator.clipboard.writeText(auth.address!);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title={auth.address!}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer group relative"
        >
          <span className="text-green-400">●</span>
          <span className="text-slate-300 text-sm font-mono">
            {copied ? 'Copied!' : `${auth.address!.slice(0, 6)}...${auth.address!.slice(-4)}`}
          </span>
          {auth.method === 'zklogin' && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300">
              Google
            </span>
          )}
          {auth.method === 'wallet' && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
              Wallet
            </span>
          )}
        </button>
        <button
          onClick={() => {
            if (auth.method === 'wallet') {
              disconnectWallet();
            } else {
              auth.zkLoginLogout();
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Loading state (ZK proof generation)
  if (auth.isZkLoginLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-purple-500/30">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400" />
        <span className="text-purple-300 text-sm">Generating ZK proof...</span>
      </div>
    );
  }

  // Not connected — show dropdown with options
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm font-medium"
      >
        Connect
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-slate-900/95 border border-cyan-500/30 backdrop-blur-xl shadow-lg shadow-cyan-500/10 z-50 overflow-hidden">
          {/* Connect Wallet option — uses dapp-kit ConnectModal */}
          <ConnectModal
            trigger={
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors text-left"
                onClick={() => {
                  setDropdownOpen(false);
                  setWalletModalOpen(true);
                }}
              >
                <span className="text-lg">💼</span>
                <div>
                  <div className="text-sm text-white font-medium">Connect Wallet</div>
                  <div className="text-xs text-slate-400">Sui wallet extension</div>
                </div>
              </button>
            }
            open={walletModalOpen}
            onOpenChange={(open) => {
              setWalletModalOpen(open);
              if (!open) setDropdownOpen(false);
            }}
          />

          {/* Sign in with Google — zkLogin */}
          {auth.isZkLoginAvailable && (
            <>
              <div className="border-t border-slate-700/50" />
              <button
                onClick={async () => {
                  setDropdownOpen(false);
                  await auth.beginZkLogin('Google');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors text-left"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <div>
                  <div className="text-sm text-white font-medium">Sign in with Google</div>
                  <div className="text-xs text-slate-400">zkLogin — no wallet needed</div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AuthButton;
