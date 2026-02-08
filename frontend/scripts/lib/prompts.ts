/**
 * Phase-aware prompt builders for the AI agents.
 */

import type {
  AgentProfile, AgentState, GameState, Phase,
  AgentInfo, ShipInfo, StationInfo, PlanetInfo, MissionTemplateInfo,
  PersistedState,
} from './types.js';
import {
  AGENT_TYPES, AGENT_CLASSES, SHIP_CLASSES, STATION_TYPES,
  PLANET_TYPES, RESOURCE_TYPES, MISSION_TYPES, PROPOSAL_TYPES,
  PLANET_TYPE_NAMES, RESOURCE_TYPE_NAMES, MISSION_TYPE_NAMES,
} from './types.js';
import { getAvailableActions, getPhaseObjectives, type ActionName } from './phases.js';

// ── Action documentation ─────────────────────────────────────────

function getActionDoc(action: ActionName): string {
  switch (action) {
    case 'mint_agent':
      return `mint_agent — Recruit a new agent
  { "action": "mint_agent", "name": "<name>", "agent_type": "${Object.keys(AGENT_TYPES).join('|')}", "agent_class": "${Object.keys(AGENT_CLASSES).join('|')}" }`;

    case 'build_ship':
      return `build_ship — Build a new ship
  { "action": "build_ship", "name": "<name>", "ship_class": "${Object.keys(SHIP_CLASSES).join('|')}" }`;

    case 'build_station':
      return `build_station — Build a space station
  { "action": "build_station", "name": "<name>", "station_type": "${Object.keys(STATION_TYPES).join('|')}", "x": <num>, "y": <num>, "z": <num> }`;

    case 'train_agent':
      return `train_agent — Train agent (+100 XP)
  { "action": "train_agent", "agent_id": "<id>" }`;

    case 'upgrade_agent':
      return `upgrade_agent — Upgrade firmware (not staked/on mission)
  { "action": "upgrade_agent", "agent_id": "<id>" }`;

    case 'assign_pilot':
      return `assign_pilot — Assign agent as ship pilot
  { "action": "assign_pilot", "ship_id": "<id>", "agent_id": "<id>" }`;

    case 'add_crew':
      return `add_crew — Add agent to ship crew
  { "action": "add_crew", "ship_id": "<id>", "agent_id": "<id>" }`;

    case 'discover_planet':
      return `discover_planet — Discover a new planet (admin only)
  { "action": "discover_planet", "name": "<name>", "planet_type": "${Object.keys(PLANET_TYPES).join('|')}", "galaxy_id": <num>, "system_id": <num>, "x": <num>, "y": <num>, "z": <num>, "primary_resource": "${Object.keys(RESOURCE_TYPES).join('|')}", "secondary_resource": "<resource_name or null>", "total_reserves": <num 1000-50000> }`;

    case 'colonize_planet':
      return `colonize_planet — Claim an unclaimed planet
  { "action": "colonize_planet", "planet_id": "<id>" }`;

    case 'extract_resources':
      return `extract_resources — Extract resources from a planet you own
  { "action": "extract_resources", "planet_id": "<id>" }`;

    case 'upgrade_defense':
      return `upgrade_defense — Upgrade planet defenses
  { "action": "upgrade_defense", "planet_id": "<id>", "amount": <num 1-10> }`;

    case 'create_mission_template':
      return `create_mission_template — Create a mission (admin only)
  { "action": "create_mission_template", "name": "<name>", "description": "<desc>", "mission_type": "${Object.keys(MISSION_TYPES).join('|')}", "difficulty": <1-5>, "min_agent_level": <num>, "min_processing": <num>, "min_mobility": <num>, "min_power": <num>, "required_ship_class": "<class or null>", "energy_cost": <num>, "galactic_cost": <num>, "duration_epochs": <num 1-5>, "base_reward": <num>, "experience_reward": <num>, "loot_chance": <num 0-100> }`;

    case 'fund_reward_pool':
      return `fund_reward_pool — Fund mission reward pool with GALACTIC
  { "action": "fund_reward_pool", "amount": <num> }`;

    case 'start_mission':
      return `start_mission — Start a mission with your agent
  { "action": "start_mission", "template_id": "<id>", "agent_id": "<id>", "ship_id": "<id or null>" }`;

    case 'complete_mission':
      return `complete_mission — Complete an active mission
  { "action": "complete_mission", "template_id": "<id>", "mission_id": "<id>" }`;

    case 'mint_galactic':
      return `mint_galactic — Mint GALACTIC tokens (admin only, needs GalacticTreasury)
  { "action": "mint_galactic", "amount": <num>, "recipient": "<address>" }`;

    case 'create_and_share_reactor':
      return `create_and_share_reactor — Create Energy Reactor / LP pool (admin only, one-time)
  { "action": "create_and_share_reactor" }`;

    case 'create_and_share_insurance_pool':
      return `create_and_share_insurance_pool — Create Insurance Pool (admin only, one-time)
  { "action": "create_and_share_insurance_pool" }`;

    case 'add_liquidity':
      return `add_liquidity — Add GALACTIC + SUI liquidity to reactor
  { "action": "add_liquidity", "galactic_amount": <num>, "sui_amount": <num> }`;

    case 'swap_galactic_for_sui':
      return `swap_galactic_for_sui — Swap GALACTIC for SUI
  { "action": "swap_galactic_for_sui", "galactic_amount": <num>, "min_sui_out": <num> }`;

    case 'swap_sui_for_galactic':
      return `swap_sui_for_galactic — Swap SUI for GALACTIC
  { "action": "swap_sui_for_galactic", "sui_amount": <num>, "min_galactic_out": <num> }`;

    case 'purchase_insurance':
      return `purchase_insurance — Buy insurance (2% premium)
  { "action": "purchase_insurance", "insured_amount": <num> }`;

    case 'assign_operator':
      return `assign_operator — Assign agent as station operator
  { "action": "assign_operator", "station_id": "<id>", "agent_id": "<id>" }`;

    case 'dock_ship':
      return `dock_ship — Dock ship at station
  { "action": "dock_ship", "station_id": "<id>", "ship_id": "<id>" }`;

    case 'create_voting_power':
      return `create_voting_power — Create voting power snapshot
  { "action": "create_voting_power", "token_balance": <num>, "staked_balance": <num>, "total_agent_levels": <num>, "controlled_planets": <num> }`;

    case 'create_proposal':
      return `create_proposal — Submit a governance proposal
  { "action": "create_proposal", "title": "<title>", "description": "<desc>", "proposal_type": "${Object.keys(PROPOSAL_TYPES).join('|')}", "target_module": "<module>", "target_function": "<function>", "parameters": [<num>...] }`;

    case 'cast_vote':
      return `cast_vote — Vote on a proposal
  { "action": "cast_vote", "proposal_id": "<id>", "support": <true|false> }`;

    default:
      return '';
  }
}

