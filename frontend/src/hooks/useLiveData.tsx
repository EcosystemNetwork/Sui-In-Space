import React, { createContext, useContext, useMemo } from 'react';
import { useAIFleetsState } from './useAIFleetsState';
import { useAgentActivity } from './useAgentActivity';
import type {
  FleetState, WorldState, AgentPhaseState, AgentInfo, ShipInfo, StationInfo,
} from './useAIFleetsState';
import type { ActivityEntry } from './useAgentActivity';

export type FleetTag = 'NEXUS-7' | 'KRAIT-X';

export interface TaggedAgent extends AgentInfo { fleet: FleetTag }
export interface TaggedShip extends ShipInfo { fleet: FleetTag }
export interface TaggedStation extends StationInfo { fleet: FleetTag }

export interface LiveDataValue {
  nexus7: FleetState;
  kraitX: FleetState;
  world: WorldState;
  nexus7Phase: AgentPhaseState | null;
  kraitXPhase: AgentPhaseState | null;
  allAgents: TaggedAgent[];
  allShips: TaggedShip[];
  allStations: TaggedStation[];
  activity: ActivityEntry[];
  loading: boolean;
  polling: boolean;
  lastUpdated: Date | null;
  error: string | null;
  configured: boolean;
  refresh: () => Promise<void>;
}

const LiveDataContext = createContext<LiveDataValue | null>(null);

export const LiveDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const fleets = useAIFleetsState();
  const activity = useAgentActivity();

  const allAgents = useMemo<TaggedAgent[]>(() => [
    ...fleets.nexus7.agents.map(a => ({ ...a, fleet: 'NEXUS-7' as const })),
    ...fleets.kraitX.agents.map(a => ({ ...a, fleet: 'KRAIT-X' as const })),
  ], [fleets.nexus7.agents, fleets.kraitX.agents]);

  const allShips = useMemo<TaggedShip[]>(() => [
    ...fleets.nexus7.ships.map(s => ({ ...s, fleet: 'NEXUS-7' as const })),
    ...fleets.kraitX.ships.map(s => ({ ...s, fleet: 'KRAIT-X' as const })),
  ], [fleets.nexus7.ships, fleets.kraitX.ships]);

  const allStations = useMemo<TaggedStation[]>(() => [
    ...fleets.nexus7.stations.map(s => ({ ...s, fleet: 'NEXUS-7' as const })),
    ...fleets.kraitX.stations.map(s => ({ ...s, fleet: 'KRAIT-X' as const })),
  ], [fleets.nexus7.stations, fleets.kraitX.stations]);

  const value = useMemo<LiveDataValue>(() => ({
    nexus7: fleets.nexus7,
    kraitX: fleets.kraitX,
    world: fleets.world,
    nexus7Phase: fleets.nexus7Phase,
    kraitXPhase: fleets.kraitXPhase,
    allAgents,
    allShips,
    allStations,
    activity: activity.entries,
    loading: fleets.loading,
    polling: fleets.polling,
    lastUpdated: fleets.lastUpdated,
    error: fleets.error,
    configured: fleets.configured,
    refresh: fleets.refresh,
  }), [fleets, activity.entries, allAgents, allShips, allStations]);

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
};

export function useLiveData(): LiveDataValue {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error('useLiveData must be used within LiveDataProvider');
  return ctx;
}
