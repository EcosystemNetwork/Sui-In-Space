/**
 * Phase state machine — transition logic and per-phase available actions.
 */

import type { Phase, AgentRole, AgentState, WorldState, GameState, PersistedState } from './types.js';

// ── Phase order per role ─────────────────────────────────────────

// Phase progressions:
// NEXUS-7:  GENESIS → WORLD_BUILD → CONTENT → ECONOMY → MILITARY → GOVERNANCE → SUSTAIN
// KRAIT-X:  GENESIS → COLONIZE    → CONTENT → ECONOMY → MILITARY → GOVERNANCE → SUSTAIN
// Both use the same Phase type. KRAIT-X gets different available actions per phase.

// ── Available actions per phase+role ─────────────────────────────

export type ActionName =
  | 'mint_agent' | 'build_ship' | 'build_station' | 'train_agent' | 'upgrade_agent'
  | 'assign_pilot' | 'add_crew'
  | 'discover_planet' | 'colonize_planet' | 'extract_resources' | 'upgrade_defense'
  | 'create_mission_template' | 'fund_reward_pool' | 'start_mission' | 'complete_mission'
  | 'mint_galactic' | 'create_and_share_reactor' | 'create_and_share_insurance_pool'
  | 'add_liquidity' | 'swap_galactic_for_sui' | 'swap_sui_for_galactic' | 'purchase_insurance'
  | 'assign_operator' | 'dock_ship'
  | 'create_voting_power' | 'create_proposal' | 'cast_vote';

const GENESIS_ACTIONS: ActionName[] = ['mint_agent', 'build_ship'];

const WORLD_BUILD_ACTIONS: ActionName[] = ['discover_planet'];
const COLONIZE_ACTIONS: ActionName[] = ['colonize_planet', 'extract_resources', 'upgrade_defense'];

const CONTENT_ACTIONS: ActionName[] = ['create_mission_template', 'mint_galactic', 'fund_reward_pool'];
const MISSIONS_ACTIONS: ActionName[] = ['start_mission', 'complete_mission'];

const ECONOMY_GM_ACTIONS: ActionName[] = [
  'create_and_share_reactor', 'create_and_share_insurance_pool',
  'mint_galactic', 'add_liquidity',
];
const ECONOMY_PLAYER_ACTIONS: ActionName[] = [
  'add_liquidity', 'swap_galactic_for_sui', 'swap_sui_for_galactic', 'purchase_insurance',
];

const MILITARY_GM_ACTIONS: ActionName[] = [
  'build_ship', 'build_station', 'mint_agent', 'assign_pilot', 'add_crew',
  'assign_operator', 'dock_ship',
];
const MILITARY_PLAYER_ACTIONS: ActionName[] = [
  'build_ship', 'mint_agent', 'assign_pilot', 'add_crew', 'dock_ship',
];

const GOVERNANCE_ACTIONS: ActionName[] = [
  'create_voting_power', 'create_proposal', 'cast_vote', 'mint_galactic',
];

const SUSTAIN_ALL: ActionName[] = [
  'mint_agent', 'build_ship', 'build_station', 'train_agent', 'upgrade_agent',
  'assign_pilot', 'add_crew', 'discover_planet', 'colonize_planet',
  'extract_resources', 'upgrade_defense',
  'create_mission_template', 'fund_reward_pool', 'start_mission', 'complete_mission',
  'mint_galactic', 'add_liquidity', 'swap_galactic_for_sui', 'swap_sui_for_galactic',
  'purchase_insurance', 'assign_operator', 'dock_ship',
  'create_voting_power', 'create_proposal', 'cast_vote',
];

export function getAvailableActions(phase: Phase, role: AgentRole): ActionName[] {
  switch (phase) {
    case 'GENESIS': return GENESIS_ACTIONS;
    case 'WORLD_BUILD': return role === 'game_master' ? WORLD_BUILD_ACTIONS : []; // KRAIT-X waits
    case 'COLONIZE': return role === 'rival_player' ? COLONIZE_ACTIONS : [];
    case 'CONTENT': return role === 'game_master' ? CONTENT_ACTIONS : MISSIONS_ACTIONS;
    case 'ECONOMY': return role === 'game_master' ? ECONOMY_GM_ACTIONS : ECONOMY_PLAYER_ACTIONS;
    case 'MILITARY': return role === 'game_master' ? MILITARY_GM_ACTIONS : MILITARY_PLAYER_ACTIONS;
    case 'GOVERNANCE': return GOVERNANCE_ACTIONS;
    case 'SUSTAIN': return role === 'game_master' ? SUSTAIN_ALL : SUSTAIN_ALL.filter(a => a !== 'discover_planet' && a !== 'create_mission_template' && a !== 'fund_reward_pool' && a !== 'create_and_share_reactor' && a !== 'create_and_share_insurance_pool');
    default: return GENESIS_ACTIONS;
  }
}

// ── Phase transition checks ──────────────────────────────────────

