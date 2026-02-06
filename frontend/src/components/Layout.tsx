import React, { useMemo, useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

/**
 * Main Application Layout Component
 * Provides the holographic UI frame for the game
 * Enhanced with anime.js animations
 */

export type TabType = 'base' | 'map' | 'hangar' | 'agents' | 'missions' | 'defi' | 'governance' | 'minter';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  galacticBalance?: number;
  energyLevel?: number;
  playerLevel?: number;
}

interface NavItem {
  id: TabType;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'base', icon: '🛰️', label: 'Space Base' },
  { id: 'map', icon: '🗺️', label: 'Star Map' },
  { id: 'hangar', icon: '🚀', label: 'Hangar' },
  { id: 'agents', icon: '🤖', label: 'Agents' },
  { id: 'missions', icon: '📜', label: 'Missions' },
  { id: 'defi', icon: '⚡', label: 'DeFi' },
  { id: 'governance', icon: '🏛️', label: 'Governance' },
  { id: 'minter', icon: '🧬', label: 'Char Minter' },
];

// Generate deterministic star positions with more variety
const generateStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const seed1 = ((i * 17) % 100);
    const seed2 = ((i * 31) % 100);
    const seed3 = ((i * 7) % 5);
    const seed4 = (2 + ((i * 13) % 4));
    const seed5 = (0.2 + ((i * 11) % 80) / 100);
    const size = 1 + ((i * 3) % 2);
    stars.push({
      left: seed1,
      top: seed2,
      delay: seed3,
      duration: seed4,
      opacity: seed5,
      size,
    });
  }
  return stars;
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  galacticBalance = 125000,
  energyLevel = 85,
  playerLevel = 15,
}) => {
  // Memoize stars to prevent regeneration on re-renders
  const stars = useMemo(() => generateStars(150), []);

  // Get connected wallet account
  const currentAccount = useCurrentAccount();

  // Refs for animations
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Initial page load animations
  useEffect(() => {
    // Animate header entrance
    if (headerRef.current) {
      animate(headerRef.current, {
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 800,
        ease: 'outCubic',
      });
    }

    // Animate navigation entrance
    if (navRef.current) {
      animate(navRef.current.querySelectorAll('button'), {
        translateY: [-10, 0],
        opacity: [0, 1],
        duration: 600,
        delay: stagger(80, { start: 200 }),
        ease: 'outCubic',
      });
    }

    // Animate logo with glow effect
    if (logoRef.current) {
      animate(logoRef.current, {
        boxShadow: [
          '0 0 0px rgba(34, 211, 238, 0)',
          '0 0 20px rgba(34, 211, 238, 0.6)',
          '0 0 10px rgba(34, 211, 238, 0.3)',
        ],
        duration: 2000,
        ease: 'inOutSine',
        loop: true,
        alternate: true,
      });
    }

    // Animate stars with twinkling effect
    if (starsContainerRef.current) {
      const starElements = starsContainerRef.current.querySelectorAll('.star');
      animate(starElements, {
        opacity: ((_el: HTMLElement, i: number) => [
          { value: 0.2, duration: 0 },
          { value: stars[i % stars.length].opacity, duration: 1000 + (i % 5) * 500 },
        ]) as unknown as number,
        scale: [
          { value: 0.5, duration: 0 },
          { value: 1, duration: 800 },
        ],
        delay: stagger(20),
        ease: 'outCubic',
      });
    }
  }, [stars]);

  // Animate main content when tab changes
  useEffect(() => {
    if (mainRef.current) {
      animate(mainRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        ease: 'outCubic',
      });
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-10" />

      {/* Animated Stars Background */}
      <div ref={starsContainerRef} className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => (
          <div
            key={i}
            className="star absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left Sidebar - Logo, Stats, Nav, Wallet */}
        <aside ref={headerRef} className="w-64 flex-shrink-0 border-r border-cyan-500/30 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-xl flex flex-col neon-glow-cyan" style={{ opacity: 0 }}>
          {/* Logo */}
          <div className="p-4 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div
                ref={logoRef}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center animate-breathe"
              >
                <span className="text-xl">🌌</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent glitch-text">
                  SUI IN SPACE
                </h1>
                <p className="text-xs text-cyan-400/60">Galactic DeFi Empire</p>
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="p-4 border-b border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-cyan-500/20 holographic-shimmer">
              <span className="text-cyan-400">💎</span>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm counter-value text-glow-subtle" style={{ color: '#22d3ee' }}>{galacticBalance.toLocaleString()}</span>
                <span className="text-slate-400 text-xs">GALACTIC</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-yellow-500/20 holographic-shimmer">
              <span className="text-yellow-400">⚡</span>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm counter-value">{energyLevel}/100</span>
                <span className="text-slate-400 text-xs">Energy</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-purple-500/20 holographic-shimmer">
              <span className="text-purple-400">⭐</span>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">Level {playerLevel}</span>
                <span className="text-slate-400 text-xs">Rank: Commander</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav ref={navRef} className="flex-1 p-2 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all btn-futuristic ${activeTab === item.id
                      ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-400 neon-glow-cyan'
                      : 'hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent hover:border-cyan-500/30'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className={`text-sm font-medium ${activeTab === item.id ? 'text-glow-subtle' : ''}`}>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar with Wallet */}
          <div className="flex items-center justify-end p-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              {currentAccount && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700">
                  <span className="text-green-400">●</span>
                  <span className="text-slate-300 text-sm font-mono">
                    {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                  </span>
                </div>
              )}
              <ConnectButton className="!px-4 !py-2 !rounded-lg !bg-cyan-500/20 !border !border-cyan-500/50 !text-cyan-400 hover:!bg-cyan-500/30 !transition-colors" />
            </div>
          </div>

          <main ref={mainRef} className="flex-1 p-6 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-cyan-500/20 bg-gradient-to-r from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-xl">
            <div className="px-6 py-3">
              <div className="flex items-center justify-between text-sm text-slate-400 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span className="counter-value">Epoch: 12,847</span>
                  <span className="text-cyan-400 animate-breathe">●</span>
                  <span className="text-cyan-400">GALACTIC: $0.042</span>
                  <span className="text-cyan-400 animate-breathe">●</span>
                  <span className="text-green-400">TVL: $12.4M</span>
                </div>
                <div className="flex items-center gap-4">
                  <a href="#" className="hover:text-cyan-400 transition-colors hover:text-glow">Docs</a>
                  <a href="#" className="hover:text-cyan-400 transition-colors hover:text-glow">Discord</a>
                  <a href="#" className="hover:text-cyan-400 transition-colors hover:text-glow">Twitter</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.03) 2px, rgba(0, 255, 136, 0.03) 4px)',
        }} />
      </div>
    </div>
  );
};


export default Layout;
