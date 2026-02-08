/**
 * Action executor functions for all on-chain operations.
 * Each function builds a PTB, signs, and executes.
 */

import type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

// ── Helper ───────────────────────────────────────────────────────

interface ExecContext {
  client: SuiJsonRpcClient;
  signer: Ed25519Keypair;
  packageId: string;
}

async function execute(ctx: ExecContext, tx: Transaction): Promise<{ digest: string; objectChanges: any[] }> {
  const result = await ctx.client.signAndExecuteTransaction({
    transaction: tx,
    signer: ctx.signer,
    options: { showEffects: true, showObjectChanges: true },
  });
  if (result.effects?.status?.status !== 'success') {
    const err = result.effects?.status?.error || 'Transaction failed';
    throw new Error(err);
  }
  return { digest: result.digest, objectChanges: result.objectChanges || [] };
}

function mod(ctx: ExecContext, module: string): string {
  return `${ctx.packageId}::${module}`;
}

/** Find a created object of a given type from objectChanges */
function findCreatedObject(changes: any[], typeFragment: string): string | null {
  const found = changes.find(
    (c: any) => c.type === 'created' && (c.objectType || '').includes(typeFragment),
  );
  return found?.objectId || null;
}

// ── Original basic actions (from run-agents.ts) ──────────────────

export async function mintAgent(
  ctx: ExecContext, recipientAddress: string,
  name: string, agentType: number, agentClass: number,
): Promise<{ digest: string; agentId: string | null }> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'agent')}::mint_agent_to`,
    arguments: [
      tx.pure.string(name),
      tx.pure.u8(agentType),
      tx.pure.u8(agentClass),
      tx.pure.string('GLM-4'),
      tx.pure.address(recipientAddress),
    ],
  });
  const { digest, objectChanges } = await execute(ctx, tx);
  const agentId = findCreatedObject(objectChanges, '::agent::Agent');
  return { digest, agentId };
}

export async function buildShip(
  ctx: ExecContext, recipientAddress: string,
  name: string, shipClass: number,
): Promise<{ digest: string; shipId: string | null }> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'ship')}::build_ship_to`,
    arguments: [
      tx.pure.string(name),
      tx.pure.u8(shipClass),
      tx.pure.address(recipientAddress),
    ],
  });
  const { digest, objectChanges } = await execute(ctx, tx);
  const shipId = findCreatedObject(objectChanges, '::ship::Ship');
  return { digest, shipId };
}