export function checkTransition(
  agentState: AgentState,
  ownGameState: GameState,
  persistedState: PersistedState,
): Phase | null {
  const { phase, role, roundsInPhase } = agentState;

  switch (phase) {
    case 'GENESIS': {
      // Transition when agent has at least 1 agent + 1 ship
      if (ownGameState.agents.length >= 1 && ownGameState.ships.length >= 1) {
        return role === 'game_master' ? 'WORLD_BUILD' : 'COLONIZE';
      }
      return null;
    }

    case 'WORLD_BUILD': {
      // NEXUS-7: transition when >= 5 planets discovered
      if (persistedState.planetIds.length >= 5) return 'CONTENT';
      return null;
    }

    case 'COLONIZE': {
      // KRAIT-X: transition after 3 rounds, BUT only if mission templates exist
      if (roundsInPhase >= 3) {
        // Wait for NEXUS-7 to create at least 1 mission template before advancing
        if (persistedState.missionTemplateIds.length >= 1) return 'CONTENT';
      }
      // If 5+ rounds and still no templates, keep colonizing (extract resources, upgrade defense)
      return null;
    }

    case 'CONTENT': {
      if (role === 'game_master') {
        // Transition when >= 3 mission templates created
        if (persistedState.missionTemplateIds.length >= 3) return 'ECONOMY';
      } else {
        // KRAIT-X: transition after 3 rounds, BUT only if reactor exists
        if (roundsInPhase >= 3 && persistedState.sharedObjects.reactorId) return 'ECONOMY';
      }
      return null;
    }

    case 'ECONOMY': {
      if (role === 'game_master') {
        // GM: transition after creating reactor + insurance + 2 rounds of liquidity
        if (roundsInPhase >= 4) return 'MILITARY';
      } else {
        // KRAIT-X: transition after 3 rounds of DeFi activity
        if (roundsInPhase >= 3) return 'MILITARY';
      }
      return null;
    }

    case 'MILITARY': {
      // Transition after 3-5 rounds
      if (roundsInPhase >= 4) return 'GOVERNANCE';
      return null;
    }

    case 'GOVERNANCE': {
      // Transition after 3 rounds
      if (roundsInPhase >= 3) return 'SUSTAIN';
      return null;
    }

    case 'SUSTAIN':
      return null; // Runs indefinitely

    default:
      return null;
  }
}

// ── Phase objectives (for AI prompt) ─────────────────────────────

export function getPhaseObjectives(phase: Phase, role: AgentRole): string {
  switch (phase) {
    case 'GENESIS':
      return 'Build your initial fleet. Mint 1 agent and build 1 ship to get started.';
    case 'WORLD_BUILD':
      return role === 'game_master'
        ? 'Discover 5-8 planets of varied types across different galaxies and systems. Each planet should have different resources.'
        : 'Waiting for NEXUS-7 to discover planets...';
    case 'COLONIZE':
      return role === 'rival_player'
        ? 'Colonize unclaimed planets to establish territory. Upgrade defenses on your planets.'
        : 'KRAIT-X is colonizing planets.';
    case 'CONTENT':
      return role === 'game_master'
        ? 'Create 3-5 diverse mission templates (DataHeist, Espionage, Combat, Exploration). Mint GALACTIC tokens and fund the reward pool.'
        : 'Start and complete available missions to earn rewards and experience.';
    case 'ECONOMY':
      return role === 'game_master'
        ? 'Create the Energy Reactor (liquidity pool) and Insurance Pool. Mint GALACTIC and add initial liquidity.'
        : 'Participate in DeFi: add liquidity, make swaps, purchase insurance.';
    case 'MILITARY':
      return role === 'game_master'
        ? 'Build economic fleet (Freighters, Carriers). Build stations. Assign crews and operators.'
        : 'Build war fleet (Fighters, Dreadnoughts, Battleships). Assign pilots and crew.';
    case 'GOVERNANCE':
      return 'Create voting power, submit proposals, and cast votes on governance issues.';
    case 'SUSTAIN':
      return role === 'game_master'
        ? 'All actions available. PRIORITIES: (1) Add liquidity to the reactor (add_liquidity), (2) Fund the reward pool, (3) Create governance proposals, (4) Run missions, (5) Expand fleet/territory. You MUST use economy actions (add_liquidity, swap, mint_galactic) and governance actions (create_voting_power, create_proposal) — do NOT only train agents or build ships.'
        : 'All actions available. PRIORITIES: (1) Add liquidity to the reactor (add_liquidity), (2) Start and complete missions, (3) Make swaps (swap_galactic_for_sui, swap_sui_for_galactic), (4) Purchase insurance, (5) Vote on proposals. You MUST use economy actions and governance — do NOT only train agents or build ships.';
    default:
      return 'Take your next action.';
  }
}

// ── Phase temperature (for AI) ───────────────────────────────────

export function getPhaseTemperature(phase: Phase, baseTemp: number): number {
  switch (phase) {
    case 'GENESIS': return Math.min(baseTemp, 0.3); // Precise
    case 'WORLD_BUILD': return Math.min(baseTemp, 0.5); // Moderate creativity for planet names
    case 'COLONIZE': return Math.min(baseTemp, 0.3);
    case 'CONTENT': return Math.min(baseTemp, 0.6); // Creative mission names
    case 'ECONOMY': return Math.min(baseTemp, 0.3); // Precise DeFi ops
    case 'MILITARY': return Math.min(baseTemp, 0.5);
    case 'GOVERNANCE': return Math.min(baseTemp, 0.6);
    case 'SUSTAIN': return baseTemp; // Full creativity
    default: return baseTemp;
  }
}

/**
 * Check if KRAIT-X should skip this phase (waiting for NEXUS-7).
 */
export function shouldSkipTurn(agentState: AgentState, persistedState: PersistedState): boolean {
  const { phase, role } = agentState;

  // KRAIT-X waits during WORLD_BUILD
  if (phase === 'WORLD_BUILD' && role === 'rival_player') return true;

  // NEXUS-7 waits during COLONIZE
  if (phase === 'COLONIZE' && role === 'game_master') return true;

  // No available actions = skip
  const actions = getAvailableActions(phase, role);
  return actions.length === 0;
}
