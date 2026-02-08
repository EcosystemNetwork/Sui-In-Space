/**
 * Deployed contract configuration
 * PACKAGE_ID comes from env — set after deploying to testnet
 */

export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x0';
export const CODE_REGISTRY_ID = import.meta.env.VITE_CODE_REGISTRY_ID || '';

export const MODULES = {
  AGENT: `${PACKAGE_ID}::agent`,
  SHIP: `${PACKAGE_ID}::ship`,
  STATION: `${PACKAGE_ID}::station`,
  GOVERNANCE: `${PACKAGE_ID}::governance`,
  CODE_REGISTRY: `${PACKAGE_ID}::code_registry`,
} as const;

// Constants matching Move contract enums
export const AGENT_TYPES = {
  Human: 0,
  Cyborg: 1,
  Android: 2,
  AlienSynthetic: 3,
} as const;

export const AGENT_CLASSES = {
  Hacker: 0,
  Pilot: 1,
  MechOperator: 2,
  QuantumEngineer: 3,
  Psionic: 4,
  BountyAI: 5,
} as const;

export const SHIP_CLASSES = {
  Scout: 0,
  Fighter: 1,
  Freighter: 2,
  Cruiser: 3,
  Battleship: 4,
  Carrier: 5,
  Dreadnought: 6,
} as const;

export const STATION_TYPES = {
  YieldFarm: 0,
  ResearchLab: 1,
  BlackMarket: 2,
  WarpGate: 3,
  DefensePlatform: 4,
} as const;

export const AGENT_TYPE_NAMES = Object.fromEntries(
  Object.entries(AGENT_TYPES).map(([k, v]) => [v, k])
) as Record<number, string>;

export const AGENT_CLASS_NAMES = Object.fromEntries(
  Object.entries(AGENT_CLASSES).map(([k, v]) => [v, k])
) as Record<number, string>;

export const SHIP_CLASS_NAMES = Object.fromEntries(
  Object.entries(SHIP_CLASSES).map(([k, v]) => [v, k])
) as Record<number, string>;

export const STATION_TYPE_NAMES = Object.fromEntries(
  Object.entries(STATION_TYPES).map(([k, v]) => [v, k])
) as Record<number, string>;

// Planet types (matching Move contract planet_type enum)
export const PLANET_TYPES = {
  Terran: 0, GasGiant: 1, IceWorld: 2, Desert: 3, Ocean: 4, Volcanic: 5, Artificial: 6,
} as const;

export const PLANET_TYPE_NAMES = Object.fromEntries(
  Object.entries(PLANET_TYPES).map(([k, v]) => [v, k])
) as Record<number, string>;

// Resource types (matching Move contract resource enums)
export const RESOURCE_TYPES = {
  Energy: 0, Metal: 1, Bio: 2, Fuel: 3, Quantum: 4, DarkMatter: 5, Psionic: 6, Relics: 7,
} as const;

export const RESOURCE_TYPE_NAMES = Object.fromEntries(
  Object.entries(RESOURCE_TYPES).map(([k, v]) => [v, k])
) as Record<number, string>;

// Mission types (matching Move contract mission_type enum)
export const MISSION_TYPES = {
  DataHeist: 0, Espionage: 1, Smuggling: 2, AITraining: 3, Combat: 4, Exploration: 5,
} as const;

export const MISSION_TYPE_NAMES = Object.fromEntries(
  Object.entries(MISSION_TYPES).map(([k, v]) => [v, k])
) as Record<number, string>;

// Proposal types (matching Move contract governance proposal_type enum)
export const PROPOSAL_TYPES = {
  ParameterChange: 0, TreasurySpend: 1, ModuleUpgrade: 2, Emergency: 3,
} as const;

export const PROPOSAL_TYPE_NAMES = Object.fromEntries(
  Object.entries(PROPOSAL_TYPES).map(([k, v]) => [v, k])
) as Record<number, string>;

export const AI_AGENT_ADDRESSES = {
  NEXUS7: import.meta.env.VITE_NEXUS7_ADDRESS || '',
  KRAITX: import.meta.env.VITE_KRAITX_ADDRESS || '',
} as const;
