import React, { useMemo, useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * Main Application Layout Component
 * Provides the holographic UI frame for the game
 * Enhanced with anime.js animations
 */

export type TabType = 'base' | 'map' | 'hangar' | 'agents' | 'missions' | 'defi' | 'governance';

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
      anime({
        targets: headerRef.current,
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic',
      });
    }
    
    // Animate navigation entrance
    if (navRef.current) {
      anime({
        targets: navRef.current.querySelectorAll('button'),
        translateY: [-10, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(80, { start: 200 }),
        easing: 'easeOutCubic',
      });
    }
    
    // Animate logo with glow effect
    if (logoRef.current) {
      anime({
        targets: logoRef.current,
        boxShadow: [
          '0 0 0px rgba(34, 211, 238, 0)',
          '0 0 20px rgba(34, 211, 238, 0.6)',
          '0 0 10px rgba(34, 211, 238, 0.3)',
        ],
        duration: 2000,
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
      });
    }
    
    // Animate stars with twinkling effect
    if (starsContainerRef.current) {
      const starElements = starsContainerRef.current.querySelectorAll('.star');
      anime({
        targets: starElements,
        opacity: (_el: Element, i: number) => [
          { value: 0.2, duration: 0 },
          { value: stars[i % stars.length].opacity, duration: 1000 + (i % 5) * 500 },
        ],
        scale: [
          { value: 0.5, duration: 0 },
          { value: 1, duration: 800 },
        ],
        delay: anime.stagger(20),
        easing: 'easeOutCubic',
      });
    }
  }, [stars]);
  
  // Animate main content when tab changes
  useEffect(() => {
    if (mainRef.current) {
      anime({
        targets: mainRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        easing: 'easeOutCubic',
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
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header ref={headerRef} className="border-b border-cyan-500/30 bg-slate-900/80 backdrop-blur-md" style={{ opacity: 0 }}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div 
                  ref={logoRef}
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"
                >
                  <span className="text-xl">🌌</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    SUI IN SPACE
                  </h1>
                  <p className="text-xs text-slate-400">Galactic DeFi Empire</p>
                </div>
              </div>

              {/* Player Stats Bar */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700">
                  <span className="text-cyan-400">💎</span>
                  <span className="text-white font-medium">{galacticBalance.toLocaleString()}</span>
                  <span className="text-slate-400">GALACTIC</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700">
                  <span className="text-yellow-400">⚡</span>
                  <span className="text-white font-medium">{energyLevel}/100</span>
                  <span className="text-slate-400">Energy</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700">
                  <span className="text-purple-400">⭐</span>
                  <span className="text-white font-medium">Lv.{playerLevel}</span>
                </div>
              </div>

              {/* Wallet Connection Placeholder */}
              <button className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                Connect Wallet
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav ref={navRef} className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <NavTab
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => onTabChange(item.id)}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main ref={mainRef} className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between text-sm text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span>Current Epoch: 12,847</span>
                <span className="text-cyan-400 hidden sm:inline">●</span>
                <span>GALACTIC: $0.042</span>
                <span className="text-cyan-400 hidden sm:inline">●</span>
                <span>TVL: $12.4M</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-cyan-400 transition-colors">Docs</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">Discord</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a>
              </div>
            </div>
          </div>
        </footer>
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

interface NavTabProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavTab: React.FC<NavTabProps> = ({ icon, label, active, onClick }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleClick = () => {
    if (buttonRef.current && onClick) {
      // Quick pulse animation on click
      anime({
        targets: buttonRef.current,
        scale: [1, 0.95, 1],
        duration: 200,
        easing: 'easeInOutQuad',
      });
      onClick();
    }
  };
  
  const handleMouseEnter = () => {
    if (buttonRef.current && !active) {
      anime({
        targets: buttonRef.current,
        translateY: -2,
        duration: 200,
        easing: 'easeOutCubic',
      });
    }
  };
  
  const handleMouseLeave = () => {
    if (buttonRef.current && !active) {
      anime({
        targets: buttonRef.current,
        translateY: 0,
        duration: 200,
        easing: 'easeOutCubic',
      });
    }
  };
  
  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        px-4 py-3 flex items-center gap-2 text-sm font-medium whitespace-nowrap
        ${active 
          ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }
      `}
      style={{ opacity: 0 }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default Layout;
