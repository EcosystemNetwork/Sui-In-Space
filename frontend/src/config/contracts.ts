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
