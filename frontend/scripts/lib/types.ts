/**
 * Shared types for the AI agent world-builder system.
 */

// ── Phase state machine ──────────────────────────────────────────

export type Phase =
  | 'GENESIS'
  | 'WORLD_BUILD'
  | 'COLONIZE'
  | 'CONTENT'
  | 'ECONOMY'
  | 'MILITARY'
  | 'GOVERNANCE'
  | 'SUSTAIN';

export type AgentRole = 'game_master' | 'rival_player';

// ── Agent persistent state ───────────────────────────────────────

export interface AgentState {
  name: string;
  role: AgentRole;
  address: string;
  phase: Phase;
  roundsInPhase: number;
  totalRounds: number;
  /** Object IDs this agent knows about (own agents, ships, etc.) */
  ownedAgentIds: string[];
  ownedShipIds: string[];
  ownedStationIds: string[];
  /** IDs for specific tracking */
  votingPowerId?: string;
  lpReceiptIds: string[];
  insurancePolicyIds: string[];
}

// ── Shared object IDs (discovered at startup) ────────────────────

export interface AdminCapIds {
  planetAdminCap?: string;
  missionAdminCap?: string;
  defiAdminCap?: string;
  governanceAdminCap?: string;
  agentAdminCap?: string;
  shipAdminCap?: string;
  stationAdminCap?: string;
  registryAdminCap?: string;
  galacticAdminCap?: string;
}

export interface SharedObjectIds {
  treasuryId?: string;
  missionRegistryId?: string;
  governanceRegistryId?: string;
  reactorId?: string;
  insurancePoolId?: string;
  codeRegistryId?: string;
  adminCaps: AdminCapIds;
}

// ── Persisted state file ─────────────────────────────────────────

export interface PersistedState {
  packageId: string;
  sharedObjects: SharedObjectIds;
  nexus7: AgentState;
  kraitX: AgentState;
  /** Discovered planet object IDs */
  planetIds: string[];
  /** Created mission template IDs */
  missionTemplateIds: string[];
  /** Created proposal IDs */
  proposalIds: string[];
  lastUpdated: string;
}

// ── Game state types (matching on-chain objects) ─────────────────

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
  luck: number;
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

export interface GameState {
  agents: AgentInfo[];
  ships: ShipInfo[];
  stations: StationInfo[];
}

// ── World state (shared objects) ─────────────────────────────────

export interface PlanetInfo {
  id: string;
  name: string;
  planet_type: number;
  primary_resource: number;
  secondary_resource: number | null;
  owner: string | null;
  population: number;
  defense_level: number;
  total_reserves: number;
  extracted_resources: number;
  coordinates: {
    galaxy_id: number;
    system_id: number;
    x: number;
    y: number;
    z: number;
  };
  station_count: number;
  is_under_attack: boolean;
}

export interface MissionTemplateInfo {
  id: string;
  name: string;
  description: string;
  mission_type: number;
  difficulty: number;
  min_agent_level: number;
  energy_cost: number;
  galactic_cost: number;
  duration_epochs: number;
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
  swap_fee_bps: number;
  total_swaps: number;
  total_volume_galactic: number;
  total_volume_sui: number;
  is_active: boolean;
}

export interface InsurancePoolInfo {
  id: string;
  reserve: number;
  total_insured: number;
  premium_rate_bps: number;
  payout_rate_bps: number;
  total_claims: number;
  total_premiums: number;
}

export interface GovernanceInfo {
  id: string;
  treasury_balance: number;
  total_proposals: number;
  total_executed: number;
  voting_period: number;
  execution_delay: number;
  proposal_threshold: number;
  quorum_threshold: number;
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

// ── Activity log ─────────────────────────────────────────────────

export interface ActivityEntry {
  timestamp: string;
  agent: string;
  phase: Phase;
  action: string;
  description: string;
  reasoning: string;
  txDigest: string | null;
  success: boolean;
  details?: Record<string, unknown>;
}

// ── Agent profile (runtime) ──────────────────────────────────────

export interface AgentProfile {
  name: string;
  role: AgentRole;
  personality: string;
  temperature: number;
  preferences: string;
}

// ── Constants (mirror contracts) ─────────────────────────────────

export const AGENT_TYPES: Record<string, number> = {
  Human: 0, Cyborg: 1, Android: 2, AlienSynthetic: 3,
};
export const AGENT_CLASSES: Record<string, number> = {
  Hacker: 0, Pilot: 1, MechOperator: 2, QuantumEngineer: 3, Psionic: 4, BountyAI: 5,
};
export const SHIP_CLASSES: Record<string, number> = {
  Scout: 0, Fighter: 1, Freighter: 2, Cruiser: 3, Battleship: 4, Carrier: 5, Dreadnought: 6,
};
export const STATION_TYPES: Record<string, number> = {
  YieldFarm: 0, ResearchLab: 1, BlackMarket: 2, WarpGate: 3, DefensePlatform: 4,
};
export const PLANET_TYPES: Record<string, number> = {
  Terran: 0, GasGiant: 1, IceWorld: 2, Desert: 3, Ocean: 4, Volcanic: 5, Artificial: 6,
};
export const RESOURCE_TYPES: Record<string, number> = {
  Energy: 0, Metal: 1, Bio: 2, Fuel: 3, Quantum: 4, DarkMatter: 5, Psionic: 6, Relics: 7,
};
export const MISSION_TYPES: Record<string, number> = {
  DataHeist: 0, Espionage: 1, Smuggling: 2, AITraining: 3, Combat: 4, Exploration: 5,
};
export const PROPOSAL_TYPES: Record<string, number> = {
  ParameterChange: 0, TreasurySpend: 1, ModuleUpgrade: 2, Emergency: 3,
};

// Reverse lookups
export const AGENT_TYPE_NAMES = Object.fromEntries(Object.entries(AGENT_TYPES).map(([k, v]) => [v, k])) as Record<number, string>;
export const AGENT_CLASS_NAMES = Object.fromEntries(Object.entries(AGENT_CLASSES).map(([k, v]) => [v, k])) as Record<number, string>;
export const SHIP_CLASS_NAMES = Object.fromEntries(Object.entries(SHIP_CLASSES).map(([k, v]) => [v, k])) as Record<number, string>;
export const STATION_TYPE_NAMES = Object.fromEntries(Object.entries(STATION_TYPES).map(([k, v]) => [v, k])) as Record<number, string>;
export const PLANET_TYPE_NAMES = Object.fromEntries(Object.entries(PLANET_TYPES).map(([k, v]) => [v, k])) as Record<number, string>;
export const RESOURCE_TYPE_NAMES = Object.fromEntries(Object.entries(RESOURCE_TYPES).map(([k, v]) => [v, k])) as Record<number, string>;
export const MISSION_TYPE_NAMES = Object.fromEntries(Object.entries(MISSION_TYPES).map(([k, v]) => [v, k])) as Record<number, string>;
export const PROPOSAL_TYPE_NAMES = Object.fromEntries(Object.entries(PROPOSAL_TYPES).map(([k, v]) => [v, k])) as Record<number, string>;
