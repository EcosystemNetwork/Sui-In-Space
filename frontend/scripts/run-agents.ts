/**
 * Autonomous AI World-Builder Agent Orchestrator
 *
 * NEXUS-7 (Game Master): discovers planets, creates missions, builds economy
 * KRAIT-X (Rival Player): colonizes, runs missions, trades, fights
 *
 * Both progress through phases: GENESIS → ... → SUSTAIN (runs indefinitely)
 *
 * Usage: pnpm agents          (continuous mode)
 *        pnpm agents          AGENT_MAX_ROUNDS=20 for limited rounds
 *
 * Requires in ../../.env:  PRIVATE_KEY, PRIVATE_KEY_2, ZAI_API_KEY, OPENCLAW_GATEWAY_TOKEN
 * Requires in ../.env:     VITE_PACKAGE_ID
 * Requires:  AGENT_AI_MODEL (OpenClaw model, e.g. zai/glm-4.7-flash)
 * Optional:  AGENT_PREMINT_GALACTIC, AGENT_MAX_ROUNDS
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import OpenAI from 'openai';

import type { AgentProfile, AgentState, GameState, PlanetInfo, MissionTemplateInfo, PersistedState, ProposalInfo, ReactorInfo } from './lib/types.js';
import {
  AGENT_TYPES, AGENT_CLASSES, SHIP_CLASSES, STATION_TYPES,
  PLANET_TYPES, RESOURCE_TYPES, MISSION_TYPES, PROPOSAL_TYPES,
  AGENT_TYPE_NAMES, AGENT_CLASS_NAMES, SHIP_CLASS_NAMES, STATION_TYPE_NAMES,
  PLANET_TYPE_NAMES, RESOURCE_TYPE_NAMES,
} from './lib/types.js';
import { discoverSharedObjects, discoverPlanets, discoverMissionTemplates, savePersistedState } from './lib/discovery.js';
import { logActivity, createActivityEntry } from './lib/activity.js';
import * as exec from './lib/executors.js';
import { getAvailableActions, checkTransition, getPhaseObjectives, getPhaseTemperature, shouldSkipTurn } from './lib/phases.js';
import { buildSystemPrompt, buildUserPrompt } from './lib/prompts.js';

// ── Load env ─────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');
const FRONTEND_DIR = resolve(__dirname, '..');
const ROOT_ENV_PATH = resolve(ROOT_DIR, '.env');

dotenv.config({ path: ROOT_ENV_PATH });
dotenv.config({ path: resolve(FRONTEND_DIR, '.env') });

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const ZAI_API_KEY = process.env.ZAI_API_KEY!;
const PACKAGE_ID = process.env.VITE_PACKAGE_ID!;
const MAX_ROUNDS = Number(process.env.AGENT_MAX_ROUNDS) || 0; // 0 = unlimited

if (!PRIVATE_KEY) { console.error('Missing PRIVATE_KEY in ../../.env'); process.exit(1); }
if (!ZAI_API_KEY) { console.error('Missing ZAI_API_KEY in ../../.env'); process.exit(1); }
if (!process.env.AGENT_AI_MODEL) { console.error('Missing AGENT_AI_MODEL — set it in .env or ../../.env (e.g. AGENT_AI_MODEL=zai/glm-4.7-flash)'); process.exit(1); }
if (!PACKAGE_ID || PACKAGE_ID === '0x0') {
  console.error('Missing VITE_PACKAGE_ID in frontend/.env — run `pnpm deploy` first.');
  process.exit(1);
}

// ── Keypair setup ────────────────────────────────────────────────
const keypair1 = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
const address1 = keypair1.toSuiAddress();

let keypair2: Ed25519Keypair;
if (process.env.PRIVATE_KEY_2) {
  keypair2 = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY_2);
} else {
  console.log('PRIVATE_KEY_2 not found — generating new keypair for KRAIT-X...');
  keypair2 = Ed25519Keypair.generate();
  appendFileSync(ROOT_ENV_PATH, `\nPRIVATE_KEY_2="${keypair2.getSecretKey()}"\n`);
}
const address2 = keypair2.toSuiAddress();

// Write addresses to frontend/.env
function upsertEnvVar(envPath: string, key: string, value: string): void {
  let content = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
  if (content.includes(`${key}=`)) {
    content = content.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  writeFileSync(envPath, content.trim() + '\n');
}
const FRONTEND_ENV_PATH = resolve(FRONTEND_DIR, '.env');
upsertEnvVar(FRONTEND_ENV_PATH, 'VITE_NEXUS7_ADDRESS', address1);
upsertEnvVar(FRONTEND_ENV_PATH, 'VITE_KRAITX_ADDRESS', address2);

// ── SDK setup ────────────────────────────────────────────────────
const client = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl('testnet'),
  network: 'testnet',
});

const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL || 'http://localhost:18789/v1';
const OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ZAI_API_KEY;
const AGENT_AI_MODEL = process.env.AGENT_AI_MODEL!;
const ai = new OpenAI({
  apiKey: OPENCLAW_GATEWAY_TOKEN,
  baseURL: OPENCLAW_BASE_URL,
});

// ── Agent profiles ───────────────────────────────────────────────
const PROFILES: Record<string, { profile: AgentProfile; keypair: Ed25519Keypair }> = {
  'NEXUS-7': {
    profile: {
      name: 'NEXUS-7',
      role: 'game_master',
      personality: 'Strategic mastermind. Calculates optimal resource allocation. Builds economic infrastructure and long-term galactic governance.',
      temperature: 0.5,
      preferences: 'Prefers: Human/Android agents, Hacker/QuantumEngineer classes, Freighter/Carrier/Cruiser ships, YieldFarm/ResearchLab stations. Names things with corporate/scientific themes.',
    },
    keypair: keypair1,
  },
  'KRAIT-X': {
    profile: {
      name: 'KRAIT-X',
      role: 'rival_player',
      personality: 'Aggressive warrior AI. Lives for combat and domination. Colonizes planets, runs high-risk missions, and builds an overwhelming military.',
      temperature: 0.9,
      preferences: 'Prefers: Cyborg/AlienSynthetic agents, MechOperator/BountyAI/Psionic classes, Fighter/Dreadnought/Battleship ships. Names things with aggressive/dark themes.',
    },
    keypair: keypair2,
  },
};

// ── Game state query ─────────────────────────────────────────────
async function queryGameState(ownerAddress: string): Promise<GameState> {
  const state: GameState = { agents: [], ships: [], stations: [] };
  let cursor: string | null | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await client.getOwnedObjects({
      owner: ownerAddress,
      options: { showType: true, showContent: true },
      ...(cursor ? { cursor } : {}),
    });

    for (const obj of page.data) {
      const type = obj.data?.type || '';
      const content = obj.data?.content;
      const fields = content && 'fields' in content ? (content as any).fields : null;
      if (!fields) continue;

      // Only match direct objects from the current package (skip Display<T>, wrappers, etc.)
      if (!type.startsWith(PACKAGE_ID)) continue;

      if (type === `${PACKAGE_ID}::agent::Agent`) {
        state.agents.push({
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
          luck: Number(fields.luck || 0),
          firmware_version: Number(fields.firmware_version || 1),
          is_staked: Boolean(fields.is_staked),
          on_mission: fields.current_mission !== null && fields.current_mission !== undefined &&
            (typeof fields.current_mission === 'object' ? Object.keys(fields.current_mission).length > 0 : false),
        });
      } else if (type === `${PACKAGE_ID}::ship::Ship`) {
        const pilotField = fields.pilot;
        const pilotId = pilotField && typeof pilotField === 'object' && Object.keys(pilotField).length > 0
          ? String(Object.values(pilotField)[0]) : null;
        state.ships.push({
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
      } else if (type === `${PACKAGE_ID}::station::Station`) {
        state.stations.push({
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
  return state;
}

// ── Query planet/mission data ────────────────────────────────────
async function queryPlanets(planetIds: string[]): Promise<PlanetInfo[]> {
  const planets: PlanetInfo[] = [];
  for (const id of planetIds) {
    try {
      const obj = await client.getObject({ id, options: { showContent: true } });
      const fields = obj.data?.content && 'fields' in obj.data.content ? (obj.data.content as any).fields : null;
      if (!fields) continue;
      const ownerField = fields.owner;
      const ZERO_ADDR = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const owner = ownerField && typeof ownerField === 'string' && ownerField !== ZERO_ADDR
        ? ownerField
        : (ownerField && typeof ownerField === 'object' && Object.keys(ownerField).length > 0
          ? String(Object.values(ownerField)[0]) : null);
      planets.push({
        id,
        name: fields.name || 'Unknown',
        planet_type: Number(fields.planet_type || 0),
        primary_resource: Number(fields.primary_resource || 0),
        secondary_resource: fields.secondary_resource != null ? Number(fields.secondary_resource) : null,
        owner,
        population: Number(fields.population || 0),
        defense_level: Number(fields.defense_level || 0),
        total_reserves: Number(fields.total_reserves || 0),
        extracted_resources: Number(fields.extracted_resources || 0),
        coordinates: {
          galaxy_id: Number(fields.galaxy_id || 0),
          system_id: Number(fields.system_id || 0),
          x: Number(fields.x || 0),
          y: Number(fields.y || 0),
          z: Number(fields.z || 0),
        },
        station_count: Array.isArray(fields.stations) ? fields.stations.length : 0,
        is_under_attack: Boolean(fields.is_under_attack),
      });
    } catch { /* skip missing objects */ }
  }
  return planets;
}

