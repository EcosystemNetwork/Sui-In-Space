import { useState, lazy, Suspense } from 'react';
import Layout, { TabType } from './components/Layout';
import { ActivityLog } from './components/ActivityLog';
import { usePlayerData } from './hooks/usePlayerData';
import { useGameStore } from './hooks/useGameStore';

// Lazy load view components for better initial load performance
const SpaceBaseMapView = lazy(() => import('./components/views/SpaceBaseMapView').then(m => ({ default: m.SpaceBaseMapView })));
const StarMapView = lazy(() => import('./components/views/StarMapView').then(m => ({ default: m.StarMapView })));
const HangarView = lazy(() => import('./components/views/HangarView').then(m => ({ default: m.HangarView })));
const AgentsView = lazy(() => import('./components/views/AgentsView').then(m => ({ default: m.AgentsView })));
const MissionsView = lazy(() => import('./components/views/MissionsView').then(m => ({ default: m.MissionsView })));
const DefiView = lazy(() => import('./components/views/DefiView').then(m => ({ default: m.DefiView })));
const GovernanceView = lazy(() => import('./components/views/GovernanceView').then(m => ({ default: m.GovernanceView })));
const CharacterMinterView = lazy(() => import('./components/views/CharacterMinterView').then(m => ({ default: m.CharacterMinterView })));

// Loading spinner for lazy components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
  </div>
);

/**
 * Main Application Component
 * Implements the full game UI as per design specs
 */
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('base');

  // Load player data from Supabase when wallet connects
  usePlayerData();

  // Get real player data from store
  const player = useGameStore((s) => s.player);
  const galacticBalance = player ? Number(player.galacticBalance) : 0;
  const playerLevel = player?.agents.length
    ? Math.max(...player.agents.map((a) => a.level))
    : 1;
  const activeMissionsCount = player?.activeMissions.length ?? 0;
  const shipsCount = player?.ships.length ?? 0;
  const agentsCount = player?.agents.length ?? 0;
  const stationsCount = player?.stations.length ?? 0;

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
      case 'minter':
        return <CharacterMinterView />;
      default:
        return <SpaceBaseMapView />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      galacticBalance={galacticBalance}
      energyLevel={85}
      playerLevel={playerLevel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Suspense fallback={<LoadingSpinner />}>
            {renderView()}
          </Suspense>
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
                <span className="text-green-400">{activeMissionsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fleet Ships</span>
                <span className="text-blue-400">{shipsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Agents</span>
                <span className="text-purple-400">{agentsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Stations Owned</span>
                <span className="text-orange-400">{stationsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pending Rewards</span>
                <span className="text-cyan-400">{galacticBalance > 0 ? `${galacticBalance.toLocaleString()} GALACTIC` : '0 GALACTIC'}</span>
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
              <button
                onClick={() => setActiveTab('minter')}
                className="p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-red-500/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-1 col-span-2"
              >
                <span className="text-xl">🧬</span>
                <span className="text-xs text-slate-300">Mint Character</span>
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