export async function buildStation(
  ctx: ExecContext, recipientAddress: string,
  name: string, stationType: number, x: number, y: number, z: number,
): Promise<{ digest: string; stationId: string | null }> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'station')}::build_station_to`,
    arguments: [
      tx.pure.string(name),
      tx.pure.u8(stationType),
      tx.pure(bcs.vector(bcs.u8()).serialize([])),
      tx.pure.u64(x),
      tx.pure.u64(y),
      tx.pure.u64(z),
      tx.pure.address(recipientAddress),
    ],
  });
  const { digest, objectChanges } = await execute(ctx, tx);
  const stationId = findCreatedObject(objectChanges, '::station::Station');
  return { digest, stationId };
}

export async function trainAgent(
  ctx: ExecContext, agentObjectId: string,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'agent')}::add_experience`,
    arguments: [tx.object(agentObjectId), tx.pure.u64(100)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function upgradeAgent(
  ctx: ExecContext, agentObjectId: string,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'agent')}::upgrade_firmware`,
    arguments: [tx.object(agentObjectId)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function assignPilot(
  ctx: ExecContext, shipObjectId: string, agentObjectId: string,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'ship')}::assign_pilot`,
    arguments: [tx.object(shipObjectId), tx.pure.id(agentObjectId)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function addCrew(
  ctx: ExecContext, shipObjectId: string, agentObjectId: string,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'ship')}::add_crew`,
    arguments: [tx.object(shipObjectId), tx.pure.id(agentObjectId)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

// ── Planet actions (admin-only: discover; player: colonize, etc.) ─

export async function discoverPlanet(
  ctx: ExecContext, adminCapId: string,
  name: string, planetType: number, galaxyId: number, systemId: number,
  x: number, y: number, z: number,
  primaryResource: number, secondaryResource: number | null,
  totalReserves: number,
): Promise<{ digest: string; planetId: string | null }> {
  const tx = new Transaction();

  // Build secondary_resource Option<u8>
  const secondaryOpt = secondaryResource !== null
    ? tx.pure(bcs.option(bcs.u8()).serialize(secondaryResource))
    : tx.pure(bcs.option(bcs.u8()).serialize(null));

  const [planet] = tx.moveCall({
    target: `${mod(ctx, 'planet')}::discover_planet`,
    arguments: [
      tx.object(adminCapId),
      tx.pure.string(name),
      tx.pure.u8(planetType),
      tx.pure.u64(galaxyId),
      tx.pure.u64(systemId),
      tx.pure.u64(x),
      tx.pure.u64(y),
      tx.pure.u64(z),
      tx.pure.u8(primaryResource),
      secondaryOpt,
      tx.pure.u64(totalReserves),
    ],
  });

  // Planet has key+store, so we can share it from a PTB
  tx.moveCall({
    target: '0x2::transfer::public_share_object',
    typeArguments: [`${ctx.packageId}::planet::Planet`],
    arguments: [planet],
  });

  const { digest, objectChanges } = await execute(ctx, tx);
  const planetId = findCreatedObject(objectChanges, '::planet::Planet');
  return { digest, planetId };
}

export async function colonizePlanet(
  ctx: ExecContext, planetId: string,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'planet')}::colonize`,
    arguments: [tx.object(planetId)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function extractResources(
  ctx: ExecContext, planetId: string, currentEpoch: number,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'planet')}::extract_resources`,
    arguments: [tx.object(planetId), tx.pure.u64(currentEpoch)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function upgradeDefense(
  ctx: ExecContext, planetId: string, amount: number,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'planet')}::upgrade_defense`,
    arguments: [tx.object(planetId), tx.pure.u64(amount)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

// ── Mission actions ──────────────────────────────────────────────

export async function createMissionTemplate(
  ctx: ExecContext, adminCapId: string,
  params: {
    name: string; description: string; missionType: number; difficulty: number;
    minAgentLevel: number; minProcessing: number; minMobility: number; minPower: number;
    requiredShipClass: number | null; energyCost: number; galacticCost: number;
    durationEpochs: number; baseReward: number; experienceReward: number; lootChance: number;
  },
): Promise<{ digest: string; templateId: string | null }> {
  const tx = new Transaction();

  const shipClassOpt = params.requiredShipClass !== null
    ? tx.pure(bcs.option(bcs.u8()).serialize(params.requiredShipClass))
    : tx.pure(bcs.option(bcs.u8()).serialize(null));

  const [template] = tx.moveCall({
    target: `${mod(ctx, 'missions')}::create_mission_template`,
    arguments: [
      tx.object(adminCapId),
      tx.pure.string(params.name),
      tx.pure.string(params.description),
      tx.pure.u8(params.missionType),
      tx.pure.u8(params.difficulty),
      tx.pure.u64(params.minAgentLevel),
      tx.pure.u64(params.minProcessing),
      tx.pure.u64(params.minMobility),
      tx.pure.u64(params.minPower),
      shipClassOpt,
      tx.pure.u64(params.energyCost),
      tx.pure.u64(params.galacticCost),
      tx.pure.u64(params.durationEpochs),
      tx.pure.u64(params.baseReward),
      tx.pure.u64(params.experienceReward),
      tx.pure.u64(params.lootChance),
    ],
  });

  // MissionTemplate has key+store — share it
  tx.moveCall({
    target: '0x2::transfer::public_share_object',
    typeArguments: [`${ctx.packageId}::missions::MissionTemplate`],
    arguments: [template],
  });

  const { digest, objectChanges } = await execute(ctx, tx);
  const templateId = findCreatedObject(objectChanges, '::missions::MissionTemplate');
  return { digest, templateId };
}

export async function fundRewardPool(
  ctx: ExecContext, registryId: string, amount: number,
): Promise<string> {
  const tx = new Transaction();
  // Split GALACTIC from gas — but GALACTIC is not gas. We need actual GALACTIC coins.
  // For the game master, GALACTIC must first be minted then used.
  // This will be called after minting GALACTIC to the signer.
  // Find GALACTIC coins owned by signer
  const signerAddr = ctx.signer.toSuiAddress();
  const coins = await ctx.client.getCoins({
    owner: signerAddr,
    coinType: `${ctx.packageId}::galactic_token::GALACTIC_TOKEN`,
  });

  if (coins.data.length === 0) throw new Error('No GALACTIC coins available for funding');

  // Use first coin, split if needed
  const coinId = coins.data[0].coinObjectId;
  const [payment] = tx.splitCoins(tx.object(coinId), [amount]);

  tx.moveCall({
    target: `${mod(ctx, 'missions')}::fund_reward_pool`,
    arguments: [tx.object(registryId), payment],
  });

  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function startMission(
  ctx: ExecContext, registryId: string, templateId: string,
  agentId: string, shipId: string | null,
  agentStats: { level: number; processing: number; mobility: number; power: number; luck: number },
  galacticCost: number, currentEpoch: number,
): Promise<{ digest: string; missionId: string | null }> {
  const tx = new Transaction();

  const shipOpt = shipId !== null
    ? tx.pure(bcs.option(bcs.Address).serialize(shipId))
    : tx.pure(bcs.option(bcs.Address).serialize(null));

  // Get GALACTIC coin for payment
  const signerAddr = ctx.signer.toSuiAddress();
  const coins = await ctx.client.getCoins({
    owner: signerAddr,
    coinType: `${ctx.packageId}::galactic_token::GALACTIC_TOKEN`,
  });

  let payment;
  if (galacticCost > 0 && coins.data.length > 0) {
    const coinId = coins.data[0].coinObjectId;
    [payment] = tx.splitCoins(tx.object(coinId), [galacticCost]);
  } else {
    // Zero-value coin
    [payment] = tx.splitCoins(tx.object(coins.data[0]?.coinObjectId || ''), [0]);
  }

  const seed = Math.floor(Math.random() * 1_000_000);

  const [mission] = tx.moveCall({
    target: `${mod(ctx, 'missions')}::start_mission`,
    arguments: [
      tx.object(registryId),
      tx.object(templateId),
      tx.pure.id(agentId),
      shipOpt,
      tx.pure.u64(agentStats.level),
      tx.pure.u64(agentStats.processing),
      tx.pure.u64(agentStats.mobility),
      tx.pure.u64(agentStats.power),
      tx.pure.u64(agentStats.luck),
      payment,
      tx.pure.u64(currentEpoch),
      tx.pure.u64(seed),
    ],
  });

  // Transfer mission to sender (it has key+store)
  tx.transferObjects([mission], signerAddr);

  const { digest, objectChanges } = await execute(ctx, tx);
  const missionId = findCreatedObject(objectChanges, '::missions::ActiveMission');
  return { digest, missionId };
}

export async function completeMission(
  ctx: ExecContext, registryId: string, templateId: string,
  missionId: string, currentEpoch: number,
): Promise<string> {
  const tx = new Transaction();
  const [rewardCoin, _missionResult] = tx.moveCall({
    target: `${mod(ctx, 'missions')}::complete_mission`,
    arguments: [
      tx.object(registryId),
      tx.object(templateId),
      tx.object(missionId),
      tx.pure.u64(currentEpoch),
    ],
  });

  // Transfer reward coin to sender
  const signerAddr = ctx.signer.toSuiAddress();
  tx.transferObjects([rewardCoin], signerAddr);

  const { digest } = await execute(ctx, tx);
  return digest;
}

// ── Token actions ────────────────────────────────────────────────

export async function mintGalactic(
  ctx: ExecContext, treasuryId: string,
  amount: number, recipient: string,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'galactic_token')}::mint`,
    arguments: [
      tx.object(treasuryId),
      tx.pure.u64(amount),
      tx.pure.address(recipient),
    ],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

// ── DeFi actions ─────────────────────────────────────────────────

export async function createAndShareReactor(
  ctx: ExecContext, adminCapId: string,
): Promise<{ digest: string; reactorId: string | null }> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'defi')}::create_and_share_reactor`,
    arguments: [tx.object(adminCapId)],
  });
  const { digest, objectChanges } = await execute(ctx, tx);
  const reactorId = findCreatedObject(objectChanges, '::defi::EnergyReactor');
  return { digest, reactorId };
}

