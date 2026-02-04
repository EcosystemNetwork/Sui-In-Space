import { useState } from 'react';
import Layout, { TabType } from './components/Layout';
import { StarMapView, HangarView, AgentsView, MissionsView, DefiView, GovernanceView, SpaceBaseMapView } from './components/views';
import { ActivityLog } from './components/ActivityLog';

/**
 * Main Application Component
 * Implements the full game UI as per design specs
 */
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('base');

  const renderView = () => {
    switch (activeTab) {
      case 'base':
        return <SpaceBaseMapView />;
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
        return <SpaceBaseMapView />;
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
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-cyan-400">📊</span>
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Active Missions</span>
                <span className="text-green-400">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fleet Ships</span>
                <span className="text-blue-400">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Agents</span>
                <span className="text-purple-400">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Stations Owned</span>
                <span className="text-orange-400">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pending Rewards</span>
                <span className="text-cyan-400">1,703 GALACTIC</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-700">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-cyan-400">⚡</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTab('agents')}
                className="p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-1"
              >
                <span className="text-xl">🤖</span>
                <span className="text-xs text-slate-300">Mint Agent</span>
              </button>
              <button 
                onClick={() => setActiveTab('hangar')}
                className="p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-1"
              >
                <span className="text-xl">🚀</span>
                <span className="text-xs text-slate-300">Build Ship</span>
              </button>
              <button 
                onClick={() => setActiveTab('missions')}
                className="p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-yellow-500/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-1"
              >
                <span className="text-xl">📜</span>
                <span className="text-xs text-slate-300">Missions</span>
              </button>
              <button 
                onClick={() => setActiveTab('defi')}
                className="p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-green-500/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-1"
              >
                <span className="text-xl">💰</span>
                <span className="text-xs text-slate-300">Claim All</span>
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
