import { useState } from 'react';
import Layout, { TabType } from './components/Layout';
import { SpaceCommandView, AgentsView, MissionsView, MarketView, FarmView, DAOView } from './components/views';
import { ActivityLog } from './components/ActivityLog';

/**
 * Main Application Component
 * Implements the full game UI based on gameart.png design
 * Space Command themed interface with GALACTIC/ENERGY economy
 */
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dock');

  const renderView = () => {
    switch (activeTab) {
      case 'dock':
        return <SpaceCommandView />;
      case 'missions':
        return <MissionsView />;
      case 'agents':
        return <AgentsView />;
      case 'market':
        return <MarketView />;
      case 'farm':
        return <FarmView />;
      case 'dao':
        return <DAOView />;
      default:
        return <SpaceCommandView />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      galacticBalance={125000}
      energyBalance={42000}
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
          <div className="space-panel p-4 rounded-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-galactic-cyan">📊</span>
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-metallic-silver">Active Missions</span>
                <span className="text-green-400">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-metallic-silver">Fleet Ships</span>
                <span className="text-galactic-cyan">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-metallic-silver">Agents</span>
                <span className="text-electric-purple">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-metallic-silver">Stations Owned</span>
                <span className="text-solar-orange">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-metallic-silver">Pending Rewards</span>
                <span className="text-energy-gold">1,703 GALACTIC</span>
              </div>
            </div>
          </div>

          {/* Quick Actions - Matching gameart style */}
          <div className="space-panel p-4 rounded-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-galactic-cyan">⚡</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTab('agents')}
                className="space-btn p-3 rounded-lg flex flex-col items-center gap-1"
              >
                <span className="text-xl">🚀</span>
                <span className="text-xs text-metallic-silver">Deploy</span>
              </button>
              <button 
                onClick={() => setActiveTab('market')}
                className="space-btn p-3 rounded-lg flex flex-col items-center gap-1"
              >
                <span className="text-xl">💱</span>
                <span className="text-xs text-metallic-silver">Trade</span>
              </button>
              <button 
                onClick={() => setActiveTab('dock')}
                className="space-btn p-3 rounded-lg flex flex-col items-center gap-1"
              >
                <span className="text-xl">⚒️</span>
                <span className="text-xs text-metallic-silver">Craft</span>
              </button>
              <button 
                onClick={() => setActiveTab('farm')}
                className="space-btn p-3 rounded-lg flex flex-col items-center gap-1"
              >
                <span className="text-xl">📥</span>
                <span className="text-xs text-metallic-silver">Stake</span>
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