export async function createAndShareInsurancePool(
  ctx: ExecContext, adminCapId: string,
): Promise<{ digest: string; poolId: string | null }> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'defi')}::create_and_share_insurance_pool`,
    arguments: [tx.object(adminCapId)],
  });
  const { digest, objectChanges } = await execute(ctx, tx);
  const poolId = findCreatedObject(objectChanges, '::defi::InsurancePool');
  return { digest, poolId };
}

export async function addLiquidity(
  ctx: ExecContext, reactorId: string,
  galacticAmount: number, suiAmount: number, currentEpoch: number,
): Promise<{ digest: string; receiptId: string | null }> {
  const tx = new Transaction();
  const signerAddr = ctx.signer.toSuiAddress();

  // Get GALACTIC coin
  const galacticCoins = await ctx.client.getCoins({
    owner: signerAddr,
    coinType: `${ctx.packageId}::galactic_token::GALACTIC_TOKEN`,
  });
  if (galacticCoins.data.length === 0) throw new Error('No GALACTIC coins for liquidity');

  const [galacticCoin] = tx.splitCoins(tx.object(galacticCoins.data[0].coinObjectId), [galacticAmount]);
  const [suiCoin] = tx.splitCoins(tx.gas, [suiAmount]);

  const [receipt] = tx.moveCall({
    target: `${mod(ctx, 'defi')}::add_liquidity`,
    arguments: [
      tx.object(reactorId),
      galacticCoin,
      suiCoin,
      tx.pure.u64(currentEpoch),
    ],
  });

  tx.transferObjects([receipt], signerAddr);

  const { digest, objectChanges } = await execute(ctx, tx);
  const receiptId = findCreatedObject(objectChanges, '::defi::LPReceipt');
  return { digest, receiptId };
}

export async function swapGalacticForSui(
  ctx: ExecContext, reactorId: string,
  galacticAmount: number, minSuiOut: number,
): Promise<string> {
  const tx = new Transaction();
  const signerAddr = ctx.signer.toSuiAddress();

  const galacticCoins = await ctx.client.getCoins({
    owner: signerAddr,
    coinType: `${ctx.packageId}::galactic_token::GALACTIC_TOKEN`,
  });
  if (galacticCoins.data.length === 0) throw new Error('No GALACTIC coins for swap');

  const [galacticCoin] = tx.splitCoins(tx.object(galacticCoins.data[0].coinObjectId), [galacticAmount]);

  const [suiOut] = tx.moveCall({
    target: `${mod(ctx, 'defi')}::swap_galactic_for_sui`,
    arguments: [
      tx.object(reactorId),
      galacticCoin,
      tx.pure.u64(minSuiOut),
    ],
  });

  tx.transferObjects([suiOut], signerAddr);

  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function swapSuiForGalactic(
  ctx: ExecContext, reactorId: string,
  suiAmount: number, minGalacticOut: number,
): Promise<string> {
  const tx = new Transaction();
  const signerAddr = ctx.signer.toSuiAddress();

  const [suiCoin] = tx.splitCoins(tx.gas, [suiAmount]);

  const [galacticOut] = tx.moveCall({
    target: `${mod(ctx, 'defi')}::swap_sui_for_galactic`,
    arguments: [
      tx.object(reactorId),
      suiCoin,
      tx.pure.u64(minGalacticOut),
    ],
  });

  tx.transferObjects([galacticOut], signerAddr);

  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function purchaseInsurance(
  ctx: ExecContext, poolId: string,
  insuredAmount: number, currentEpoch: number,
): Promise<{ digest: string; policyId: string | null }> {
  const tx = new Transaction();
  const signerAddr = ctx.signer.toSuiAddress();

  // Premium is 2% of insured amount (200 bps)
  const premiumAmount = Math.ceil(insuredAmount * 200 / 10000);

  const galacticCoins = await ctx.client.getCoins({
    owner: signerAddr,
    coinType: `${ctx.packageId}::galactic_token::GALACTIC_TOKEN`,
  });
  if (galacticCoins.data.length === 0) throw new Error('No GALACTIC coins for insurance');

  const [premium] = tx.splitCoins(tx.object(galacticCoins.data[0].coinObjectId), [premiumAmount]);

  const [policy] = tx.moveCall({
    target: `${mod(ctx, 'defi')}::purchase_insurance`,
    arguments: [
      tx.object(poolId),
      premium,
      tx.pure.u64(insuredAmount),
      tx.pure.u64(currentEpoch),
    ],
  });

  tx.transferObjects([policy], signerAddr);

  const { digest, objectChanges } = await execute(ctx, tx);
  const policyId = findCreatedObject(objectChanges, '::defi::InsurancePolicy');
  return { digest, policyId };
}

// ── Station actions ──────────────────────────────────────────────

export async function assignOperator(
  ctx: ExecContext, stationId: string, agentId: string,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'station')}::assign_operator`,
    arguments: [tx.object(stationId), tx.pure.id(agentId)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function dockShip(
  ctx: ExecContext, stationId: string, shipId: string,
): Promise<string> {
  const tx = new Transaction();
  // dock_ship on station side
  tx.moveCall({
    target: `${mod(ctx, 'station')}::dock_ship`,
    arguments: [tx.object(stationId), tx.pure.id(shipId)],
  });
  // Also set docked on ship side
  tx.moveCall({
    target: `${mod(ctx, 'ship')}::dock`,
    arguments: [tx.object(shipId), tx.pure.id(stationId)],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

// ── Governance actions ───────────────────────────────────────────

export async function createVotingPower(
  ctx: ExecContext,
  tokenBalance: number, stakedBalance: number,
  totalAgentLevels: number, controlledPlanets: number,
  currentEpoch: number,
): Promise<{ digest: string; votingPowerId: string | null }> {
  const tx = new Transaction();
  const signerAddr = ctx.signer.toSuiAddress();

  const [vp] = tx.moveCall({
    target: `${mod(ctx, 'governance')}::create_voting_power`,
    arguments: [
      tx.pure.u64(tokenBalance),
      tx.pure.u64(stakedBalance),
      tx.pure.u64(totalAgentLevels),
      tx.pure.u64(controlledPlanets),
      tx.pure.u64(currentEpoch),
    ],
  });

  tx.transferObjects([vp], signerAddr);

  const { digest, objectChanges } = await execute(ctx, tx);
  const votingPowerId = findCreatedObject(objectChanges, '::governance::VotingPower');
  return { digest, votingPowerId };
}

export async function createProposal(
  ctx: ExecContext, registryId: string, votingPowerId: string,
  params: {
    title: string; description: string; proposalType: number;
    targetModule: string; targetFunction: string; parameters: number[];
  },
  galacticCost: number, currentEpoch: number,
): Promise<{ digest: string; proposalId: string | null }> {
  const tx = new Transaction();
  const signerAddr = ctx.signer.toSuiAddress();

  // Get GALACTIC coin for proposal deposit
  const galacticCoins = await ctx.client.getCoins({
    owner: signerAddr,
    coinType: `${ctx.packageId}::galactic_token::GALACTIC_TOKEN`,
  });

  let payment;
  if (galacticCost > 0 && galacticCoins.data.length > 0) {
    [payment] = tx.splitCoins(tx.object(galacticCoins.data[0].coinObjectId), [galacticCost]);
  } else if (galacticCoins.data.length > 0) {
    [payment] = tx.splitCoins(tx.object(galacticCoins.data[0].coinObjectId), [0]);
  } else {
    throw new Error('No GALACTIC coins for proposal deposit');
  }

  const [proposal] = tx.moveCall({
    target: `${mod(ctx, 'governance')}::create_proposal`,
    arguments: [
      tx.object(registryId),
      tx.object(votingPowerId),
      tx.pure.string(params.title),
      tx.pure.string(params.description),
      tx.pure.u8(params.proposalType),
      tx.pure.string(params.targetModule),
      tx.pure.string(params.targetFunction),
      tx.pure(bcs.vector(bcs.u64()).serialize(params.parameters)),
      payment,
      tx.pure.u64(currentEpoch),
    ],
  });

  // Proposal has key+store — share it so both agents can vote
  tx.moveCall({
    target: '0x2::transfer::public_share_object',
    typeArguments: [`${ctx.packageId}::governance::Proposal`],
    arguments: [proposal],
  });

  const { digest, objectChanges } = await execute(ctx, tx);
  const proposalId = findCreatedObject(objectChanges, '::governance::Proposal');
  return { digest, proposalId };
}

export async function castVote(
  ctx: ExecContext, proposalId: string, votingPowerId: string,
  support: boolean, currentEpoch: number,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'governance')}::cast_vote`,
    arguments: [
      tx.object(proposalId),
      tx.object(votingPowerId),
      tx.pure.bool(support),
      tx.pure.u64(currentEpoch),
    ],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

// ── Admin governance actions ──────────────────────────────────────

export async function updateGovernanceParameters(
  ctx: ExecContext, adminCapId: string, registryId: string,
  params: { votingPeriod: number; executionDelay: number; proposalThreshold: number; quorumThreshold: number },
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'governance')}::update_parameters`,
    arguments: [
      tx.object(adminCapId),
      tx.object(registryId),
      tx.pure.u64(params.votingPeriod),
      tx.pure.u64(params.executionDelay),
      tx.pure.u64(params.proposalThreshold),
      tx.pure.u64(params.quorumThreshold),
    ],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function finalizeProposal(
  ctx: ExecContext, registryId: string, proposalId: string,
  totalSupply: number, currentEpoch: number,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'governance')}::finalize_proposal`,
    arguments: [
      tx.object(registryId),
      tx.object(proposalId),
      tx.pure.u64(totalSupply),
      tx.pure.u64(currentEpoch),
    ],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}

export async function executeProposal(
  ctx: ExecContext, registryId: string, proposalId: string,
  currentEpoch: number,
): Promise<string> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(ctx, 'governance')}::execute_proposal`,
    arguments: [
      tx.object(registryId),
      tx.object(proposalId),
      tx.pure.u64(currentEpoch),
    ],
  });
  const { digest } = await execute(ctx, tx);
  return digest;
}
