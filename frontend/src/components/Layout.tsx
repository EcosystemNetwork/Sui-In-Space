import React from 'react';

/**
 * Main Application Layout Component
 * Provides the holographic UI frame for the game
 */

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      {/* Animated Stars Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-cyan-500/30 bg-slate-900/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <span className="text-xl">🌌</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    SUI IN SPACE
                  </h1>
                  <p className="text-xs text-slate-400">Galactic DeFi Empire</p>
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
        <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1">
              <NavTab icon="🗺️" label="Star Map" active />
              <NavTab icon="🚀" label="Hangar" />
              <NavTab icon="🤖" label="Agents" />
              <NavTab icon="📜" label="Missions" />
              <NavTab icon="⚡" label="DeFi" />
              <NavTab icon="🏛️" label="Governance" />
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <div className="flex items-center gap-4">
                <span>Current Epoch: 12,847</span>
                <span className="text-cyan-400">●</span>
                <span>GALACTIC: $0.042</span>
                <span className="text-cyan-400">●</span>
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
}

const NavTab: React.FC<NavTabProps> = ({ icon, label, active }) => (
  <button
    className={`
      px-4 py-3 flex items-center gap-2 text-sm font-medium transition-colors
      ${active 
        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }
    `}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

export default Layout;