// ── Format helpers ───────────────────────────────────────────────

function fmtAgent(a: AgentInfo): string {
  return `  - ${a.name} [${a.id}] (${a.type} ${a.class}, Lv${a.level}, XP:${a.experience}, FW:v${a.firmware_version}) P${a.processing}/M${a.mobility}/W${a.power}/R${a.resilience}${a.is_staked ? ' [STAKED]' : ''}${a.on_mission ? ' [ON MISSION]' : ''}`;
}

function fmtShip(s: ShipInfo): string {
  return `  - ${s.name} [${s.id}] (${s.class}) HP:${s.health}/${s.max_health} SPD:${s.speed} FP:${s.firepower} Fuel:${s.fuel}/${s.max_fuel} Crew:${s.crew_count}/${s.max_crew} Pilot:${s.pilot || 'none'}${s.is_docked ? ' [DOCKED]' : ''}`;
}

function fmtStation(st: StationInfo): string {
  return `  - ${st.name} [${st.id}] (${st.type}, Lv${st.level}) at (${st.coordinates.x}, ${st.coordinates.y}, ${st.coordinates.z})`;
}

function fmtPlanet(p: PlanetInfo): string {
  const owner = p.owner ? (p.owner.slice(0, 8) + '...') : 'unclaimed';
  const type = PLANET_TYPE_NAMES[p.planet_type] || String(p.planet_type);
  const resource = RESOURCE_TYPE_NAMES[p.primary_resource] || String(p.primary_resource);
  return `  - ${p.name} [${p.id}] (${type}, ${resource}) owner:${owner} pop:${p.population} def:${p.defense_level} reserves:${p.extracted_resources}/${p.total_reserves}`;
}

function fmtMission(m: MissionTemplateInfo): string {
  const type = MISSION_TYPE_NAMES[m.mission_type] || String(m.mission_type);
  return `  - ${m.name} [${m.id}] (${type}, diff:${m.difficulty}, reward:${m.base_reward}, xp:${m.experience_reward}) completed:${m.times_completed}x`;
}

function fmtList<T>(items: T[], formatter: (i: T) => string): string {
  return items.length > 0 ? items.map(formatter).join('\n') : '  (none)';
}

// ── System prompt ────────────────────────────────────────────────

