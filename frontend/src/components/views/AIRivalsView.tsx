import React, { useState } from 'react';
import {
  useAIRivalsState,
  type FleetState,
  type AgentInfo,
  type ShipInfo,
  type StationInfo,
  type AgentPhaseState,
} from '../../hooks/useAIRivalsState';
import { ActivityFeed } from './ai-rivals/ActivityFeed';
import { WorldPanel } from './ai-rivals/WorldPanel';
import { EconomyPanel } from './ai-rivals/EconomyPanel';

// ── Utility ──────────────────────────────────────────────────────

function truncAddr(addr: string): string {
  if (!addr) return '\u2014';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-slate-500 font-mono">{label}</span>
      <div className="flex-1">
        <Bar value={value} max={max ?? 100} color={color} />
      </div>
      <span className="w-6 text-right text-slate-400 font-mono">{value}</span>
    </div>
  );
}

// ── Card components ──────────────────────────────────────────────

function AgentCard({ agent, accent }: { agent: AgentInfo; accent: 'cyan' | 'red' }) {
  const border = accent === 'cyan' ? 'border-cyan-500/30' : 'border-red-500/30';
  const barColor = accent === 'cyan' ? 'bg-cyan-400' : 'bg-red-400';

  return (
    <div className={`p-3 rounded-lg bg-slate-800/60 border ${border} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">{agent.name}</span>
        <span className="text-xs text-slate-500 font-mono">Lv{agent.level}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>{agent.type}</span>
        <span className="text-slate-600">|</span>
        <span>{agent.class}</span>
        <span className="text-slate-600">|</span>
        <span>FW v{agent.firmware_version}</span>
      </div>
      <div className="text-xs text-slate-500">
        XP: {agent.experience}
        {agent.is_staked && <span className="ml-2 text-yellow-400">[STAKED]</span>}
        {agent.on_mission && <span className="ml-2 text-green-400">[ON MISSION]</span>}
      </div>
      <div className="space-y-1 pt-1">
        <StatBar label="P" value={agent.processing} color={barColor} />
        <StatBar label="M" value={agent.mobility} color={barColor} />
        <StatBar label="W" value={agent.power} color={barColor} />
        <StatBar label="R" value={agent.resilience} color={barColor} />
      </div>
    </div>
  );
}

function ShipCard({ ship, accent }: { ship: ShipInfo; accent: 'cyan' | 'red' }) {
  const border = accent === 'cyan' ? 'border-cyan-500/30' : 'border-red-500/30';

  return (
    <div className={`p-3 rounded-lg bg-slate-800/60 border ${border} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">{ship.name}</span>
        <span className="text-xs text-slate-400">{ship.class}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-10 text-slate-500">HP</span>
          <div className="flex-1"><Bar value={ship.health} max={ship.max_health} color="bg-green-400" /></div>
          <span className="w-14 text-right text-slate-400">{ship.health}/{ship.max_health}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-10 text-slate-500">Fuel</span>
          <div className="flex-1"><Bar value={ship.fuel} max={ship.max_fuel} color="bg-yellow-400" /></div>
          <span className="w-14 text-right text-slate-400">{ship.fuel}/{ship.max_fuel}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>SPD {ship.speed}</span>
        <span>FP {ship.firepower}</span>
        <span>Crew {ship.crew_count}/{ship.max_crew}</span>
      </div>
      <div className="text-xs text-slate-500">
        Pilot: {ship.pilot ? truncAddr(ship.pilot) : 'none'}
        {ship.is_docked && <span className="ml-2 text-blue-400">[DOCKED]</span>}
      </div>
    </div>
  );
}

function StationCard({ station, accent }: { station: StationInfo; accent: 'cyan' | 'red' }) {
  const border = accent === 'cyan' ? 'border-cyan-500/30' : 'border-red-500/30';

  return (
    <div className={`p-3 rounded-lg bg-slate-800/60 border ${border} space-y-1`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">{station.name}</span>
        <span className="text-xs text-slate-500">Lv{station.level}</span>
      </div>
      <div className="text-xs text-slate-400">{station.type}</div>
      <div className="text-xs text-slate-500 font-mono">
        ({station.coordinates.x}, {station.coordinates.y}, {station.coordinates.z})
      </div>
    </div>
  );
}

// ── Phase badge ──────────────────────────────────────────────────

function PhaseBadge({ phaseState, accent }: { phaseState: AgentPhaseState | null; accent: 'cyan' | 'red' }) {
  if (!phaseState) return null;
  const bg = accent === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${bg}`}>
        {phaseState.phase}
      </span>
      <span className="text-xs text-slate-500">
        R{phaseState.roundsInPhase} / T{phaseState.totalRounds}
      </span>
    </div>
  );
}

// ── Fleet column ─────────────────────────────────────────────────

function FleetColumn({
  name,
  fleet,
  accent,
  phaseState,
}: {
  name: string;
  fleet: FleetState;
  accent: 'cyan' | 'red';
  phaseState: AgentPhaseState | null;
}) {
  const headerBg = accent === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-red-500/10 border-red-500/40';
  const headerText = accent === 'cyan' ? 'text-cyan-400' : 'text-red-400';
  const sectionText = accent === 'cyan' ? 'text-cyan-300' : 'text-red-300';
  const totalAssets = fleet.agents.length + fleet.ships.length + fleet.stations.length;

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <div className={`p-4 rounded-lg border ${headerBg}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-bold ${headerText}`}>{name}</h2>
          <span className="text-xs text-slate-500 font-mono">{truncAddr(fleet.address)}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span>{fleet.agents.length} agents</span>
          <span>{fleet.ships.length} ships</span>
          <span>{fleet.stations.length} stations</span>
          <span className="text-slate-600">|</span>
          <span className={headerText}>{totalAssets} total</span>
        </div>
        <div className="mt-2">
          <PhaseBadge phaseState={phaseState} accent={accent} />
        </div>
      </div>

      {fleet.agents.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${sectionText} mb-2`}>Agents</h3>
          <div className="space-y-2">
            {fleet.agents.map((a) => <AgentCard key={a.id} agent={a} accent={accent} />)}
          </div>
        </div>
      )}

      {fleet.ships.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${sectionText} mb-2`}>Ships</h3>
          <div className="space-y-2">
            {fleet.ships.map((s) => <ShipCard key={s.id} ship={s} accent={accent} />)}
          </div>
        </div>
      )}

      {fleet.stations.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${sectionText} mb-2`}>Stations</h3>
          <div className="space-y-2">
            {fleet.stations.map((st) => <StationCard key={st.id} station={st} accent={accent} />)}
          </div>
        </div>
      )}

      {totalAssets === 0 && (
        <div className="p-6 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
          <p className="text-slate-500 text-sm">No fleet yet</p>
          <p className="text-slate-600 text-xs mt-1">Run <code className="text-slate-400">pnpm agents</code> to start</p>
        </div>
      )}
    </div>
  );
}

