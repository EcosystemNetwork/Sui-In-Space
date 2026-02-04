import React, { useMemo, useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * Main Application Layout Component
 * Space Command themed UI matching gameart.png design
 * Features: Header with GALACTIC/ENERGY display, navigation tabs (Dock, Missions, Agents, Market, Farm, DAO)
 */

export type TabType = 'dock' | 'missions' | 'agents' | 'market' | 'farm' | 'dao';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  galacticBalance?: number;
  energyBalance?: number;
  playerLevel?: number;
}

interface NavItem {
  id: TabType;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dock', icon: '🚀', label: 'Dock' },
  { id: 'missions', icon: '📜', label: 'Missions' },
  { id: 'agents', icon: '🤖', label: 'Agents' },
  { id: 'market', icon: '💱', label: 'Market' },
  { id: 'farm', icon: '🌾', label: 'Farm' },
  { id: 'dao', icon: '🏛️', label: 'DAO' },
];

// Generate deterministic star positions
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
  energyBalance = 42000,
  // playerLevel reserved for future use
}) => {
  const stars = useMemo(() => generateStars(100), []);
  
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  
  // Initial page load animations
  useEffect(() => {
    if (headerRef.current) {
      anime({
        targets: headerRef.current,
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic',
      });
    }
    
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
    
    if (starsContainerRef.current) {
      const starElements = starsContainerRef.current.querySelectorAll('.star');
      anime({
        targets: starElements,
        opacity: (_el: Element, i: number) => [
          { value: 0.1, duration: 0 },
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
    <div className="min-h-screen bg-space-darker text-white">
      {/* Background - Deep space gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-space-dark via-space-darker to-black" />
      
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

      {/* Subtle cyan glow overlay */}
      <div className="fixed inset-0 bg-cyan-glow pointer-events-none opacity-30" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header - Space Command Style */}
        <header 
          ref={headerRef} 
          className="border-b border-space-border bg-space-panel/95 backdrop-blur-md" 
          style={{ opacity: 0 }}
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div 
                  ref={logoRef}
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-galactic-cyan to-galactic-blue flex items-center justify-center"
                >
                  <span className="text-xl">🌌</span>
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-galactic-cyan tracking-wider">
                    SUI IN SPACE
                  </h1>
                  <p className="text-xs text-metallic-silver">Sector 1d5.d8</p>
                </div>
              </div>

              {/* Resource Display - Matching gameart style */}
              <div className="hidden md:flex items-center gap-3">
                {/* GALACTIC Balance */}
                <div className="resource-badge">
                  <span className="text-energy-gold text-lg">💰</span>
                  <span className="text-white font-bold">{galacticBalance.toLocaleString()}</span>
                  <span className="text-metallic-silver text-sm">GALACTIC</span>
                </div>
                
                {/* ENERGY Balance */}
                <div className="resource-badge">
                  <span className="text-galactic-cyan text-lg">⚡</span>
                  <span className="text-white font-bold">{energyBalance.toLocaleString()}</span>
                  <span className="text-metallic-silver text-sm">ENERGY</span>
                </div>
              </div>

              {/* Action Icons & Wallet */}
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-space-border/50 transition-colors text-galactic-cyan">
                  <span className="text-xl">💧</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-space-border/50 transition-colors text-metallic-silver">
                  <span className="text-xl">✉️</span>
                </button>
                <button className="p-2 rounded-lg hover:bg-space-border/50 transition-colors text-metallic-silver">
                  <span className="text-xl">👥</span>
                </button>
                <button className="space-btn px-4 py-2 rounded-lg text-galactic-cyan font-medium text-sm">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation - Tab style matching gameart */}
        <nav ref={navRef} className="border-b border-space-border bg-space-dark/80 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1">
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
        <footer className="border-t border-space-border bg-space-panel/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between text-sm text-metallic-silver flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span>Current Epoch: <span className="text-galactic-cyan">12,847</span></span>
                <span className="text-galactic-cyan hidden sm:inline">●</span>
                <span>GALACTIC: <span className="text-energy-gold">$0.042</span></span>
                <span className="text-galactic-cyan hidden sm:inline">●</span>
                <span>TVL: <span className="text-white">$12.4M</span></span>
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-galactic-cyan transition-colors">Docs</a>
                <a href="#" className="hover:text-galactic-cyan transition-colors">Discord</a>
                <a href="#" className="hover:text-galactic-cyan transition-colors">Twitter</a>
              </div>
            </div>
          </div>
        </footer>
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
        nav-tab flex items-center gap-2 whitespace-nowrap
        ${active ? 'active' : ''}
      `}
      style={{ opacity: 0 }}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default Layout;