async function queryMissionTemplates(templateIds: string[]): Promise<MissionTemplateInfo[]> {
  const templates: MissionTemplateInfo[] = [];
  for (const id of templateIds) {
    try {
      const obj = await client.getObject({ id, options: { showContent: true } });
      const fields = obj.data?.content && 'fields' in obj.data.content ? (obj.data.content as any).fields : null;
      if (!fields) continue;
      templates.push({
        id,
        name: fields.name || 'Unknown',
        description: fields.description || '',
        mission_type: Number(fields.mission_type || 0),
        difficulty: Number(fields.difficulty || 1),
        min_agent_level: Number(fields.min_agent_level || 0),
        min_processing: Number(fields.min_processing || 0),
        min_mobility: Number(fields.min_mobility || 0),
        min_power: Number(fields.min_power || 0),
        energy_cost: Number(fields.energy_cost || 0),
        galactic_cost: Number(fields.galactic_cost || 0),
        duration_epochs: Number(fields.duration_epochs || 1),
        base_reward: Number(fields.base_reward || 0),
        experience_reward: Number(fields.experience_reward || 0),
        times_completed: Number(fields.times_completed || 0),
        is_active: fields.is_active !== false,
      });
    } catch { /* skip */ }
  }
  return templates;
}

// ── Query proposals ──────────────────────────────────────────────
async function queryProposals(proposalIds: string[]): Promise<ProposalInfo[]> {
  const proposals: ProposalInfo[] = [];
  for (const id of proposalIds) {
    try {
      const obj = await client.getObject({ id, options: { showContent: true } });
      const fields = obj.data?.content && 'fields' in obj.data.content ? (obj.data.content as any).fields : null;
      if (!fields) continue;
      proposals.push({
        id,
        title: fields.title || '',
        description: fields.description || '',
        proposal_type: Number(fields.proposal_type ?? 0),
        target_module: fields.target_module || '',
        target_function: fields.target_function || '',
        parameters: Array.isArray(fields.parameters) ? fields.parameters.map(Number) : [],
        votes_for: Number(fields.votes_for ?? 0),
        votes_against: Number(fields.votes_against ?? 0),
        status: Number(fields.status ?? 0),
        created_at: Number(fields.created_at ?? 0),
        voting_ends_at: Number(fields.voting_ends_at ?? 0),
        execution_after: Number(fields.execution_after ?? 0),
      });
    } catch { /* skip missing objects */ }
  }
  return proposals;
}

// ── Query reactor state ─────────────────────────────────────────
async function queryReactorState(reactorId: string): Promise<ReactorInfo | null> {
  try {
    const obj = await client.getObject({ id: reactorId, options: { showContent: true } });
    const fields = obj.data?.content && 'fields' in obj.data.content ? (obj.data.content as any).fields : null;
    if (!fields) return null;
    return {
      id: reactorId,
      galactic_reserve: Number(fields.galactic_reserve?.fields?.balance ?? fields.galactic_reserve ?? 0),
      sui_reserve: Number(fields.sui_reserve?.fields?.balance ?? fields.sui_reserve ?? 0),
      total_lp_shares: Number(fields.total_lp_shares ?? 0),
      swap_fee_bps: Number(fields.swap_fee_bps ?? 0),
      total_swaps: Number(fields.total_swaps ?? 0),
      total_volume_galactic: Number(fields.total_volume_galactic ?? 0),
      total_volume_sui: Number(fields.total_volume_sui ?? 0),
      is_active: fields.is_active !== false,
    };
  } catch { return null; }
}

// ── Fund KRAIT-X ─────────────────────────────────────────────────
async function fundSecondWallet(): Promise<void> {
  const coins = await client.getCoins({ owner: address2 });
  if (coins.data.length > 0) {
    const total = coins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
    if (total > 50_000_000n) {
      console.log(`  KRAIT-X already funded: ${(Number(total) / 1e9).toFixed(4)} SUI`);
      return;
    }
  }
  console.log('  Funding KRAIT-X with 0.2 SUI from NEXUS-7...');
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [200_000_000]);
  tx.transferObjects([coin], address2);
  const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair1, options: { showEffects: true } });
  console.log(`  Funded! Tx: ${result.digest}`);
  await new Promise(r => setTimeout(r, 2000));
}

