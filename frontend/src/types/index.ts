/**
 * Sui-In-Space TypeScript Type Definitions
 * Matching Move smart contract structures
 */

// ============ Core Types ============

export type ObjectId = string;
export type Address = string;
export type Epoch = number;

// ============ Agent Types ============

export enum AgentType {
  Human = 0,
  Cyborg = 1,
  Android = 2,
  AlienSynthetic = 3,
}

export enum AgentClass {
  Hacker = 0,
  Pilot = 1,
  MechOperator = 2,
  QuantumEngineer = 3,
  Psionic = 4,
  BountyAI = 5,
}

export interface AgentStats {
  processing: number;
  mobility: number;
  power: number;
  resilience: number;
  luck: number;
  neuralBandwidth: number;
}

export interface Agent {
  id: ObjectId;
  name: string;
  agentType: AgentType;
  class: AgentClass;
  stats: AgentStats;
  level: number;
  experience: number;
  firmwareVersion: number;
  aiModelLineage: string;
  augmentSlots: ObjectId[];
  maxAugmentSlots: number;
  missionsCompleted: number;
  battlesWon: number;
  totalEarnings: bigint;
  isStaked: boolean;
  stakedAt: ObjectId | null;
  currentMission: ObjectId | null;
}

export interface Augmentation {
  id: ObjectId;
  name: string;
  augmentType: number;
  rarity: number;
  bonuses: Partial<AgentStats>;
  abilityId: number | null;
}

// ============ Ship Types ============

export enum ShipClass {
  Scout = 0,
  Fighter = 1,
  Freighter = 2,
  Cruiser = 3,
  Battleship = 4,
  Carrier = 5,
  Dreadnought = 6,
}

export enum WeaponType {
  Laser = 0,
  Missile = 1,
  Plasma = 2,
  Railgun = 3,
  Ion = 4,
}

export enum UtilityType {
  Shield = 0,
  Scanner = 1,
  Stealth = 2,
  Cargo = 3,
  Repair = 4,
}

export interface Ship {
  id: ObjectId;
  name: string;
  shipClass: ShipClass;
  modules: {
    hull: ObjectId | null;
    engine: ObjectId | null;
    aiCore: ObjectId | null;
    weapon: ObjectId | null;
    utility: ObjectId | null;
  };
  maxHealth: number;
  currentHealth: number;
  speed: number;
  firepower: number;
  cargoCapacity: number;
  fuelEfficiency: number;
  pilot: ObjectId | null;
  crew: ObjectId[];
  maxCrew: number;
  isDocked: boolean;
  dockedAt: ObjectId | null;
  inCombat: boolean;
  fuel: number;
  maxFuel: number;
}

export interface ShipModule {
  id: ObjectId;
  name: string;
  rarity: number;
}

export interface Hull extends ShipModule {
  healthBonus: number;
  armorClass: number;
  weight: number;
}

export interface Engine extends ShipModule {
  speedBonus: number;
  fuelEfficiency: number;
  maneuverability: number;
}

export interface AICore extends ShipModule {
  level: number;
  autoPilotBonus: number;
  combatAIBonus: number;
  yieldBonus: number;
}

export interface Weapon extends ShipModule {
  weaponType: WeaponType;
  damage: number;
  fireRate: number;
  range: number;
  energyCost: number;
}

export interface Utility extends ShipModule {
  utilityType: UtilityType;
  effectiveness: number;
  energyCost: number;
}

// ============ Planet Types ============

export enum PlanetType {
  Terran = 0,
  GasGiant = 1,
  IceWorld = 2,
  Desert = 3,
  Ocean = 4,
  Volcanic = 5,
  Artificial = 6,
}

export enum ResourceType {
  Energy = 0,
  Metal = 1,
  Bio = 2,
  Fuel = 3,
  Quantum = 4,
  DarkMatter = 5,
  Psionic = 6,
  Relics = 7,
}

export interface Coordinates {
  galaxy: number;
  system: number;
  x: number;
  y: number;
  z: number;
}

export interface Planet {
  id: ObjectId;
  name: string;
  planetType: PlanetType;
  coordinates: Coordinates;
  primaryResource: ResourceType;
  secondaryResource: ResourceType | null;
  extractionRate: number;
  totalReserves: bigint;
  extractedTotal: bigint;
  population: number;
  maxPopulation: number;
  populationGrowth: number;
  owner: Address;
  factionId: ObjectId | null;
  stations: ObjectId[];
  maxStations: number;
  defenseLevel: number;
  isColonized: boolean;
  lastExtraction: Epoch;
  underAttack: boolean;
}

// ============ Station Types ============

export enum StationType {
  YieldFarm = 0,
  ResearchLab = 1,
  BlackMarket = 2,
  WarpGate = 3,
  DefensePlatform = 4,
}

export interface Station {
  id: ObjectId;
  name: string;
  stationType: StationType;
  planetId: ObjectId | null;
  coordinates: Coordinates;
  totalStaked: bigint;
  yieldRate: number;
  lastYieldTime: Epoch;
  accumulatedYield: bigint;
  operators: ObjectId[];
  maxOperators: number;
  dockedShips: ObjectId[];
  maxDocked: number;
  level: number;
  experience: number;
  efficiency: number;
  owner: Address;
  factionId: ObjectId | null;
  isActive: boolean;
  underMaintenance: boolean;
}

export interface StakeReceipt {
  id: ObjectId;
  stationId: ObjectId;
  staker: Address;
  amount: bigint;
  stakedAt: Epoch;
  lockDuration: number;
  agentId: ObjectId | null;
}

