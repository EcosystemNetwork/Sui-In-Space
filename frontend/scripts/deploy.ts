/**
 * Deploy Move contracts to Sui testnet.
 *
 * Usage: pnpm deploy
 *
 * Requires:
 *   - PRIVATE_KEY in ../../.env (bech32 suiprivkey1q...)
 *   - Sui CLI installed (`sui --version`)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// ── Load env ──────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');
const FRONTEND_DIR = resolve(__dirname, '..');
const CONTRACTS_DIR = resolve(ROOT_DIR, 'contracts');
const FRONTEND_ENV = resolve(FRONTEND_DIR, '.env');

dotenv.config({ path: resolve(ROOT_DIR, '.env') });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('ERROR: PRIVATE_KEY not found in ../../.env');
  process.exit(1);
}

// ── Derive address ────────────────────────────────────────────────
const keypair = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
const address = keypair.toSuiAddress();
console.log(`Deployer address: ${address}`);

// ── Verify Sui CLI ────────────────────────────────────────────────
function run(cmd: string, opts?: { cwd?: string }): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: opts?.cwd, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e: any) {
    const stderr = e.stderr?.toString() || '';
    const stdout = e.stdout?.toString() || '';
    throw new Error(`Command failed: ${cmd}\n${stderr}\n${stdout}`);
  }
}

try {
  const version = run('sui --version');
  console.log(`Sui CLI: ${version}`);
} catch {
  console.error('ERROR: Sui CLI not found. Install from https://docs.sui.io/build/install');
  process.exit(1);
}

// ── Switch to testnet ─────────────────────────────────────────────
console.log('\nSwitching to testnet...');
try {
  run('sui client switch --env testnet');
} catch {
  // env might not exist yet — create it
  console.log('Adding testnet environment...');
  run('sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443');
  run('sui client switch --env testnet');
}

// ── Import key ────────────────────────────────────────────────────
console.log('Importing key...');
try {
  run(`sui keytool import "${PRIVATE_KEY}" ed25519`);
  console.log('Key imported.');
} catch (e: any) {
  // "already exists" is fine
  if (e.message.includes('already') || e.message.includes('exists')) {
    console.log('Key already imported.');
  } else {
    console.log('Key import note:', e.message.slice(0, 200));
  }
}

// ── Set active address ────────────────────────────────────────────
try {
  run(`sui client switch --address ${address}`);
} catch {
  console.log(`Could not switch active address to ${address} — continuing anyway.`);
}

// ── Check gas balance ─────────────────────────────────────────────
console.log('\nChecking gas balance...');
try {
  const balanceJson = run(`sui client gas --json`);
  const gasObjects = JSON.parse(balanceJson);
  if (!Array.isArray(gasObjects) || gasObjects.length === 0) {
    console.error(`\nNo gas coins found for ${address}`);
    console.error(`Get testnet SUI from: https://faucet.testnet.sui.io/ or run:`);
    console.error(`  sui client faucet --url https://faucet.testnet.sui.io/v1/gas`);
    process.exit(1);
  }
  const totalBalance = gasObjects.reduce((sum: number, g: any) => {
    const amt = Number(g.mistBalance ?? g.balance ?? 0);
    return sum + amt;
  }, 0);
  console.log(`Gas balance: ${(totalBalance / 1_000_000_000).toFixed(4)} SUI (${gasObjects.length} coin(s))`);

  if (totalBalance < 500_000_000) {
    console.error('\nInsufficient gas — need at least 0.5 SUI for publish.');
    console.error(`Get testnet SUI from: https://faucet.testnet.sui.io/`);
    process.exit(1);
  }
} catch (e: any) {
  console.warn('Could not check gas balance:', e.message.slice(0, 200));
  console.warn('Proceeding with publish anyway...');
}

// ── Publish ───────────────────────────────────────────────────────
console.log('\nPublishing contracts...');
console.log(`Package dir: ${CONTRACTS_DIR}`);

let packageId = '';
let digest = '';
let registryId = '';

// Check if already published (Published.toml exists with testnet entry)
const publishedToml = resolve(CONTRACTS_DIR, 'Published.toml');
let alreadyPublished = false;
if (existsSync(publishedToml)) {
  const tomlContent = readFileSync(publishedToml, 'utf-8');
  const match = tomlContent.match(/original-id\s*=\s*"(0x[0-9a-f]+)"/);
  if (match) {
    alreadyPublished = true;
    packageId = match[1];
    console.log(`Package already published: ${packageId}`);
    console.log('Using existing deployment from Published.toml');
    console.log('(Delete Published.toml to force a fresh publish)');
  }
}

if (!alreadyPublished) {
  let publishOutput: string;
  try {
    publishOutput = run(
      `sui client publish --gas-budget 500000000 --json --skip-dependency-verification`,
      { cwd: CONTRACTS_DIR },
    );
  } catch (e: any) {
    console.error('Publish failed:', e.message);
    process.exit(1);
  }

  // ── Parse result ──────────────────────────────────────────────────
  let result: any;
  try {
    // sui client publish --json may output warnings before the JSON — find the JSON block
    const jsonStart = publishOutput.indexOf('{');
    const jsonStr = publishOutput.slice(jsonStart);
    result = JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse publish output as JSON.');
    console.error('Raw output:', publishOutput.slice(0, 2000));
    process.exit(1);
  }

  if (result.effects?.status?.status !== 'success') {
    console.error('Publish transaction failed:', JSON.stringify(result.effects?.status, null, 2));
    process.exit(1);
  }

  digest = result.digest;
  console.log(`\nTx digest: ${digest}`);

  // Extract packageId
  const publishedChange = result.objectChanges?.find(
    (c: any) => c.type === 'published',
  );
  if (!publishedChange) {
    console.error('Could not find published package in objectChanges');
    console.error('objectChanges:', JSON.stringify(result.objectChanges, null, 2).slice(0, 2000));
    process.exit(1);
  }
  packageId = publishedChange.packageId;
  console.log(`Package ID: ${packageId}`);

  // Extract CodeRegistry from publish result
  const regChange = result.objectChanges?.find(
    (c: any) => c.type === 'created' && c.objectType?.includes('::code_registry::CodeRegistry'),
  );
  registryId = regChange?.objectId || '';
}

// If we don't have registryId yet, search on-chain
if (!registryId) {
  console.log('\nSearching for CodeRegistry object on-chain...');
  try {
    const ownedJson = run(`sui client objects --json`);
    const owned = JSON.parse(ownedJson);
    const reg = (Array.isArray(owned) ? owned : owned.data || []).find(
      (o: any) => {
        const type = o.type || o.data?.type || '';
        return type.includes('::code_registry::CodeRegistry');
      }
    );
    if (reg) {
      registryId = reg.objectId || reg.data?.objectId || '';
    }
  } catch {
    // Not critical
  }
}

if (registryId) {
  console.log(`CodeRegistry ID: ${registryId}`);
} else {
  console.log('CodeRegistry not found (may not exist in this contract version).');
}

// ── Write to frontend/.env ────────────────────────────────────────
let envContent = '';
if (existsSync(FRONTEND_ENV)) {
  envContent = readFileSync(FRONTEND_ENV, 'utf-8');
}

// Replace or append VITE_PACKAGE_ID
if (envContent.includes('VITE_PACKAGE_ID=')) {
  envContent = envContent.replace(/^VITE_PACKAGE_ID=.*/m, `VITE_PACKAGE_ID=${packageId}`);
} else {
  envContent += `\nVITE_PACKAGE_ID=${packageId}`;
}

// Replace or append VITE_CODE_REGISTRY_ID
if (registryId) {
  if (envContent.includes('VITE_CODE_REGISTRY_ID=')) {
    envContent = envContent.replace(/^VITE_CODE_REGISTRY_ID=.*/m, `VITE_CODE_REGISTRY_ID=${registryId}`);
  } else {
    envContent += `\nVITE_CODE_REGISTRY_ID=${registryId}`;
  }
}

writeFileSync(FRONTEND_ENV, envContent.trim() + '\n');
console.log(`\nWritten to ${FRONTEND_ENV}`);

// ── Summary ───────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════');
console.log('  DEPLOYMENT COMPLETE');
console.log('════════════════════════════════════════');
console.log(`  Network:          testnet`);
if (digest) {
  console.log(`  Tx Digest:        ${digest}`);
}
console.log(`  Package ID:       ${packageId}`);
if (registryId) {
  console.log(`  CodeRegistry ID:  ${registryId}`);
}
if (digest) {
  console.log(`  Explorer:         https://suiscan.xyz/testnet/tx/${digest}`);
}
console.log(`  Package:          https://suiscan.xyz/testnet/object/${packageId}`);
console.log('════════════════════════════════════════\n');