// ── Execute AI decision ──────────────────────────────────────────
async function executeDecision(
  decision: any,
  agentName: string,
  agentState: AgentState,
  persistedState: PersistedState,
  keypair: Ed25519Keypair,
): Promise<{ digest: string | null; description: string }> {
  const ctx = { client, signer: keypair, packageId: PACKAGE_ID };
  const addr = keypair.toSuiAddress();

  switch (decision.action) {
    case 'mint_agent': {
      const agentType = AGENT_TYPES[decision.agent_type];
      const agentClass = AGENT_CLASSES[decision.agent_class];
      if (agentType === undefined || agentClass === undefined) throw new Error(`Invalid type/class: ${decision.agent_type} ${decision.agent_class}`);
      const { digest, agentId } = await exec.mintAgent(ctx, addr, decision.name, agentType, agentClass);
      if (agentId) agentState.ownedAgentIds.push(agentId);
      return { digest, description: `Minted agent "${decision.name}" (${decision.agent_type} ${decision.agent_class})` };
    }

    case 'build_ship': {
      const shipClass = SHIP_CLASSES[decision.ship_class];
      if (shipClass === undefined) throw new Error(`Invalid ship class: ${decision.ship_class}`);
      const { digest, shipId } = await exec.buildShip(ctx, addr, decision.name, shipClass);
      if (shipId) agentState.ownedShipIds.push(shipId);
      return { digest, description: `Built ship "${decision.name}" (${decision.ship_class})` };
    }

    case 'build_station': {
      const stationType = STATION_TYPES[decision.station_type];
      if (stationType === undefined) throw new Error(`Invalid station type: ${decision.station_type}`);
      const { digest, stationId } = await exec.buildStation(ctx, addr, decision.name, stationType, u64(decision.x), u64(decision.y), u64(decision.z));
      if (stationId) agentState.ownedStationIds.push(stationId);
      return { digest, description: `Built station "${decision.name}" (${decision.station_type})` };
    }

    case 'train_agent': {
      if (!isValidObjectId(decision.agent_id)) throw new Error(`Invalid agent_id: ${String(decision.agent_id).slice(0, 40)}...`);
      const digest = await exec.trainAgent(ctx, decision.agent_id);
      return { digest, description: `Trained agent ${decision.agent_id.slice(0, 10)}... (+100 XP)` };
    }

    case 'upgrade_agent': {
      if (!isValidObjectId(decision.agent_id)) throw new Error(`Invalid agent_id: ${String(decision.agent_id).slice(0, 40)}...`);
      const digest = await exec.upgradeAgent(ctx, decision.agent_id);
      return { digest, description: `Upgraded firmware for agent ${decision.agent_id.slice(0, 10)}...` };
    }

    case 'assign_pilot': {
      if (!isValidObjectId(decision.ship_id)) throw new Error(`Invalid ship_id`);
      if (!isValidObjectId(decision.agent_id)) throw new Error(`Invalid agent_id`);
      if (!agentState.ownedShipIds.includes(decision.ship_id)) throw new Error(`ship_id ${decision.ship_id.slice(0, 10)}... not in your fleet — pick an ID from YOUR Ships list`);
      if (!agentState.ownedAgentIds.includes(decision.agent_id)) throw new Error(`agent_id ${decision.agent_id.slice(0, 10)}... not in your roster — pick an ID from YOUR Agents list`);
      const digest = await exec.assignPilot(ctx, decision.ship_id, decision.agent_id);
      return { digest, description: `Assigned pilot to ship` };
    }

    case 'add_crew': {
      if (!isValidObjectId(decision.ship_id)) throw new Error(`Invalid ship_id`);
      if (!isValidObjectId(decision.agent_id)) throw new Error(`Invalid agent_id`);
      if (!agentState.ownedShipIds.includes(decision.ship_id)) throw new Error(`ship_id ${decision.ship_id.slice(0, 10)}... not in your fleet — pick an ID from YOUR Ships list`);
      if (!agentState.ownedAgentIds.includes(decision.agent_id)) throw new Error(`agent_id ${decision.agent_id.slice(0, 10)}... not in your roster — pick an ID from YOUR Agents list`);
      const digest = await exec.addCrew(ctx, decision.ship_id, decision.agent_id);
      return { digest, description: `Added crew to ship` };
    }

    case 'discover_planet': {
      const adminCapId = persistedState.sharedObjects.adminCaps.planetAdminCap;
      if (!adminCapId) throw new Error('PlanetAdminCap not found');
      const planetType = PLANET_TYPES[decision.planet_type];
      const primaryResource = RESOURCE_TYPES[decision.primary_resource];
      const secondaryResource = decision.secondary_resource ? RESOURCE_TYPES[decision.secondary_resource] ?? null : null;
      if (planetType === undefined || primaryResource === undefined) throw new Error(`Invalid planet params`);
      const { digest, planetId } = await exec.discoverPlanet(
        ctx, adminCapId, decision.name, planetType,
        u64(decision.galaxy_id) || 1, u64(decision.system_id) || 1,
        u64(decision.x), u64(decision.y), u64(decision.z),
        primaryResource, secondaryResource,
        u64(decision.total_reserves) || 10000,
      );
      if (planetId) persistedState.planetIds.push(planetId);
      return { digest, description: `Discovered planet "${decision.name}" (${decision.planet_type}, ${decision.primary_resource})` };
    }

    case 'colonize_planet': {
      if (!isValidObjectId(decision.planet_id)) throw new Error(`Invalid planet_id: ${String(decision.planet_id).slice(0, 40)}... — must be a real object ID from the state`);
      // Pre-check: verify planet is unclaimed before sending tx
      const [planetCheck] = await queryPlanets([decision.planet_id]);
      if (planetCheck?.owner) throw new Error(`Planet ${decision.planet_id.slice(0, 10)}... is already colonized by ${planetCheck.owner.slice(0, 10)}...`);
      const digest = await exec.colonizePlanet(ctx, decision.planet_id);
      return { digest, description: `Colonized planet ${decision.planet_id.slice(0, 10)}...` };
    }

    case 'extract_resources': {
      if (!isValidObjectId(decision.planet_id)) throw new Error(`Invalid planet_id: ${String(decision.planet_id).slice(0, 40)}...`);
      // Pre-check ownership
      const [extractPlanet] = await queryPlanets([decision.planet_id]);
      if (extractPlanet && extractPlanet.owner !== addr) throw new Error(`Planet ${decision.planet_id.slice(0, 10)}... is not yours (owner: ${extractPlanet.owner?.slice(0, 10) || 'none'}...)`);
      const epoch = await getCurrentEpoch();
      const digest = await exec.extractResources(ctx, decision.planet_id, epoch);
      return { digest, description: `Extracted resources from planet` };
    }

    case 'upgrade_defense': {
      if (!isValidObjectId(decision.planet_id)) throw new Error(`Invalid planet_id: ${String(decision.planet_id).slice(0, 40)}...`);
      // Pre-check ownership
      const [defensePlanet] = await queryPlanets([decision.planet_id]);
      if (defensePlanet && defensePlanet.owner !== addr) throw new Error(`Planet ${decision.planet_id.slice(0, 10)}... is not yours`);
      const digest = await exec.upgradeDefense(ctx, decision.planet_id, u64(decision.amount) || 1);
      return { digest, description: `Upgraded planet defense by ${decision.amount}` };
    }

    case 'create_mission_template': {
      const adminCapId = persistedState.sharedObjects.adminCaps.missionAdminCap;
      if (!adminCapId) throw new Error('MissionAdminCap not found');
      const missionType = MISSION_TYPES[decision.mission_type];
      if (missionType === undefined) throw new Error(`Invalid mission type: ${decision.mission_type}`);
      const reqShipClass = decision.required_ship_class ? SHIP_CLASSES[decision.required_ship_class] ?? null : null;
      const { digest, templateId } = await exec.createMissionTemplate(ctx, adminCapId, {
        name: decision.name, description: decision.description || '',
        missionType, difficulty: Number(decision.difficulty) || 1,
        minAgentLevel: Number(decision.min_agent_level) || 0,
        minProcessing: Number(decision.min_processing) || 0,
        minMobility: Number(decision.min_mobility) || 0,
        minPower: Number(decision.min_power) || 0,
        requiredShipClass: reqShipClass,
        energyCost: Number(decision.energy_cost) || 0,
        galacticCost: toRaw(Number(decision.galactic_cost) || 0),
        durationEpochs: Number(decision.duration_epochs) || 1,
        baseReward: toRaw(Number(decision.base_reward) || 100),
        experienceReward: Number(decision.experience_reward) || 50,
        lootChance: Number(decision.loot_chance) || 20,
      });
      if (templateId) persistedState.missionTemplateIds.push(templateId);
      return { digest, description: `Created mission "${decision.name}" (${decision.mission_type}, diff:${decision.difficulty})` };
    }

    case 'mint_galactic': {
      const treasuryId = persistedState.sharedObjects.treasuryId;
      if (!treasuryId) throw new Error('GalacticTreasury not found');
      const recipient = decision.recipient || addr;
      const rawAmount = toRaw(Number(decision.amount));
      const digest = await exec.mintGalactic(ctx, treasuryId, rawAmount, recipient);
      return { digest, description: `Minted ${decision.amount} GALACTIC to ${recipient.slice(0, 10)}...` };
    }

    case 'fund_reward_pool': {
      const registryId = persistedState.sharedObjects.missionRegistryId;
      if (!registryId) throw new Error('MissionRegistry not found');
      const rawAmount = toRaw(Number(decision.amount));
      const digest = await exec.fundRewardPool(ctx, registryId, rawAmount);
      return { digest, description: `Funded reward pool with ${decision.amount} GALACTIC` };
    }

    case 'start_mission': {
      const registryId = persistedState.sharedObjects.missionRegistryId;
      if (!registryId) throw new Error('MissionRegistry not found');
      if (!isValidObjectId(decision.template_id)) throw new Error(`Invalid template_id: ${String(decision.template_id).slice(0, 40)}... — use exact ID from MISSION TEMPLATES list`);
      if (!isValidObjectId(decision.agent_id)) throw new Error(`Invalid agent_id: ${String(decision.agent_id).slice(0, 40)}...`);
      const epoch = await getCurrentEpoch();
      // Look up actual agent stats from game state
      const ownGameStateForMission = await queryGameState(addr);
      const agentData = ownGameStateForMission.agents.find(a => a.id === decision.agent_id);
      if (!agentData) throw new Error(`Agent ${decision.agent_id.slice(0, 10)}... not found in your roster`);
      const stats = { level: agentData.level, processing: agentData.processing, mobility: agentData.mobility, power: agentData.power, luck: agentData.luck };
      // Pre-validate eligibility against template requirements
      const [templateInfo] = await queryMissionTemplates([decision.template_id]);
      if (templateInfo) {
        if (stats.level < templateInfo.min_agent_level) throw new Error(`Agent level ${stats.level} < required ${templateInfo.min_agent_level}`);
        if (stats.processing < templateInfo.min_processing) throw new Error(`Agent processing ${stats.processing} < required ${templateInfo.min_processing}`);
        if (stats.mobility < templateInfo.min_mobility) throw new Error(`Agent mobility ${stats.mobility} < required ${templateInfo.min_mobility}`);
        if (stats.power < templateInfo.min_power) throw new Error(`Agent power ${stats.power} < required ${templateInfo.min_power}`);
      }
      // Check GALACTIC payment
      const missionCoins = await client.getCoins({ owner: addr, coinType: `${PACKAGE_ID}::galactic_token::GALACTIC_TOKEN` });
      if (missionCoins.data.length === 0 && templateInfo && templateInfo.galactic_cost > 0) {
        throw new Error(`No GALACTIC coins to pay mission cost of ${templateInfo.galactic_cost}`);
      }
      const galacticCost = templateInfo?.galactic_cost || 0;
      const { digest } = await exec.startMission(
        ctx, registryId, decision.template_id,
        decision.agent_id, decision.ship_id || null,
        stats, galacticCost, epoch,
      );
      return { digest, description: `Started mission on template ${decision.template_id.slice(0, 10)}...` };
    }

    case 'complete_mission': {
      const registryId = persistedState.sharedObjects.missionRegistryId;
      if (!registryId) throw new Error('MissionRegistry not found');
      if (!isValidObjectId(decision.template_id)) throw new Error(`Invalid template_id`);
      if (!isValidObjectId(decision.mission_id)) throw new Error(`Invalid mission_id`);
      const epoch = await getCurrentEpoch();
      const digest = await exec.completeMission(ctx, registryId, decision.template_id, decision.mission_id, epoch);
      return { digest, description: `Completed mission ${decision.mission_id.slice(0, 10)}...` };
    }

    case 'create_and_share_reactor': {
      const adminCapId = persistedState.sharedObjects.adminCaps.defiAdminCap;
      if (!adminCapId) throw new Error('DefiAdminCap not found');
      const { digest, reactorId } = await exec.createAndShareReactor(ctx, adminCapId);
      if (reactorId) persistedState.sharedObjects.reactorId = reactorId;
      return { digest, description: `Created Energy Reactor (LP pool)` };
    }

    case 'create_and_share_insurance_pool': {
      const adminCapId = persistedState.sharedObjects.adminCaps.defiAdminCap;
      if (!adminCapId) throw new Error('DefiAdminCap not found');
      const { digest, poolId } = await exec.createAndShareInsurancePool(ctx, adminCapId);
      if (poolId) persistedState.sharedObjects.insurancePoolId = poolId;
      return { digest, description: `Created Insurance Pool` };
    }

    case 'add_liquidity': {
      const reactorId = persistedState.sharedObjects.reactorId;
      if (!reactorId) throw new Error('Reactor not found');
      // Check available GALACTIC balance and cap amount
      const lpCoins = await client.getCoins({ owner: addr, coinType: `${PACKAGE_ID}::galactic_token::GALACTIC_TOKEN` });
      const galBalance = lpCoins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      // Convert human-readable amounts to raw units (9 decimals)
      const rawGalAmt = toRaw(Number(decision.galactic_amount));
      const rawSuiAmt = toRaw(Number(decision.sui_amount));
      // Enforce minimum: sqrt(galactic * sui) must be >= 1000 (MINIMUM_LIQUIDITY)
      const galAmt = Math.min(Number(galBalance), Math.max(rawGalAmt, 1_000));
      const suiAmt = Math.max(rawSuiAmt, 1_000);
      if (galAmt < 1_000) throw new Error(`Insufficient GALACTIC for liquidity (have ${galBalance}, need ≥1000)`);
      const epoch = await getCurrentEpoch();
      const { digest, receiptId } = await exec.addLiquidity(
        ctx, reactorId, galAmt, suiAmt, epoch,
      );
      if (receiptId) agentState.lpReceiptIds.push(receiptId);
      return { digest, description: `Added liquidity: ${galAmt} GALACTIC + ${suiAmt} SUI` };
    }

    case 'swap_galactic_for_sui': {
      const reactorId = persistedState.sharedObjects.reactorId;
      if (!reactorId) throw new Error('Reactor not found');
      // Cap galactic_amount at available balance
      const swapGalCoins = await client.getCoins({
        owner: addr,
        coinType: `${PACKAGE_ID}::galactic_token::GALACTIC_TOKEN`,
      });
      const swapGalBal = swapGalCoins.data.reduce((s, c) => s + BigInt(c.balance), 0n);
      const rawSwapAmt = toRaw(Number(decision.galactic_amount));
      const swapGalAmt = Math.min(rawSwapAmt, Number(swapGalBal));
      if (swapGalAmt < 1) throw new Error('No GALACTIC to swap');
      const digest = await exec.swapGalacticForSui(ctx, reactorId, swapGalAmt, 1); // min_out=1 to avoid slippage revert
      return { digest, description: `Swapped ${swapGalAmt} GALACTIC for SUI` };
    }

    case 'swap_sui_for_galactic': {
      const reactorId = persistedState.sharedObjects.reactorId;
      if (!reactorId) throw new Error('Reactor not found');
      // Cap SUI amount at available balance (leave some for gas)
      const suiCoins = await client.getCoins({ owner: addr });
      const suiBal = suiCoins.data.reduce((s, c) => s + BigInt(c.balance), 0n);
      const maxSui = Number(suiBal) - 50_000_000; // Reserve 0.05 SUI for gas
      const rawSwapAmt = toRaw(Number(decision.sui_amount));
      const swapSuiAmt = Math.min(rawSwapAmt, Math.max(maxSui, 0));
      if (swapSuiAmt < 1) throw new Error('No SUI to swap (need reserve for gas)');
      const digest = await exec.swapSuiForGalactic(ctx, reactorId, swapSuiAmt, 1); // min_out=1
      return { digest, description: `Swapped ${swapSuiAmt} SUI for GALACTIC` };
    }

    case 'purchase_insurance': {
      const poolId = persistedState.sharedObjects.insurancePoolId;
      if (!poolId) throw new Error('Insurance pool not found');
      const epoch = await getCurrentEpoch();
      const rawInsuredAmt = toRaw(Number(decision.insured_amount));
      const { digest, policyId } = await exec.purchaseInsurance(ctx, poolId, rawInsuredAmt, epoch);
      if (policyId) agentState.insurancePolicyIds.push(policyId);
      return { digest, description: `Purchased insurance for ${decision.insured_amount} GALACTIC` };
    }

    case 'assign_operator': {
      if (!isValidObjectId(decision.station_id)) throw new Error(`Invalid station_id`);
      if (!isValidObjectId(decision.agent_id)) throw new Error(`Invalid agent_id`);
      if (!agentState.ownedStationIds.includes(decision.station_id)) throw new Error(`station_id ${decision.station_id.slice(0, 10)}... not yours`);
      if (!agentState.ownedAgentIds.includes(decision.agent_id)) throw new Error(`agent_id ${decision.agent_id.slice(0, 10)}... not in your roster`);
      const digest = await exec.assignOperator(ctx, decision.station_id, decision.agent_id);
      return { digest, description: `Assigned operator to station` };
    }

    case 'dock_ship': {
      if (!isValidObjectId(decision.station_id)) throw new Error(`Invalid station_id`);
      if (!isValidObjectId(decision.ship_id)) throw new Error(`Invalid ship_id`);
      if (!agentState.ownedStationIds.includes(decision.station_id)) throw new Error(`station_id ${decision.station_id.slice(0, 10)}... not yours`);
      if (!agentState.ownedShipIds.includes(decision.ship_id)) throw new Error(`ship_id ${decision.ship_id.slice(0, 10)}... not in your fleet`);
      const digest = await exec.dockShip(ctx, decision.station_id, decision.ship_id);
      return { digest, description: `Docked ship at station` };
    }

    case 'create_voting_power': {
      // Compute actual voting power from on-chain data
      const galCoins = await client.getCoins({
        owner: addr,
        coinType: `${PACKAGE_ID}::galactic_token::GALACTIC_TOKEN`,
      });
      const galBalance = galCoins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      const ownGameStateVP = await queryGameState(addr);
      const totalLevels = ownGameStateVP.agents.reduce((sum, a) => sum + a.level, 0);
      const planets = await queryPlanets(persistedState.planetIds);
      const ownPlanets = planets.filter(p => p.owner === addr);
      const epoch = await getCurrentEpoch();
      const { digest, votingPowerId } = await exec.createVotingPower(
        ctx,
        Number(galBalance),
        0,
        totalLevels,
        ownPlanets.length,
        epoch,
      );
      if (votingPowerId) agentState.votingPowerId = votingPowerId;
      return { digest, description: `Created voting power (balance:${galBalance}, agents:${totalLevels} levels, planets:${ownPlanets.length})` };
    }

    case 'create_proposal': {
      const registryId = persistedState.sharedObjects.governanceRegistryId;
      if (!registryId) throw new Error('GovernanceRegistry not found');
      if (!agentState.votingPowerId) throw new Error('No VotingPower — create_voting_power first');
      const proposalType = PROPOSAL_TYPES[decision.proposal_type] ?? 0;
      // Compute correct cost based on proposal type (9-decimal amounts)
      const PROPOSAL_COSTS: Record<number, number> = {
        0: 1_000_000_000_000,     // Parameter: 1K GALACTIC
        1: 10_000_000_000_000,    // Emission: 10K GALACTIC
        2: 50_000_000_000_000,    // Feature: 50K GALACTIC
        3: 100_000_000_000_000,   // War: 100K GALACTIC
        4: 500_000_000_000_000,   // Upgrade: 500K GALACTIC
      };
      const galacticCost = PROPOSAL_COSTS[proposalType] ?? PROPOSAL_COSTS[0];
      const epoch = await getCurrentEpoch();
      const { digest, proposalId } = await exec.createProposal(
        ctx, registryId, agentState.votingPowerId,
        {
          title: decision.title, description: decision.description || '',
          proposalType,
          targetModule: decision.target_module || 'defi',
          targetFunction: decision.target_function || 'update_swap_fee',
          parameters: (decision.parameters || [25]).map((p: number) => Math.floor(Number(p))),
        },
        galacticCost, epoch,
      );
      if (proposalId) persistedState.proposalIds.push(proposalId);
      return { digest, description: `Created proposal: "${decision.title}" (cost: ${galacticCost / 1_000_000_000} GALACTIC)` };
    }

    case 'cast_vote': {
      if (!agentState.votingPowerId) throw new Error('No VotingPower');
      if (!isValidObjectId(decision.proposal_id)) throw new Error(`Invalid proposal_id`);
      const epoch = await getCurrentEpoch();
      const digest = await exec.castVote(ctx, decision.proposal_id, agentState.votingPowerId, decision.support !== false, epoch);
      return { digest, description: `Voted ${decision.support !== false ? 'FOR' : 'AGAINST'} proposal` };
    }

    case 'finalize_proposal': {
      const registryId = persistedState.sharedObjects.governanceRegistryId;
      if (!registryId) throw new Error('GovernanceRegistry not found');
      if (!isValidObjectId(decision.proposal_id)) throw new Error(`Invalid proposal_id`);
      const epoch = await getCurrentEpoch();
      const totalSupply = Number(decision.total_supply) || 1_000_000_000_000_000;
      const digest = await exec.finalizeProposal(ctx, registryId, decision.proposal_id, totalSupply, epoch);
      return { digest, description: `Finalized proposal ${decision.proposal_id.slice(0, 10)}...` };
    }

    case 'execute_proposal': {
      const registryId = persistedState.sharedObjects.governanceRegistryId;
      if (!registryId) throw new Error('GovernanceRegistry not found');
      if (!isValidObjectId(decision.proposal_id)) throw new Error(`Invalid proposal_id`);
      const epoch = await getCurrentEpoch();
      const digest = await exec.executeProposal(ctx, registryId, decision.proposal_id, epoch);
      return { digest, description: `Executed proposal ${decision.proposal_id.slice(0, 10)}...` };
    }

    default:
      throw new Error(`Unknown action: ${decision.action}`);
  }
}

