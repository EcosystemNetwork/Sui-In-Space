/**
 * Adapter functions that map live on-chain hook types to the existing
 * display types used by view components. This allows views to consume
 * real data with zero changes to their rendering logic.
 */

import type { Agent, Ship } from '../types';
import { AgentType, AgentClass, ShipClass, MissionType, ProposalType, ProposalStatus } from '../types';
import type { TaggedAgent, TaggedShip, TaggedStation } from '../hooks/useLiveData';
import type { MissionTemplateInfo, ProposalInfo, PlanetInfo } from '../hooks/useAIFleetsState';
import type { ActivityEntry } from '../hooks/useAgentActivity';
import {
  AGENT_TYPE_NAMES, AGENT_CLASS_NAMES, SHIP_CLASS_NAMES,
  MISSION_TYPE_NAMES as CONTRACT_MISSION_TYPE_NAMES,
  AI_AGENT_ADDRESSES,
} from '../config/contracts';

// ── String → enum helpers ────────────────────────────────────────

function nameToAgentType(name: string): AgentType {
  const map: Record<string, AgentType> = { Human: AgentType.Human, Cyborg: AgentType.Cyborg, Android: AgentType.Android, AlienSynthetic: AgentType.AlienSynthetic };
  return map[name] ?? AgentType.Human;
}

function nameToAgentClass(name: string): AgentClass {
  const map: Record<string, AgentClass> = { Hacker: AgentClass.Hacker, Pilot: AgentClass.Pilot, MechOperator: AgentClass.MechOperator, QuantumEngineer: AgentClass.QuantumEngineer, Psionic: AgentClass.Psionic, BountyAI: AgentClass.BountyAI };
  return map[name] ?? AgentClass.Hacker;
}

function nameToShipClass(name: string): ShipClass {
  const map: Record<string, ShipClass> = { Scout: ShipClass.Scout, Fighter: ShipClass.Fighter, Freighter: ShipClass.Freighter, Cruiser: ShipClass.Cruiser, Battleship: ShipClass.Battleship, Carrier: ShipClass.Carrier, Dreadnought: ShipClass.Dreadnought };
  return map[name] ?? ShipClass.Scout;
}

// ── Agent adapter ────────────────────────────────────────────────

export function agentInfoToAgent(a: TaggedAgent): Agent & { fleet: string } {
  const typeName = AGENT_TYPE_NAMES[Number(a.type)] || a.type;
  const className = AGENT_CLASS_NAMES[Number(a.class)] || a.class;
  return {
    id: a.id,
    name: a.name,
    agentType: nameToAgentType(typeName),
    class: nameToAgentClass(className),
    stats: {
      processing: a.processing,
      mobility: a.mobility,
      power: a.power,
      resilience: a.resilience,
      luck: 0,
      neuralBandwidth: 0,
    },
    level: a.level,
    experience: a.experience,
    firmwareVersion: a.firmware_version,
    aiModelLineage: `${a.fleet} AI`,
    augmentSlots: [],
    maxAugmentSlots: 3,
    missionsCompleted: 0,
    battlesWon: 0,
    totalEarnings: BigInt(0),
    isStaked: a.is_staked,
    stakedAt: null,
    currentMission: a.on_mission ? 'active' : null,
    fleet: a.fleet,
  };
}

// ── Ship adapter ─────────────────────────────────────────────────

export function shipInfoToShip(s: TaggedShip): Ship & { fleet: string } {
  const className = SHIP_CLASS_NAMES[Number(s.class)] || s.class;
  return {
    id: s.id,
    name: s.name,
    shipClass: nameToShipClass(className),
    modules: { hull: null, engine: null, aiCore: null, weapon: null, utility: null },
    maxHealth: s.max_health,
    currentHealth: s.health,
    speed: s.speed,
    firepower: s.firepower,
    cargoCapacity: 0,
    fuelEfficiency: 0,
    pilot: s.pilot,
    crew: [],
    maxCrew: s.max_crew,
    isDocked: s.is_docked,
    dockedAt: null,
    inCombat: false,
    fuel: s.fuel,
    maxFuel: s.max_fuel,
    fleet: s.fleet,
  };
}

