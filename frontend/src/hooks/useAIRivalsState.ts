import { useState, useEffect, useCallback, useRef } from 'react';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import {
  PACKAGE_ID,
  AGENT_TYPE_NAMES,
  AGENT_CLASS_NAMES,
  SHIP_CLASS_NAMES,
  STATION_TYPE_NAMES,
  AI_AGENT_ADDRESSES,
} from '../config/contracts';

// ── Lightweight types matching on-chain fields ───────────────────

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  class: string;
  level: number;
  experience: number;
  processing: number;
  mobility: number;
  power: number;
  resilience: number;
  firmware_version: number;
  is_staked: boolean;
  on_mission: boolean;
}

export interface ShipInfo {
  id: string;
  name: string;
  class: string;
  health: number;
  max_health: number;
  speed: number;
  firepower: number;
  fuel: number;
  max_fuel: number;
  crew_count: number;
  max_crew: number;
  pilot: string | null;
  is_docked: boolean;
}

export interface StationInfo {
  id: string;
  name: string;
  type: string;
  level: number;
  coordinates: { x: number; y: number; z: number };
}

export interface FleetState {
  address: string;
  agents: AgentInfo[];
  ships: ShipInfo[];
  stations: StationInfo[];
}

// ── World state types ────────────────────────────────────────────

export interface PlanetInfo {
  id: string;
  name: string;
  planet_type: number;
  primary_resource: number;
  owner: string | null;
  population: number;
  defense_level: number;
  total_reserves: number;
  extracted_resources: number;
  is_under_attack: boolean;
}

export interface MissionTemplateInfo {
  id: string;
  name: string;
  mission_type: number;
  difficulty: number;
  base_reward: number;
  experience_reward: number;
  times_completed: number;
  is_active: boolean;
}

export interface ReactorInfo {
  id: string;
  galactic_reserve: number;
  sui_reserve: number;
  total_lp_shares: number;
  total_swaps: number;
  total_volume_galactic: number;
  total_volume_sui: number;
  is_active: boolean;
}

export interface InsurancePoolInfo {
  id: string;
  reserve: number;
  total_insured: number;
  total_claims: number;
  total_premiums: number;
}

export interface GovernanceInfo {
  id: string;
  treasury_balance: number;
  total_proposals: number;
  total_executed: number;
}

export interface TreasuryInfo {
  id: string;
  total_minted: number;
  max_supply: number;
}

export interface WorldState {
  planets: PlanetInfo[];
  missionTemplates: MissionTemplateInfo[];
  reactor: ReactorInfo | null;
  insurancePool: InsurancePoolInfo | null;
  governance: GovernanceInfo | null;
  treasury: TreasuryInfo | null;
}

export interface AgentPhaseState {
  name: string;
  phase: string;
  roundsInPhase: number;
  totalRounds: number;
}

// ── Internal persisted state shape (from agent-state.json) ───────

interface PersistedStateJson {
  packageId: string;
  sharedObjects: {
    treasuryId?: string;
    missionRegistryId?: string;
    governanceRegistryId?: string;
    reactorId?: string;
    insurancePoolId?: string;
  };
  nexus7: { phase: string; roundsInPhase: number; totalRounds: number };
  kraitX: { phase: string; roundsInPhase: number; totalRounds: number };
  planetIds: string[];
  missionTemplateIds: string[];
}

const EMPTY_FLEET: FleetState = { address: '', agents: [], ships: [], stations: [] };
const EMPTY_WORLD: WorldState = { planets: [], missionTemplates: [], reactor: null, insurancePool: null, governance: null, treasury: null };

const POLL_INTERVAL = 8000;

const testnetClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl('testnet'),
  network: 'testnet',
});

// ── Fleet query (unchanged logic) ────────────────────────────────