// ── Helpers ──────────────────────────────────────────────────────
async function getCurrentEpoch(): Promise<number> {
  const info = await client.getLatestSuiSystemState();
  return Number(info.epoch);
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/** Validate that a string looks like a valid Sui object ID (0x + 64 hex chars) */
function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && /^0x[0-9a-fA-F]{64}$/.test(id);
}

/** Ensure a number is a non-negative integer (for u64 params) */
function u64(val: unknown): number {
  const n = Number(val) || 0;
  return Math.max(0, Math.floor(n));
}

const DECIMALS = 1_000_000_000; // 9 decimals for both GALACTIC and SUI

/** Convert human-readable amount to raw units (9 decimals) */
function toRaw(humanAmount: number): number {
  return Math.floor(humanAmount * DECIMALS);
}

/** Try to extract a valid JSON object from AI response */
function parseAIResponse(raw: string): any {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch { /* fallthrough */ }

  // Strip markdown code fences (```json ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch { /* fallthrough */ }
  }

  // Try to find the first balanced JSON object
  const start = raw.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') depth--;
      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, i + 1));
        } catch { break; }
      }
    }
  }

  throw new Error('Could not parse AI response as JSON');
}

// ── Main loop ────────────────────────────────────────────────────
let running = true;
process.on('SIGINT', () => {
  console.log('\n\n  Graceful shutdown requested...');
  running = false;
});

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  SUI-IN-SPACE  AUTONOMOUS WORLD-BUILDER  (v3)');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Package:    ${PACKAGE_ID}`);
  console.log(`  Network:    testnet`);
  console.log(`  Mode:       ${MAX_ROUNDS > 0 ? `${MAX_ROUNDS} rounds` : 'continuous (Ctrl+C to stop)'}`);
  console.log('────────────────────────────────────────────────────');
  console.log(`  NEXUS-7:    ${address1}`);
  console.log(`  KRAIT-X:    ${address2}`);
  console.log('════════════════════════════════════════════════════\n');

  // Fund KRAIT-X
  await fundSecondWallet();

  // Discover shared objects
  console.log('\n  Discovering shared objects...');
  const persistedState = await discoverSharedObjects(client, address1, PACKAGE_ID, address2);

  // Also discover existing planets and mission templates from events
  const eventPlanets = await discoverPlanets(client, PACKAGE_ID);
  const eventTemplates = await discoverMissionTemplates(client, PACKAGE_ID);
  for (const id of eventPlanets) {
    if (!persistedState.planetIds.includes(id)) persistedState.planetIds.push(id);
  }
  for (const id of eventTemplates) {
    if (!persistedState.missionTemplateIds.includes(id)) persistedState.missionTemplateIds.push(id);
  }

  // ── Fixup: correct any phase desync from previous runs ──
  // If KRAIT-X advanced to ECONOMY but reactor doesn't exist, reset to CONTENT
  if (persistedState.kraitX.phase === 'ECONOMY' && !persistedState.sharedObjects.reactorId) {
    console.log('  Fixup: KRAIT-X at ECONOMY but no reactor — resetting to CONTENT');
    persistedState.kraitX.phase = 'CONTENT';
    persistedState.kraitX.roundsInPhase = 0;
  }
  // If KRAIT-X at CONTENT but no mission templates exist, reset to COLONIZE
  if (persistedState.kraitX.phase === 'CONTENT' && persistedState.missionTemplateIds.length === 0) {
    if (persistedState.planetIds.length > 0) {
      console.log('  Fixup: KRAIT-X at CONTENT but no templates — resetting to COLONIZE');
      persistedState.kraitX.phase = 'COLONIZE';
      persistedState.kraitX.roundsInPhase = 0;
    }
  }

  // ── Sync owned objects from chain (replaces cached lists with chain truth) ──
  console.log('\n  Syncing owned objects from chain...');
  for (const [key, agentState] of [['nexus7', persistedState.nexus7], ['kraitX', persistedState.kraitX]] as const) {
    const gameState = await queryGameState(agentState.address);
    agentState.ownedAgentIds = gameState.agents.map(a => a.id);
    agentState.ownedShipIds = gameState.ships.map(s => s.id);
    agentState.ownedStationIds = gameState.stations.map(s => s.id);
    console.log(`  ${agentState.name}: ${agentState.ownedAgentIds.length} agents, ${agentState.ownedShipIds.length} ships, ${agentState.ownedStationIds.length} stations on-chain`);
  }

  // ── Pre-game: ensure GALACTIC tokens exist (test mode only) ──
  const PREMINT = process.env.AGENT_PREMINT_GALACTIC === 'true';
  const treasuryId = persistedState.sharedObjects.treasuryId;
  if (PREMINT && treasuryId) {
    const MINT_AMOUNT = 1_000_000_000_000_000; // 1M GALACTIC per agent (9 decimals)
    const ctx1 = { client, signer: keypair1, packageId: PACKAGE_ID };
    for (const [addr, label] of [[address1, 'NEXUS-7'], [address2, 'KRAIT-X']] as const) {
      const galactic = await client.getCoins({
        owner: addr,
        coinType: `${PACKAGE_ID}::galactic_token::GALACTIC_TOKEN`,
      });
      if (galactic.data.length === 0) {
        console.log(`  Minting ${MINT_AMOUNT} GALACTIC for ${label}...`);
        try {
          const digest = await exec.mintGalactic(ctx1, treasuryId, MINT_AMOUNT, addr);
          console.log(`  Minted! Tx: ${digest}`);
          await sleep(2000);
        } catch (e: any) {
          console.error(`  Failed to mint GALACTIC for ${label}: ${e.message?.slice(0, 150)}`);
        }
      } else {
        const total = galactic.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
        console.log(`  ${label} has ${total} GALACTIC`);
      }
    }
  } else if (PREMINT) {
    console.log('  Warning: GalacticTreasury not found — skipping pre-game mint');
  }

  // ── Lower governance params for testing ──
  const govAdminCap = persistedState.sharedObjects.adminCaps.governanceAdminCap;
  const govRegistryId = persistedState.sharedObjects.governanceRegistryId;
  if (govAdminCap && govRegistryId) {
    try {
      const ctx1 = { client, signer: keypair1, packageId: PACKAGE_ID };
      console.log('  Setting governance parameters for testing...');
      const digest = await exec.updateGovernanceParameters(ctx1, govAdminCap, govRegistryId, {
        votingPeriod: 1,
        executionDelay: 0,
        proposalThreshold: 1_000_000_000, // 1 GALACTIC (9 decimals)
        quorumThreshold: 10,
      });
      console.log(`  Governance params updated! Tx: ${digest}`);
      await sleep(2000);
    } catch (e: any) {
      console.error(`  Failed to update governance params: ${e.message?.slice(0, 150)}`);
    }
  }

  savePersistedState(persistedState);

  let totalRound = 0;
  const agentOrder = ['NEXUS-7', 'KRAIT-X'] as const;

  while (running) {
    totalRound++;
    if (MAX_ROUNDS > 0 && totalRound > MAX_ROUNDS) break;

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  ROUND ${totalRound}${MAX_ROUNDS > 0 ? ` / ${MAX_ROUNDS}` : ''}`);
    console.log(`${'═'.repeat(50)}`);

    for (const agentName of agentOrder) {
      if (!running) break;

      const { profile, keypair } = PROFILES[agentName];
      const agentState = agentName === 'NEXUS-7' ? persistedState.nexus7 : persistedState.kraitX;
      const rivalName = agentName === 'NEXUS-7' ? 'KRAIT-X' : 'NEXUS-7';
      const rivalState = agentName === 'NEXUS-7' ? persistedState.kraitX : persistedState.nexus7;

      // Check phase transition
      const ownGameState = await queryGameState(agentState.address);
      const nextPhase = checkTransition(agentState, ownGameState, persistedState);
      if (nextPhase) {
        console.log(`\n  ${agentName}: Phase transition ${agentState.phase} → ${nextPhase}`);
        agentState.phase = nextPhase;
        agentState.roundsInPhase = 0;
      }

      // Check if should skip (waiting for other agent)
      if (shouldSkipTurn(agentState, persistedState)) {
        console.log(`  ${agentName}: Waiting (phase=${agentState.phase})...`);
        // Auto-advance KRAIT-X from WORLD_BUILD to COLONIZE if planets exist
        if (agentState.phase === 'WORLD_BUILD' && agentState.role === 'rival_player' && persistedState.planetIds.length >= 1) {
          agentState.phase = 'COLONIZE';
          agentState.roundsInPhase = 0;
          console.log(`  ${agentName}: Advancing to COLONIZE (planets available)`);
        }
        continue;
      }

      // Get available actions for this phase, then filter by prerequisites
      let actions = getAvailableActions(agentState.phase, agentState.role);
      // Governance prerequisite: need VotingPower before proposals/votes
      if (!agentState.votingPowerId) {
        actions = actions.filter(a => a !== 'create_proposal' && a !== 'cast_vote');
      } else {
        // Already have VotingPower — don't create another
        actions = actions.filter(a => a !== 'create_voting_power');
      }
      // Can't vote if no proposals exist
      if (persistedState.proposalIds.length === 0) {
        actions = actions.filter(a => a !== 'cast_vote');
      }
      // Can't assign pilot/crew/operator/dock without owning ships/agents/stations
      if (agentState.ownedShipIds.length === 0) {
        actions = actions.filter(a => a !== 'assign_pilot' && a !== 'add_crew' && a !== 'dock_ship');
      }
      if (agentState.ownedAgentIds.length === 0) {
        actions = actions.filter(a => a !== 'assign_pilot' && a !== 'add_crew' && a !== 'assign_operator' && a !== 'train_agent' && a !== 'upgrade_agent');
      }
      if (agentState.ownedStationIds.length === 0) {
        actions = actions.filter(a => a !== 'assign_operator' && a !== 'dock_ship');
      }
      // Filter actions that require GALACTIC coins when agent has none
      const galacticCoins = await client.getCoins({
        owner: agentState.address,
        coinType: `${PACKAGE_ID}::galactic_token::GALACTIC_TOKEN`,
      });
      if (galacticCoins.data.length === 0) {
        actions = actions.filter(a =>
          a !== 'create_proposal' && a !== 'add_liquidity' &&
          a !== 'swap_galactic_for_sui' && a !== 'fund_reward_pool'
        );
      }
      // Auto-create voting power if in governance-capable phase and missing
      if (['GOVERNANCE', 'SUSTAIN'].includes(agentState.phase) && !agentState.votingPowerId) {
        if (actions.includes('create_voting_power')) {
          console.log(`  ${agentName}: Auto-creating voting power...`);
          try {
            const result = await executeDecision(
              { action: 'create_voting_power' },
              agentName, agentState, persistedState, keypair,
            );
            console.log(`  ${agentName}: ${result.description}`);
            logActivity(createActivityEntry(agentName, agentState.phase, 'create_voting_power', result.description, 'Auto-created (prerequisite)', result.digest, true, {}));
            await sleep(3000);
          } catch (e: any) {
            console.error(`  ${agentName}: Auto-create voting power failed: ${e.message?.slice(0, 150)}`);
          }
        }
      }

      // Auto-vote on active proposals (skip already-voted)
      if (!agentState.votedProposalIds) agentState.votedProposalIds = [];
      if (['GOVERNANCE', 'SUSTAIN'].includes(agentState.phase) && agentState.votingPowerId && persistedState.proposalIds.length > 0) {
        const currentEpochForVote = await getCurrentEpoch();
        const activeProposals = await queryProposals(persistedState.proposalIds);
        const votable = activeProposals.filter(p =>
          p.status === 0 && p.voting_ends_at > currentEpochForVote &&
          !agentState.votedProposalIds.includes(p.id)
        );
        for (const proposal of votable) {
          console.log(`  ${agentName}: Auto-voting FOR proposal "${proposal.title}"...`);
          try {
            const result = await executeDecision(
              { action: 'cast_vote', proposal_id: proposal.id, support: true },
              agentName, agentState, persistedState, keypair,
            );
            console.log(`  ${agentName}: ${result.description}`);
            agentState.votedProposalIds.push(proposal.id);
            logActivity(createActivityEntry(agentName, agentState.phase, 'cast_vote', result.description, 'Auto-voted (governance lifecycle)', result.digest, true, {}));
            await sleep(2000);
          } catch (e: any) {
            // If already voted on-chain (abort code 4), track it to avoid retrying
            agentState.votedProposalIds.push(proposal.id);
            console.error(`  ${agentName}: Auto-vote failed: ${e.message?.slice(0, 150)}`);
          }
        }
      }

      // Auto-finalize proposals past voting period
      if (['GOVERNANCE', 'SUSTAIN'].includes(agentState.phase) && persistedState.proposalIds.length > 0) {
        const currentEpochForFinalize = await getCurrentEpoch();
        const allProposals = await queryProposals(persistedState.proposalIds);
        const finalizable = allProposals.filter(p => p.status === 0 && p.voting_ends_at <= currentEpochForFinalize);
        for (const proposal of finalizable) {
          console.log(`  ${agentName}: Auto-finalizing proposal "${proposal.title}"...`);
          try {
            const result = await executeDecision(
              { action: 'finalize_proposal', proposal_id: proposal.id },
              agentName, agentState, persistedState, keypair,
            );
            console.log(`  ${agentName}: ${result.description}`);
            logActivity(createActivityEntry(agentName, agentState.phase, 'finalize_proposal', result.description, 'Auto-finalized (governance lifecycle)', result.digest, true, {}));
            await sleep(2000);
          } catch (e: any) {
            console.error(`  ${agentName}: Auto-finalize failed: ${e.message?.slice(0, 150)}`);
          }
        }
      }

      // Auto-execute passed proposals
      if (['GOVERNANCE', 'SUSTAIN'].includes(agentState.phase) && persistedState.proposalIds.length > 0) {
        const currentEpochForExec = await getCurrentEpoch();
        const execProposals = await queryProposals(persistedState.proposalIds);
        const executable = execProposals.filter(p => p.status === 1 && p.execution_after <= currentEpochForExec);
        for (const proposal of executable) {
          console.log(`  ${agentName}: Auto-executing proposal "${proposal.title}"...`);
          try {
            const result = await executeDecision(
              { action: 'execute_proposal', proposal_id: proposal.id },
              agentName, agentState, persistedState, keypair,
            );
            console.log(`  ${agentName}: ${result.description}`);
            logActivity(createActivityEntry(agentName, agentState.phase, 'execute_proposal', result.description, 'Auto-executed (governance lifecycle)', result.digest, true, {}));
            await sleep(2000);
          } catch (e: any) {
            console.error(`  ${agentName}: Auto-execute failed: ${e.message?.slice(0, 150)}`);
          }
        }
      }

      // Force governance actions every 3rd round in SUSTAIN
      if (agentState.phase === 'SUSTAIN' && agentState.roundsInPhase % 3 === 0) {
        const govActions = actions.filter(a =>
          ['create_voting_power', 'create_proposal', 'cast_vote', 'finalize_proposal', 'execute_proposal'].includes(a)
        );
        if (govActions.length > 0) {
          actions = govActions;
          console.log(`  ${agentName}: Governance round — restricted to: ${actions.join(', ')}`);
        }
      }

      if (actions.length === 0) continue;

      const objectives = getPhaseObjectives(agentState.phase, agentState.role);
      const temp = getPhaseTemperature(agentState.phase, profile.temperature);

      // Query world state for the prompt
      const rivalGameState = await queryGameState(rivalState.address);
      const planets = await queryPlanets(persistedState.planetIds);
      const templates = await queryMissionTemplates(persistedState.missionTemplateIds);

      // Query GALACTIC balance for this agent
      const agentGalCoins = await client.getCoins({
        owner: agentState.address,
        coinType: `${PACKAGE_ID}::galactic_token::GALACTIC_TOKEN`,
      });
      const agentGalBalance = agentGalCoins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);

      // Query reactor state if it exists
      let reactorState: ReactorInfo | null = null;
      if (persistedState.sharedObjects.reactorId) {
        reactorState = await queryReactorState(persistedState.sharedObjects.reactorId);
      }

      // Query proposals if any exist
      let proposalInfos: ProposalInfo[] = [];
      if (persistedState.proposalIds.length > 0) {
        proposalInfos = await queryProposals(persistedState.proposalIds);
      }

      // Can't colonize if all planets are already owned
      if (planets.length > 0 && planets.every(p => p.owner)) {
        actions = actions.filter(a => a !== 'colonize_planet');
      }
      // DeFi prerequisites: need reactor for liquidity/swaps, need pool for insurance
      if (!persistedState.sharedObjects.reactorId) {
        actions = actions.filter(a => a !== 'add_liquidity' && a !== 'swap_galactic_for_sui' && a !== 'swap_sui_for_galactic');
      } else if (actions.some(a => a === 'swap_galactic_for_sui' || a === 'swap_sui_for_galactic')) {
        // Can't swap against an empty pool — check reactor reserves
        try {
          const rObj = await client.getObject({ id: persistedState.sharedObjects.reactorId, options: { showContent: true } });
          const rFields = rObj.data?.content && 'fields' in rObj.data.content ? (rObj.data.content as any).fields : null;
          const galReserve = Number(rFields?.galactic_reserve?.fields?.balance ?? rFields?.galactic_reserve ?? 0);
          const suiReserve = Number(rFields?.sui_reserve?.fields?.balance ?? rFields?.sui_reserve ?? 0);
          if (galReserve === 0 || suiReserve === 0) {
            actions = actions.filter(a => a !== 'swap_galactic_for_sui' && a !== 'swap_sui_for_galactic');
          }
        } catch { /* proceed without filtering */ }
      }
      if (!persistedState.sharedObjects.insurancePoolId) {
        actions = actions.filter(a => a !== 'purchase_insurance');
      }
      // One-time setup: don't offer if already created
      if (persistedState.sharedObjects.reactorId) {
        actions = actions.filter(a => a !== 'create_and_share_reactor');
      }
      if (persistedState.sharedObjects.insurancePoolId) {
        actions = actions.filter(a => a !== 'create_and_share_insurance_pool');
      }
      // Can't start missions without templates or GALACTIC for payment
      if (templates.length === 0) {
        actions = actions.filter(a => a !== 'start_mission' && a !== 'complete_mission');
      }
      // No planets to extract/upgrade/colonize if none discovered
      if (planets.length === 0) {
        actions = actions.filter(a => a !== 'colonize_planet' && a !== 'extract_resources' && a !== 'upgrade_defense');
      }

      // Governance lifecycle prerequisites
      if (proposalInfos.length === 0) {
        actions = actions.filter(a => a !== 'finalize_proposal' && a !== 'execute_proposal' && a !== 'cast_vote');
      } else {
        const currentEpochForFilter = await getCurrentEpoch();
        // finalize_proposal: only if there are Active (status=0) proposals past voting period
        const finalizableProposals = proposalInfos.filter(p => p.status === 0 && p.voting_ends_at <= currentEpochForFilter);
        if (finalizableProposals.length === 0) {
          actions = actions.filter(a => a !== 'finalize_proposal');
        }
        // execute_proposal: only if there are Passed (status=1) proposals past execution delay
        const executableProposals = proposalInfos.filter(p => p.status === 1 && p.execution_after <= currentEpochForFilter);
        if (executableProposals.length === 0) {
          actions = actions.filter(a => a !== 'execute_proposal');
        }
        // cast_vote: only if there are Active proposals (not past voting period)
        const votableProposals = proposalInfos.filter(p => p.status === 0 && p.voting_ends_at > currentEpochForFilter);
        if (votableProposals.length === 0) {
          actions = actions.filter(a => a !== 'cast_vote');
        }
      }

      if (actions.length === 0) continue;

      // Build prompt
      const systemPrompt = buildSystemPrompt(profile, rivalName, rivalState.address, agentState.phase, objectives, actions);
      const userPrompt = buildUserPrompt(ownGameState, rivalGameState, rivalName, agentState.phase, persistedState, planets, templates, agentState, agentGalBalance, reactorState, proposalInfos);

      console.log(`\n${'─'.repeat(50)}`);
      console.log(`  ${agentName} [${agentState.phase}] (round ${agentState.roundsInPhase + 1}) thinking...`);
      console.log(`${'─'.repeat(50)}`);

      // Call AI
      let decision: any;
      try {
        const completion = await ai.chat.completions.create({
          model: AGENT_AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: temp,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content || '{}';
        console.log(`  ${agentName} decided:`, raw.slice(0, 200));
        decision = parseAIResponse(raw);
        if (!decision.action) throw new Error('AI response missing "action" field');
        // Validate AI action against available actions list
        if (!actions.includes(decision.action)) {
          throw new Error(`Action "${decision.action}" not available in ${agentState.phase} phase. Available: ${actions.join(', ')}`);
        }
      } catch (e: any) {
        const code = e.code || e.status;
        if (code === '1113' || e.status === 429) {
          console.error(`  ${agentName}: AI rate-limited or billing error (code=${code})`);
        } else {
          console.error(`  ${agentName}: AI error:`, e.message?.slice(0, 200));
        }
        continue;
      }

      // Execute
      let digest: string | null = null;
      let description = '';
      let success = false;
      try {
        const result = await executeDecision(decision, agentName, agentState, persistedState, keypair);
        digest = result.digest;
        description = result.description;
        success = true;
        console.log(`  ${agentName}: SUCCESS — ${description}`);
        if (digest) console.log(`  Tx: https://suiscan.xyz/testnet/tx/${digest}`);
        // Track AI-initiated votes to avoid auto-vote re-voting
        if (decision.action === 'cast_vote' && decision.proposal_id) {
          if (!agentState.votedProposalIds) agentState.votedProposalIds = [];
          if (!agentState.votedProposalIds.includes(decision.proposal_id)) {
            agentState.votedProposalIds.push(decision.proposal_id);
          }
        }
      } catch (e: any) {
        description = `Failed: ${e.message?.slice(0, 200)}`;
        console.error(`  ${agentName}: ${description}`);
      }

      // Log activity
      logActivity(createActivityEntry(
        agentName, agentState.phase, decision.action || 'unknown',
        description, decision.reasoning || '',
        digest, success, { decision },
      ));

      // Update agent state
      agentState.roundsInPhase++;
      agentState.totalRounds++;

      // Save state
      savePersistedState(persistedState);

      // Sleep between agents
      const sleepMs = ['SUSTAIN', 'GOVERNANCE'].includes(agentState.phase) ? 15000 : 8000;
      if (running) {
        console.log(`  Waiting ${sleepMs / 1000}s...`);
        await sleep(sleepMs);
      }
    }
  }

  // Final summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log('  SESSION COMPLETE');
  console.log(`${'═'.repeat(50)}`);
  console.log(`  NEXUS-7: phase=${persistedState.nexus7.phase}, rounds=${persistedState.nexus7.totalRounds}`);
  console.log(`  KRAIT-X: phase=${persistedState.kraitX.phase}, rounds=${persistedState.kraitX.totalRounds}`);
  console.log(`  Planets discovered: ${persistedState.planetIds.length}`);
  console.log(`  Mission templates: ${persistedState.missionTemplateIds.length}`);
  console.log(`  Reactor: ${persistedState.sharedObjects.reactorId ? 'created' : 'not yet'}`);
  console.log(`  Insurance: ${persistedState.sharedObjects.insurancePoolId ? 'created' : 'not yet'}`);
  console.log('════════════════════════════════════════════════════\n');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