// ── Tab types ────────────────────────────────────────────────────

type Tab = 'fleets' | 'world' | 'economy' | 'activity';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fleets', label: 'Fleets' },
  { id: 'world', label: 'World' },
  { id: 'economy', label: 'Economy' },
  { id: 'activity', label: 'Activity' },
];

// ── Main view ────────────────────────────────────────────────────

export const AIRivalsView: React.FC = () => {
  const {
    nexus7, kraitX, world,
    nexus7Phase, kraitXPhase,
    loading, polling, lastUpdated, error, configured, refresh,
  } = useAIRivalsState();
  const [activeTab, setActiveTab] = useState<Tab>('fleets');

  if (!configured) {
    return (
      <div className="p-8 rounded-lg bg-slate-900/80 border border-slate-700 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">AI Rivals</h2>
        <p className="text-slate-400">
          Agent addresses not configured. Run <code className="text-cyan-400">pnpm agents</code> first to
          generate <code className="text-cyan-400">VITE_NEXUS7_ADDRESS</code> and{' '}
          <code className="text-cyan-400">VITE_KRAITX_ADDRESS</code> in your{' '}
          <code className="text-cyan-400">.env</code>.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/80 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-400 bg-clip-text text-transparent">
            AI RIVALS — LIVE
          </h1>
          <span className={`inline-block w-2 h-2 rounded-full ${polling ? 'bg-green-400 animate-pulse' : 'bg-green-500'}`} />
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={polling}
            className="px-3 py-1.5 text-xs rounded bg-slate-800 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
          >
            {polling ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'fleets' && (
        <div className="flex gap-6">
          <FleetColumn name="NEXUS-7" fleet={nexus7} accent="cyan" phaseState={nexus7Phase} />
          <FleetColumn name="KRAIT-X" fleet={kraitX} accent="red" phaseState={kraitXPhase} />
        </div>
      )}

      {activeTab === 'world' && <WorldPanel world={world} />}

      {activeTab === 'economy' && <EconomyPanel world={world} />}

      {activeTab === 'activity' && <ActivityFeed />}
    </div>
  );
};

export default AIRivalsView;