async function queryFleet(ownerAddress: string): Promise<FleetState> {
  const fleet: FleetState = { address: ownerAddress, agents: [], ships: [], stations: [] };
  let cursor: string | null | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await testnetClient.getOwnedObjects({
      owner: ownerAddress,
      options: { showType: true, showContent: true },
      ...(cursor ? { cursor } : {}),
    });

    for (const obj of page.data) {
      const type = obj.data?.type || '';
      const content = obj.data?.content;
      const fields = content && 'fields' in content ? (content as any).fields : null;
      if (!fields) continue;

      if (type.startsWith(`${PACKAGE_ID}::agent::Agent`)) {
        fleet.agents.push({
          id: obj.data!.objectId,
          name: fields.name || 'Unknown',
          type: AGENT_TYPE_NAMES[fields.agent_type] || String(fields.agent_type),
          class: AGENT_CLASS_NAMES[fields.class] || String(fields.class),
          level: Number(fields.level || 1),
          experience: Number(fields.experience || 0),
          processing: Number(fields.processing || 0),
          mobility: Number(fields.mobility || 0),
          power: Number(fields.power || 0),
          resilience: Number(fields.resilience || 0),
          firmware_version: Number(fields.firmware_version || 1),
          is_staked: Boolean(fields.is_staked),
          on_mission:
            fields.current_mission !== null &&
            fields.current_mission !== undefined &&
            (typeof fields.current_mission === 'object'
              ? Object.keys(fields.current_mission).length > 0
              : false),
        });
      } else if (type.startsWith(`${PACKAGE_ID}::ship::Ship`)) {
        const pilotField = fields.pilot;
        const pilotId =
          pilotField && typeof pilotField === 'object' && Object.keys(pilotField).length > 0
            ? String(Object.values(pilotField)[0])
            : null;
        fleet.ships.push({
          id: obj.data!.objectId,
          name: fields.name || 'Unknown',
          class: SHIP_CLASS_NAMES[fields.ship_class] || String(fields.ship_class),
          health: Number(fields.current_health || 0),
          max_health: Number(fields.max_health || 0),
          speed: Number(fields.speed || 0),
          firepower: Number(fields.firepower || 0),
          fuel: Number(fields.fuel || 0),
          max_fuel: Number(fields.max_fuel || 0),
          crew_count: Array.isArray(fields.crew) ? fields.crew.length : 0,
          max_crew: Number(fields.max_crew || 0),
          pilot: pilotId,
          is_docked: Boolean(fields.is_docked),
        });
      } else if (type.startsWith(`${PACKAGE_ID}::station::Station`)) {
        fleet.stations.push({
          id: obj.data!.objectId,
          name: fields.name || 'Unknown',
          type: STATION_TYPE_NAMES[fields.station_type] || String(fields.station_type),
          level: Number(fields.level || 1),
          coordinates: {
            x: Number(fields.coordinates_x || 0),
            y: Number(fields.coordinates_y || 0),
            z: Number(fields.coordinates_z || 0),
          },
        });
      }
    }

    hasMore = page.hasNextPage;
    cursor = page.nextCursor;
  }

  return fleet;
}

// ── World state queries ──────────────────────────────────────────

async function fetchObjectFields(id: string): Promise<any | null> {
  try {
    const obj = await testnetClient.getObject({ id, options: { showContent: true } });
    return obj.data?.content && 'fields' in obj.data.content ? (obj.data.content as any).fields : null;
  } catch {
    return null;
  }
}