// ============ DeFi Types ============

export interface EnergyReactor {
  id: ObjectId;
  galacticReserve: bigint;
  suiReserve: bigint;
  totalLpShares: bigint;
  swapFeeBps: number;
  protocolFeeBps: number;
  accumulatedGalacticFees: bigint;
  accumulatedSuiFees: bigint;
  isActive: boolean;
  totalSwaps: number;
  totalVolumeGalactic: bigint;
  totalVolumeSui: bigint;
}

export interface LPReceipt {
  id: ObjectId;
  reactorId: ObjectId;
  provider: Address;
  lpShares: bigint;
  galacticDeposited: bigint;
  suiDeposited: bigint;
  depositedAt: Epoch;
}

export interface InsurancePool {
  id: ObjectId;
  galacticReserve: bigint;
  totalInsured: bigint;
  premiumRateBps: number;
  payoutRateBps: number;
  totalClaims: number;
  totalPremiums: bigint;
}

export interface InsurancePolicy {
  id: ObjectId;
  holder: Address;
  insuredAmount: bigint;
  premiumPaid: bigint;
  purchasedAt: Epoch;
  expiresAt: Epoch;
  used: boolean;
}

// ============ Mission Types ============

export enum MissionType {
  DataHeist = 0,
  Espionage = 1,
  Smuggling = 2,
  AITraining = 3,
  Combat = 4,
  Exploration = 5,
}

export enum MissionStatus {
  Active = 0,
  Completed = 1,
  Failed = 2,
  Abandoned = 3,
}

export interface MissionTemplate {
  id: ObjectId;
  name: string;
  description: string;
  missionType: MissionType;
  difficulty: number;
  requirements: {
    minAgentLevel: number;
    minProcessing: number;
    minMobility: number;
    minPower: number;
    requiredShipClass: ShipClass | null;
  };
  costs: {
    energyCost: number;
    galacticCost: bigint;
    durationEpochs: number;
  };
  rewards: {
    baseReward: bigint;
    experienceReward: number;
    lootChance: number;
  };
  isActive: boolean;
  timesCompleted: number;
  successRate: number;
}

export interface ActiveMission {
  id: ObjectId;
  templateId: ObjectId;
  player: Address;
  agentId: ObjectId;
  shipId: ObjectId | null;
  startedAt: Epoch;
  endsAt: Epoch;
  status: MissionStatus;
}

export interface MissionResult {
  missionId: ObjectId;
  success: boolean;
  reward: bigint;
  experience: number;
  lootType: number;
}

// ============ Governance Types ============

export enum ProposalType {
  Parameter = 0,
  Emission = 1,
  Feature = 2,
  War = 3,
  Upgrade = 4,
}

export enum ProposalStatus {
  Active = 0,
  Passed = 1,
  Rejected = 2,
  Executed = 3,
  Cancelled = 4,
}

export interface Proposal {
  id: ObjectId;
  proposalId: number;
  proposer: Address;
  title: string;
  description: string;
  proposalType: ProposalType;
  targetModule: string;
  targetFunction: string;
  parameters: number[];
  votesFor: bigint;
  votesAgainst: bigint;
  voters: Map<Address, boolean>;
  createdAt: Epoch;
  votingEndsAt: Epoch;
  executionAfter: Epoch;
  status: ProposalStatus;
}

export interface VotingPower {
  id: ObjectId;
  owner: Address;
  tokenPower: bigint;
  stakedPower: bigint;
  agentPower: bigint;
  territoryPower: bigint;
  totalPower: bigint;
  snapshotEpoch: Epoch;
}

export interface GovernanceRegistry {
  id: ObjectId;
  treasuryBalance: bigint;
  proposalCount: number;
  executedProposals: number;
  rejectedProposals: number;
  votingPeriod: number;
  executionDelay: number;
  proposalThreshold: bigint;
  quorumThreshold: number;
  activeProposalIds: ObjectId[];
}

// ============ Event Types ============

export interface AgentMintedEvent {
  agentId: ObjectId;
  owner: Address;
  agentType: AgentType;
  class: AgentClass;
}

export interface ShipBuiltEvent {
  shipId: ObjectId;
  owner: Address;
  shipClass: ShipClass;
}

export interface MissionCompletedEvent {
  missionId: ObjectId;
  player: Address;
  success: boolean;
  reward: bigint;
}

export interface SwappedEvent {
  reactorId: ObjectId;
  trader: Address;
  inputToken: string;
  inputAmount: bigint;
  outputAmount: bigint;
  feeAmount: bigint;
}

export interface VoteCastEvent {
  proposalId: number;
  voter: Address;
  support: boolean;
  votingPower: bigint;
}

// ============ UI State Types ============

export interface PlayerState {
  address: Address;
  galacticBalance: bigint;
  suiBalance: bigint;
  agents: Agent[];
  ships: Ship[];
  planets: Planet[];
  stations: Station[];
  activeMissions: ActiveMission[];
  stakeReceipts: StakeReceipt[];
  votingPower: VotingPower | null;
}

export interface GameState {
  currentEpoch: Epoch;
  totalPlayers: number;
  totalValueLocked: bigint;
  galacticPrice: number;
  activeMissions: number;
  activeProposals: number;
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  selectedAgent: ObjectId | null;
  selectedShip: ObjectId | null;
  selectedPlanet: ObjectId | null;
  selectedStation: ObjectId | null;
  activeTab: 'map' | 'hangar' | 'agents' | 'missions' | 'defi' | 'governance';
}
