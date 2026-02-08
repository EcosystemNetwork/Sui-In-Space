/**
 * Shared object + AdminCap discovery.
 * Finds all shared objects and admin caps created at deploy time.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import type { PersistedState, SharedObjectIds, AdminCapIds, AgentState } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Write to public/ so Vite dev server serves it at /agent-state.json
const STATE_FILE = resolve(__dirname, '../../public/agent-state.json');

// ── Default states ───────────────────────────────────────────────

function defaultAgentState(name: string, role: 'game_master' | 'rival_player', address: string): AgentState {
  return {
    name, role, address,
    phase: 'GENESIS',
    roundsInPhase: 0,
    totalRounds: 0,
    ownedAgentIds: [],
    ownedShipIds: [],
    ownedStationIds: [],
    votedProposalIds: [],
    lpReceiptIds: [],
    insurancePolicyIds: [],
  };
}

function defaultPersistedState(packageId: string, addr1: string, addr2: string): PersistedState {
  return {
    packageId,
    sharedObjects: { adminCaps: {} },
    nexus7: defaultAgentState('NEXUS-7', 'game_master', addr1),
    kraitX: defaultAgentState('KRAIT-X', 'rival_player', addr2),
    planetIds: [],
    missionTemplateIds: [],
    proposalIds: [],
    lastUpdated: new Date().toISOString(),
  };
}

// ── Load / save ──────────────────────────────────────────────────

export function loadPersistedState(): PersistedState | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

export function savePersistedState(state: PersistedState): void {
  state.lastUpdated = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Discovery ────────────────────────────────────────────────────

export async function discoverSharedObjects(
  client: SuiJsonRpcClient,
  deployerAddress: string,
  packageId: string,
  kraitXAddress: string,
): Promise<PersistedState> {
  // Try loading cached state first
  const cached = loadPersistedState();
  if (cached && cached.packageId === packageId && cached.sharedObjects.treasuryId) {
    console.log('  Loaded cached state from agent-state.json');
    // Update addresses in case they changed
    cached.nexus7.address = deployerAddress;
    cached.kraitX.address = kraitXAddress;
    return cached;
  }

  console.log('  Discovering shared objects and admin caps...');
  const state = cached && cached.packageId === packageId
    ? cached
    : defaultPersistedState(packageId, deployerAddress, kraitXAddress);

  // 1) Find shared objects by scanning deployer's recent transactions
  const txBlocks = await client.queryTransactionBlocks({
    filter: { FromAddress: deployerAddress },
    options: { showObjectChanges: true },
    limit: 50,
    order: 'descending',
  });

  for (const tx of txBlocks.data) {
    const changes = tx.objectChanges || [];
    for (const change of changes) {
      if (change.type !== 'created') continue;
      const objType = (change as any).objectType || '';
      const objId = (change as any).objectId || '';

      // Shared objects — only match current package
      if (!objType.includes(packageId)) continue;
      if (objType.includes('::galactic_token::GalacticTreasury')) {
        state.sharedObjects.treasuryId = objId;
      } else if (objType.includes('::missions::MissionRegistry')) {
        state.sharedObjects.missionRegistryId = objId;
      } else if (objType.includes('::governance::GovernanceRegistry')) {
        state.sharedObjects.governanceRegistryId = objId;
      } else if (objType.includes('::code_registry::CodeRegistry')) {
        state.sharedObjects.codeRegistryId = objId;
      } else if (objType.includes('::defi::EnergyReactor')) {
        state.sharedObjects.reactorId = objId;
      } else if (objType.includes('::defi::InsurancePool')) {
        state.sharedObjects.insurancePoolId = objId;
      }
    }
  }

  // 2) Find AdminCaps from owned objects
  const adminCaps = await findAdminCaps(client, deployerAddress, packageId);
  state.sharedObjects.adminCaps = adminCaps;

  // 3) Save and return
  savePersistedState(state);
  console.log('  Discovery complete. Shared objects:', JSON.stringify(state.sharedObjects, null, 2));
  return state;
}

async function findAdminCaps(
  client: SuiJsonRpcClient,
  ownerAddress: string,
  packageId: string,
): Promise<AdminCapIds> {
  const caps: AdminCapIds = {};

  let cursor: string | null | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await client.getOwnedObjects({
      owner: ownerAddress,
      options: { showType: true },
      ...(cursor ? { cursor } : {}),
    });

    for (const obj of page.data) {
      const type = obj.data?.type || '';
      const id = obj.data?.objectId || '';

      if (!type.includes(packageId)) continue;

      if (type.includes('::planet::PlanetAdminCap')) caps.planetAdminCap = id;
      else if (type.includes('::missions::MissionAdminCap')) caps.missionAdminCap = id;
      else if (type.includes('::defi::DefiAdminCap')) caps.defiAdminCap = id;
      else if (type.includes('::governance::GovernanceAdminCap')) caps.governanceAdminCap = id;
      else if (type.includes('::agent::AgentAdminCap')) caps.agentAdminCap = id;
      else if (type.includes('::ship::ShipAdminCap')) caps.shipAdminCap = id;
      else if (type.includes('::station::StationAdminCap')) caps.stationAdminCap = id;
      else if (type.includes('::code_registry::RegistryAdminCap')) caps.registryAdminCap = id;
      else if (type.includes('::galactic_token::AdminCap')) caps.galacticAdminCap = id;
    }

    hasMore = page.hasNextPage;
    cursor = page.nextCursor;
  }

  return caps;
}

/**
 * Find planet IDs from PlanetDiscovered events.
 */
export async function discoverPlanets(
  client: SuiJsonRpcClient,
  packageId: string,
): Promise<string[]> {
  const ids: string[] = [];
  try {
    const events = await client.queryEvents({
      query: { MoveEventType: `${packageId}::planet::PlanetDiscovered` },
      limit: 50,
    });
    for (const ev of events.data) {
      const parsed = ev.parsedJson as any;
      if (parsed?.planet_id) ids.push(parsed.planet_id);
    }
  } catch {
    // Events may not exist yet
  }
  return ids;
}

/**
 * Find mission template IDs from MissionTemplateCreated events.
 */
export async function discoverMissionTemplates(
  client: SuiJsonRpcClient,
  packageId: string,
): Promise<string[]> {
  const ids: string[] = [];
  try {
    const events = await client.queryEvents({
      query: { MoveEventType: `${packageId}::missions::MissionTemplateCreated` },
      limit: 50,
    });
    for (const ev of events.data) {
      const parsed = ev.parsedJson as any;
      if (parsed?.template_id) ids.push(parsed.template_id);
    }
  } catch {
    // Events may not exist yet
  }
  return ids;
}