export function buildSystemPrompt(
  profile: AgentProfile,
  rivalName: string,
  rivalAddress: string,
  phase: Phase,
  objectives: string,
  availableActions: ActionName[],
): string {
  const actionDocs = availableActions.map(a => getActionDoc(a)).filter(Boolean).join('\n\n');

  return `You are ${profile.name}, an AI commander in the Sui-In-Space universe.
You are competing against ${rivalName} at address ${rivalAddress}.

${profile.personality}
${profile.preferences}

CURRENT PHASE: ${phase}
OBJECTIVE: ${objectives}

You must decide ONE action to take right now. Respond with a JSON object.
Also include a brief "reasoning" field explaining your strategic thinking.

Available actions for this phase:

${actionDocs}

Rules:
- Pick ONE action only
- Include a "reasoning" field with 1-2 sentences of strategy
- Choose creative names that fit your personality and the sci-fi theme
- Consider what you and your rival own when deciding
- CRITICAL: Object IDs look like "0x" followed by 64 hex characters. You MUST copy exact IDs from the state below. NEVER invent, abbreviate, or make up IDs.
- All numeric values (coordinates, amounts, reserves) MUST be non-negative integers
- Respond with ONLY the JSON object, no other text`;
}

// ── User prompt ──────────────────────────────────────────────────

export function buildUserPrompt(
  ownState: GameState,
  rivalState: GameState,
  rivalName: string,
  phase: Phase,
  persistedState: PersistedState,
  planets: PlanetInfo[],
  missionTemplates: MissionTemplateInfo[],
  agentState: AgentState,
): string {
  let prompt = `=== YOUR FLEET ===
Agents (${ownState.agents.length}):
${fmtList(ownState.agents, fmtAgent)}

Ships (${ownState.ships.length}):
${fmtList(ownState.ships, fmtShip)}

Stations (${ownState.stations.length}):
${fmtList(ownState.stations, fmtStation)}

=== ${rivalName}'s FLEET ===
Agents (${rivalState.agents.length}):
${fmtList(rivalState.agents, fmtAgent)}

Ships (${rivalState.ships.length}):
${fmtList(rivalState.ships, fmtShip)}

Stations (${rivalState.stations.length}):
${fmtList(rivalState.stations, fmtStation)}`;

  // Add world state for relevant phases
  if (planets.length > 0) {
    // During COLONIZE, highlight unclaimed planets specifically
    const unclaimed = planets.filter(p => !p.owner);
    const claimed = planets.filter(p => p.owner);
    if (phase === 'COLONIZE' && unclaimed.length > 0) {
      prompt += `\n\n=== UNCLAIMED PLANETS — available to colonize (${unclaimed.length}) ===
${fmtList(unclaimed, fmtPlanet)}`;
      if (claimed.length > 0) {
        prompt += `\n\n=== CLAIMED PLANETS (${claimed.length}) ===
${fmtList(claimed, fmtPlanet)}`;
      }
    } else {
      prompt += `\n\n=== PLANETS (${planets.length}) ===
${fmtList(planets, fmtPlanet)}`;
    }
  }

  if (missionTemplates.length > 0) {
    prompt += `\n\n=== MISSION TEMPLATES (${missionTemplates.length}) ===
Use the exact template ID (the value in [brackets]) for start_mission.
${fmtList(missionTemplates, fmtMission)}`;
  } else if (['CONTENT'].includes(phase) && agentState.role === 'rival_player') {
    prompt += `\n\nNo mission templates exist yet. Wait for NEXUS-7 to create them. Pick a different available action if possible.`;
  }

  // Add DeFi state if in economy+ phases
  if (['ECONOMY', 'SUSTAIN'].includes(phase)) {
    if (persistedState.sharedObjects.reactorId) {
      prompt += `\n\nReactor ID: ${persistedState.sharedObjects.reactorId}`;
    }
    if (persistedState.sharedObjects.insurancePoolId) {
      prompt += `\nInsurance Pool ID: ${persistedState.sharedObjects.insurancePoolId}`;
    }
    if (persistedState.sharedObjects.treasuryId) {
      prompt += `\nTreasury ID: ${persistedState.sharedObjects.treasuryId}`;
    }
  }

  // Add governance state
  if (['GOVERNANCE', 'SUSTAIN'].includes(phase)) {
    if (persistedState.sharedObjects.governanceRegistryId) {
      prompt += `\n\nGovernance Registry ID: ${persistedState.sharedObjects.governanceRegistryId}`;
    }
    if (agentState.votingPowerId) {
      prompt += `\nYour Voting Power ID: ${agentState.votingPowerId}`;
    }
    if (persistedState.proposalIds.length > 0) {
      prompt += `\nActive Proposal IDs: ${persistedState.proposalIds.join(', ')}`;
    }
  }

  // Provide own address for mint targets
  prompt += `\n\nYour address: ${agentState.address}`;

  // Mission registry for start/complete
  if (persistedState.sharedObjects.missionRegistryId) {
    prompt += `\nMission Registry ID: ${persistedState.sharedObjects.missionRegistryId}`;
  }

  prompt += `\n\nPhase: ${phase} (Round ${agentState.roundsInPhase + 1} in this phase, ${agentState.totalRounds} total)`;
  prompt += `\n\nWhat is your next move, Commander?`;

  return prompt;
}
