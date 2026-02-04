import React, { useMemo, useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * Main Application Layout Component
 * Provides the holographic UI frame for the game
 * Enhanced with anime.js animations and futuristic sci-fi HUD design
 */

export type TabType = 'map' | 'hangar' | 'agents' | 'missions' | 'defi' | 'governance';

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
  const hudFrameRef = useRef<HTMLDivElement>(null);
  
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
          '0 0 0px rgba(0, 240, 255, 0)',
          '0 0 30px rgba(0, 240, 255, 0.8)',
          '0 0 15px rgba(0, 240, 255, 0.4)',
        ],
        duration: 2000,
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
      });
    }
    
    // Animate HUD frame corners
    if (hudFrameRef.current) {
      anime({
        targets: hudFrameRef.current.querySelectorAll('.hud-corner'),
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 600,
        delay: anime.stagger(100, { start: 300 }),
        easing: 'easeOutCubic',
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
    <div className="min-h-screen bg-[#000a14] text-[#e0f7ff] hud-flicker">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#001020] via-[#000a14] to-[#000510]" />
      
      {/* Hex Grid Background */}
      <div className="fixed inset-0 hex-grid opacity-50" />
      
      {/* Data Grid Overlay */}
      <div className="fixed inset-0 data-grid" />
      
      {/* Animated Stars Background */}
      <div ref={starsContainerRef} className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => (
          <div
            key={i}
            className="star absolute rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0,
              background: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#ffffff' : '#0080ff',
              boxShadow: i % 3 === 0 ? '0 0 4px #00f0ff' : 'none',
            }}
          />
        ))}
      </div>

      {/* HUD Frame Corners */}
      <div ref={hudFrameRef} className="fixed inset-0 pointer-events-none z-50">
        {/* Top Left */}
        <div className="hud-corner absolute top-4 left-4 w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00f0ff] to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-[#00f0ff] to-transparent" />
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]" />
        </div>
        {/* Top Right */}
        <div className="hud-corner absolute top-4 right-4 w-24 h-24">
          <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#00f0ff] to-transparent" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-[#00f0ff] to-transparent" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00f0ff]" />
        </div>
        {/* Bottom Left */}
        <div className="hud-corner absolute bottom-4 left-4 w-24 h-24">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00f0ff] to-transparent" />
          <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-[#00f0ff] to-transparent" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#00f0ff]" />
        </div>
        {/* Bottom Right */}
        <div className="hud-corner absolute bottom-4 right-4 w-24 h-24">
          <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#00f0ff] to-transparent" />
          <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-[#00f0ff] to-transparent" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header ref={headerRef} className="border-b border-[#00f0ff]/30 bg-[#000a14]/90 backdrop-blur-md" style={{ opacity: 0 }}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div 
                  ref={logoRef}
                  className="w-12 h-12 rounded border-2 border-[#00f0ff]/60 bg-gradient-to-br from-[#00f0ff]/20 to-[#0080ff]/10 flex items-center justify-center relative"
                >
                  <span className="text-2xl">🌌</span>
                  <div className="absolute inset-0 border border-[#00f0ff]/20 rounded" style={{ margin: '3px' }} />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-[#00f0ff] text-glow-cyan tracking-wider">
                    SUI IN SPACE
                  </h1>
                  <p className="text-xs text-[#00f0ff]/60 font-mono tracking-widest uppercase">Galactic DeFi Empire</p>
                </div>
              </div>

              {/* Player Stats Bar */}
              <div className="hidden md:flex items-center gap-3 text-sm">
                <div className="hud-panel flex items-center gap-2 px-4 py-2 rounded">
                  <span className="text-[#00f0ff]">💎</span>
                  <span className="font-display font-bold text-[#00f0ff]">{galacticBalance.toLocaleString()}</span>
                  <span className="text-[#00f0ff]/50 text-xs font-mono">GALACTIC</span>
                </div>
                <div className="hud-panel flex items-center gap-2 px-4 py-2 rounded">
                  <span className="text-[#ff9500]">⚡</span>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-[#ff9500]">{energyLevel}</span>
                    <div className="w-16 h-1.5 bg-[#001a30] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#ff9500] to-[#ff6b00] rounded-full transition-all"
                        style={{ width: `${energyLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="hud-panel flex items-center gap-2 px-4 py-2 rounded">
                  <span className="text-[#bf5af2]">⭐</span>
                  <span className="font-display font-bold text-[#bf5af2]">Lv.{playerLevel}</span>
                </div>
              </div>

              {/* Wallet Connection */}
              <button className="hud-btn px-5 py-2.5 rounded font-semibold tracking-wide">
                <span className="relative z-10">Connect Wallet</span>
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav ref={navRef} className="border-b border-[#00f0ff]/20 bg-[#000a14]/80 backdrop-blur-sm">
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
        <footer className="border-t border-[#00f0ff]/20 bg-[#000a14]/90 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between text-sm text-[#00f0ff]/50 flex-wrap gap-2 font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
                  EPOCH: 12,847
                </span>
                <span className="text-[#00f0ff]/20">│</span>
                <span>GALACTIC: <span className="text-[#00f0ff]">$0.042</span></span>
                <span className="text-[#00f0ff]/20">│</span>
                <span>TVL: <span className="text-[#00ff9d]">$12.4M</span></span>
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-[#00f0ff] transition-colors">Docs</a>
                <a href="#" className="hover:text-[#00f0ff] transition-colors">Discord</a>
                <a href="#" className="hover:text-[#00f0ff] transition-colors">Twitter</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Scanner Line Effect */}
      <div className="scanner-line" />

      {/* CRT Scanlines Overlay */}
      <div className="fixed inset-0 pointer-events-none crt-scanlines opacity-[0.03]" />
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
        px-5 py-3 flex items-center gap-2 text-sm font-semibold whitespace-nowrap uppercase tracking-wider relative
        transition-all duration-300
        ${active 
          ? 'text-[#00f0ff] bg-[#00f0ff]/10' 
          : 'text-[#00f0ff]/50 hover:text-[#00f0ff] hover:bg-[#00f0ff]/5'
        }
      `}
      style={{ opacity: 0 }}
    >
      <span>{icon}</span>
      <span className="font-display">{label}</span>
      {active && (
        <>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />
        </>
      )}
    </button>
  );
};

export default Layout;