// ── Mission template adapter ─────────────────────────────────────

export interface DemoMission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  difficulty: number;
  duration: string;
  requirements: { minLevel: number; minProcessing?: number; minMobility?: number; minPower?: number };
  rewards: { galactic: number; experience: number; lootChance: number };
  successRate: number;
  timesCompleted: number;
}

const DIFFICULTY_DURATIONS = ['1 hour', '2 hours', '4 hours', '6 hours', '12 hours'];

export function missionTemplateToDemo(m: MissionTemplateInfo): DemoMission {
  const typeName = CONTRACT_MISSION_TYPE_NAMES[m.mission_type];
  const typeEnum = (MissionType as any)[typeName] as MissionType | undefined;
  return {
    id: m.id,
    name: m.name,
    description: `${typeName || 'Unknown'} mission — difficulty ${m.difficulty}`,
    type: typeEnum ?? MissionType.Exploration,
    difficulty: Math.min(m.difficulty, 5),
    duration: DIFFICULTY_DURATIONS[Math.min(m.difficulty - 1, 4)] || '4 hours',
    requirements: { minLevel: Math.max(1, m.difficulty * 3) },
    rewards: { galactic: m.base_reward, experience: m.experience_reward, lootChance: 15 },
    successRate: Math.max(40, 100 - m.difficulty * 10),
    timesCompleted: m.times_completed,
  };
}

// ── Proposal adapter ─────────────────────────────────────────────

export interface DemoProposal {
  id: string;
  proposalId: number;
  title: string;
  description: string;
  proposer: string;
  proposalType: ProposalType;
  votesFor: number;
  votesAgainst: number;
  status: ProposalStatus;
  createdAt: string;
  endsAt: string;
  executionAfter: string;
  quorumReached: boolean;
}

