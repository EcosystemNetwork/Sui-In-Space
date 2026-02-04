import { useState } from 'react';
import Layout, { TabType } from './components/Layout';
import { StarMapView, HangarView, AgentsView, MissionsView, DefiView, GovernanceView } from './components/views';
import { ActivityLog } from './components/ActivityLog';

/**
 * Main Application Component
 * Implements the full game UI as per design specs
 * Enhanced with futuristic sci-fi HUD styling
 */
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('map');

  const renderView = () => {
    switch (activeTab) {
      case 'map':
        return <StarMapView />;
      case 'hangar':
        return <HangarView />;
      case 'agents':
        return <AgentsView />;
      case 'missions':
        return <MissionsView />;
      case 'defi':
        return <DefiView />;
      case 'governance':
        return <GovernanceView />;
      default:
        return <StarMapView />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      galacticBalance={125000}
      energyLevel={85}
      playerLevel={15}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {renderView()}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Stats */}
          <div className="hud-panel hud-corners hud-corners-bottom p-4 rounded-lg">
            <h3 className="text-sm font-display font-bold text-[#00f0ff] mb-3 flex items-center gap-2 tracking-wider uppercase">
              <span>📊</span>
              System Status
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm items-center">
                <span className="text-[#00f0ff]/60 font-mono text-xs">ACTIVE MISSIONS</span>
                <span className="text-[#00ff9d] font-display font-bold">1</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-[#00f0ff]/60 font-mono text-xs">FLEET SHIPS</span>
                <span className="text-[#0080ff] font-display font-bold">3</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-[#00f0ff]/60 font-mono text-xs">AGENTS</span>
                <span className="text-[#bf5af2] font-display font-bold">4</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-[#00f0ff]/60 font-mono text-xs">STATIONS OWNED</span>
                <span className="text-[#ff9500] font-display font-bold">2</span>
              </div>
              <div className="flex justify-between text-sm items-center pt-2 border-t border-[#00f0ff]/20">
                <span className="text-[#00f0ff]/60 font-mono text-xs">PENDING REWARDS</span>
                <span className="text-[#00f0ff] font-display font-bold">1,703 <span className="text-xs opacity-60">GALACTIC</span></span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hud-panel hud-corners hud-corners-bottom p-4 rounded-lg">
            <h3 className="text-sm font-display font-bold text-[#00f0ff] mb-3 flex items-center gap-2 tracking-wider uppercase">
              <span>⚡</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTab('agents')}
                className="hud-card p-3 rounded flex flex-col items-center gap-1 hover:border-[#bf5af2]/50 transition-all group"
              >
                <span className="text-xl">🤖</span>
                <span className="text-xs text-[#00f0ff]/70 group-hover:text-[#bf5af2] transition-colors font-mono">Mint Agent</span>
              </button>
              <button 
                onClick={() => setActiveTab('hangar')}
                className="hud-card p-3 rounded flex flex-col items-center gap-1 hover:border-[#0080ff]/50 transition-all group"
              >
                <span className="text-xl">🚀</span>
                <span className="text-xs text-[#00f0ff]/70 group-hover:text-[#0080ff] transition-colors font-mono">Build Ship</span>
              </button>
              <button 
                onClick={() => setActiveTab('missions')}
                className="hud-card p-3 rounded flex flex-col items-center gap-1 hover:border-[#ff9500]/50 transition-all group"
              >
                <span className="text-xl">📜</span>
                <span className="text-xs text-[#00f0ff]/70 group-hover:text-[#ff9500] transition-colors font-mono">Missions</span>
              </button>
              <button 
                onClick={() => setActiveTab('defi')}
                className="hud-card p-3 rounded flex flex-col items-center gap-1 hover:border-[#00ff9d]/50 transition-all group"
              >
                <span className="text-xl">💰</span>
                <span className="text-xs text-[#00f0ff]/70 group-hover:text-[#00ff9d] transition-colors font-mono">Claim All</span>
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <ActivityLog maxEvents={5} compact />
        </div>
      </div>
    </Layout>
  );
}

export default App;