async function queryWorldState(persistedState: PersistedStateJson | null): Promise<WorldState> {
  if (!persistedState) return EMPTY_WORLD;

  const world: WorldState = { planets: [], missionTemplates: [], reactor: null, insurancePool: null, governance: null, treasury: null };

  // Planets
  for (const id of (persistedState.planetIds || [])) {
    const f = await fetchObjectFields(id);
    if (!f) continue;
    const ownerField = f.owner;
    const ZERO_ADDR = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const owner = ownerField && typeof ownerField === 'string' && ownerField !== ZERO_ADDR
      ? ownerField
      : (ownerField && typeof ownerField === 'object' && Object.keys(ownerField).length > 0
        ? String(Object.values(ownerField)[0]) : null);
    world.planets.push({
      id, name: f.name || 'Unknown',
      planet_type: Number(f.planet_type || 0),
      primary_resource: Number(f.primary_resource || 0),
      owner, population: Number(f.population || 0),
      defense_level: Number(f.defense_level || 0),
      total_reserves: Number(f.total_reserves || 0),
      extracted_resources: Number(f.extracted_resources || 0),
      is_under_attack: Boolean(f.is_under_attack),
    });
  }

  // Mission templates
  for (const id of (persistedState.missionTemplateIds || [])) {
    const f = await fetchObjectFields(id);
    if (!f) continue;
    world.missionTemplates.push({
      id, name: f.name || 'Unknown',
      mission_type: Number(f.mission_type || 0),
      difficulty: Number(f.difficulty || 1),
      base_reward: Number(f.base_reward || 0),
      experience_reward: Number(f.experience_reward || 0),
      times_completed: Number(f.times_completed || 0),
      is_active: f.is_active !== false,
    });
  }

  // Reactor
  if (persistedState.sharedObjects.reactorId) {
    const f = await fetchObjectFields(persistedState.sharedObjects.reactorId);
    if (f) {
      world.reactor = {
        id: persistedState.sharedObjects.reactorId,
        galactic_reserve: Number(f.galactic_reserve || 0),
        sui_reserve: Number(f.sui_reserve || 0),
        total_lp_shares: Number(f.total_lp_shares || 0),
        total_swaps: Number(f.total_swaps || 0),
        total_volume_galactic: Number(f.total_volume_galactic || 0),
        total_volume_sui: Number(f.total_volume_sui || 0),
        is_active: f.is_active !== false,
      };
    }
  }

  // Insurance pool
  if (persistedState.sharedObjects.insurancePoolId) {
    const f = await fetchObjectFields(persistedState.sharedObjects.insurancePoolId);
    if (f) {
      world.insurancePool = {
        id: persistedState.sharedObjects.insurancePoolId,
        reserve: Number(f.galactic_reserve || 0),
        total_insured: Number(f.total_insured || 0),
        total_claims: Number(f.total_claims || 0),
        total_premiums: Number(f.total_premiums || 0),
      };
    }
  }

  // Governance
  if (persistedState.sharedObjects.governanceRegistryId) {
    const f = await fetchObjectFields(persistedState.sharedObjects.governanceRegistryId);
    if (f) {
      world.governance = {
        id: persistedState.sharedObjects.governanceRegistryId,
        treasury_balance: Number(f.treasury_balance || 0),
        total_proposals: Number(f.total_proposals || 0),
        total_executed: Number(f.total_executed || 0),
      };
    }
  }

  // Treasury
  if (persistedState.sharedObjects.treasuryId) {
    const f = await fetchObjectFields(persistedState.sharedObjects.treasuryId);
    if (f) {
      world.treasury = {
        id: persistedState.sharedObjects.treasuryId,
        total_minted: Number(f.total_minted || 0),
        max_supply: Number(f.max_supply || 0),
      };
    }
  }

  return world;
}

// ── Main hook ────────────────────────────────────────────────────

export function useAIRivalsState() {
  const [nexus7, setNexus7] = useState<FleetState>(EMPTY_FLEET);
  const [kraitX, setKraitX] = useState<FleetState>(EMPTY_FLEET);
  const [world, setWorld] = useState<WorldState>(EMPTY_WORLD);
  const [nexus7Phase, setNexus7Phase] = useState<AgentPhaseState | null>(null);
  const [kraitXPhase, setKraitXPhase] = useState<AgentPhaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const persistedRef = useRef<PersistedStateJson | null>(null);

  const nexusAddr = AI_AGENT_ADDRESSES.NEXUS7;
  const kraitAddr = AI_AGENT_ADDRESSES.KRAITX;
  const configured = Boolean(nexusAddr && kraitAddr);

  // Fetch agent-state.json on mount
  const fetchPersistedState = useCallback(async () => {
    try {
      const res = await fetch('/agent-state.json');
      if (res.ok) {
        persistedRef.current = await res.json();
        // Update phase states
        if (persistedRef.current) {
          const ps = persistedRef.current;
          setNexus7Phase({ name: 'NEXUS-7', phase: ps.nexus7.phase, roundsInPhase: ps.nexus7.roundsInPhase, totalRounds: ps.nexus7.totalRounds });
          setKraitXPhase({ name: 'KRAIT-X', phase: ps.kraitX.phase, roundsInPhase: ps.kraitX.roundsInPhase, totalRounds: ps.kraitX.totalRounds });
        }
      }
    } catch { /* not available yet */ }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!configured) return;
    setPolling(true);
    try {
      // Fetch persisted state (for shared object IDs + phase info)
      await fetchPersistedState();

      // Fetch fleet states
      const [n, k] = await Promise.all([queryFleet(nexusAddr), queryFleet(kraitAddr)]);
      setNexus7(n);
      setKraitX(k);

      // Fetch world state from shared objects
      const w = await queryWorldState(persistedRef.current);
      setWorld(w);

      setLastUpdated(new Date());
      setError(null);
    } catch (e: any) {
      setError(e.message?.slice(0, 200) || 'Failed to fetch state');
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, [configured, nexusAddr, kraitAddr, fetchPersistedState]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll, configured]);

  return {
    nexus7, kraitX, world,
    nexus7Phase, kraitXPhase,
    loading, polling, lastUpdated, error, configured,
    refresh: fetchAll,
  };
}