function epochToRelative(epochMs: number): string {
  if (!epochMs) return '-';
  const now = Date.now();
  const diff = epochMs - now;
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

function epochToAge(epochMs: number): string {
  if (!epochMs) return '-';
  const diff = Date.now() - epochMs;
  if (diff < 0) return 'just now';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function proposalStatusFromNumber(n: number): ProposalStatus {
  // On-chain: 0=Active, 1=Passed, 2=Rejected, 3=Executed, 4=Cancelled
  const map: Record<number, ProposalStatus> = {
    0: ProposalStatus.Active,
    1: ProposalStatus.Passed,
    2: ProposalStatus.Rejected,
    3: ProposalStatus.Executed,
    4: ProposalStatus.Cancelled,
  };
  return map[n] ?? ProposalStatus.Active;
}

function proposalTypeFromNumber(n: number): ProposalType {
  // On-chain: 0=ParameterChange, 1=TreasurySpend, 2=ModuleUpgrade, 3=Emergency
  // UI types: 0=Parameter, 1=Emission, 2=Feature, 3=War, 4=Upgrade
  const map: Record<number, ProposalType> = {
    0: ProposalType.Parameter,
    1: ProposalType.Emission,
    2: ProposalType.Upgrade,
    3: ProposalType.War,
  };
  return map[n] ?? ProposalType.Parameter;
}

export function proposalInfoToDemo(p: ProposalInfo, index: number): DemoProposal {
  const status = proposalStatusFromNumber(p.status);
  return {
    id: p.id,
    proposalId: index + 1,
    title: p.title,
    description: p.description,
    proposer: p.id.slice(0, 10) + '...',
    proposalType: proposalTypeFromNumber(p.proposal_type),
    votesFor: p.votes_for,
    votesAgainst: p.votes_against,
    status,
    createdAt: epochToAge(p.created_at),
    endsAt: status === ProposalStatus.Active ? epochToRelative(p.voting_ends_at) : 'Ended',
    executionAfter: status === ProposalStatus.Executed ? 'Executed' : epochToRelative(p.execution_after),
    quorumReached: (p.votes_for + p.votes_against) > 0,
  };
}

// ── Planet → StarSystem adapter ──────────────────────────────────

export interface StarSystem {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'terran' | 'gas' | 'ice' | 'desert' | 'volcanic';
  planets: number;
  stations: number;
  claimed: boolean;
  playerOwned: boolean;
  owner: string | null;
}

const PLANET_TYPE_TO_SYSTEM: Record<number, StarSystem['type']> = {
  0: 'terran',    // Terran
  1: 'gas',       // GasGiant
  2: 'ice',       // IceWorld
  3: 'desert',    // Desert
  4: 'terran',    // Ocean
  5: 'volcanic',  // Volcanic
  6: 'terran',    // Artificial
};

export function planetToStarSystem(p: PlanetInfo, index: number, total: number): StarSystem {
  // Deterministic position spread
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = 25 + (index % 3) * 12;
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius;

  const isNexus = p.owner === AI_AGENT_ADDRESSES.NEXUS7;
  const isKrait = p.owner === AI_AGENT_ADDRESSES.KRAITX;

  return {
    id: p.id,
    name: p.name,
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
    type: PLANET_TYPE_TO_SYSTEM[p.planet_type] || 'terran',
    planets: 1,
    stations: 0,
    claimed: !!p.owner,
    playerOwned: false,
    owner: isNexus ? 'NEXUS-7' : isKrait ? 'KRAIT-X' : (p.owner ? 'Unknown' : null),
  };
}

// ── Station adapter for DeFi view ────────────────────────────────

export interface DemoStation {
  id: string;
  name: string;
  type: number;
  level: number;
  totalStaked: number;
  apy: number;
  operators: number;
  maxOperators: number;
  efficiency: number;
  playerStake: number;
  pendingRewards: number;
  fleet: string;
}

export function stationInfoToDemo(s: TaggedStation): DemoStation {
  return {
    id: s.id,
    name: s.name,
    type: Number(s.type) || 0,
    level: s.level,
    totalStaked: 0,
    apy: 0,
    operators: 0,
    maxOperators: 0,
    efficiency: 0,
    playerStake: 0,
    pendingRewards: 0,
    fleet: s.fleet,
  };
}

// ── Activity → ActivityEvent adapter ─────────────────────────────

export interface ActivityEvent {
  id: string;
  type: 'mission' | 'battle' | 'levelup' | 'reward' | 'purchase' | 'stake' | 'governance';
  message: string;
  timestamp: string;
  details?: string;
}

const ACTION_TO_TYPE: Record<string, ActivityEvent['type']> = {
  mint_agent: 'purchase',
  build_ship: 'purchase',
  build_station: 'purchase',
  start_mission: 'mission',
  complete_mission: 'mission',
  train_agent: 'levelup',
  stake_agent: 'stake',
  unstake_agent: 'stake',
  add_liquidity: 'stake',
  remove_liquidity: 'stake',
  swap: 'reward',
  claim_yield: 'reward',
  create_proposal: 'governance',
  vote: 'governance',
  explore_planet: 'mission',
  claim_planet: 'mission',
  attack_planet: 'battle',
};

export function formatRelativeTime(isoTimestamp: string): string {
  try {
    const diff = Date.now() - new Date(isoTimestamp).getTime();
    if (diff < 0) return 'just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return isoTimestamp;
  }
}

export function activityEntryToEvent(entry: ActivityEntry, index: number): ActivityEvent {
  return {
    id: `activity-${index}-${entry.timestamp}`,
    type: ACTION_TO_TYPE[entry.action] || 'mission',
    message: `[${entry.agent}] ${entry.description}`,
    timestamp: formatRelativeTime(entry.timestamp),
    details: entry.txDigest ? `TX: ${entry.txDigest.slice(0, 12)}...` : (entry.success ? 'Success' : 'Failed'),
  };
}
