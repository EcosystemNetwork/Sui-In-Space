/**
 * Compute Merkle tree for game-rules config files.
 * Hashes each JSON file, builds a binary Merkle tree, outputs manifest.json.
 *
 * Usage: npx tsx scripts/compute-merkle.ts
 */

import { createHash } from 'crypto';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const RULES_DIR = resolve(__dirname, '../public/game-rules');
const MANIFEST_PATH = join(RULES_DIR, 'manifest.json');

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function combinedHash(left: string, right: string): string {
  // Sort to make tree order-independent for a pair
  const sorted = [left, right].sort();
  return sha256(sorted[0] + sorted[1]);
}

function buildMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return sha256('');
  if (hashes.length === 1) return hashes[0];

  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    if (i + 1 < hashes.length) {
      nextLevel.push(combinedHash(hashes[i], hashes[i + 1]));
    } else {
      // Odd leaf — promote
      nextLevel.push(hashes[i]);
    }
  }
  return buildMerkleRoot(nextLevel);
}

function main() {
  // Read all .json files in game-rules (excluding manifest.json itself)
  const files = readdirSync(RULES_DIR)
    .filter(f => f.endsWith('.json') && f !== 'manifest.json')
    .sort(); // Sort by filename for determinism

  if (files.length === 0) {
    console.error('No game-rules JSON files found.');
    process.exit(1);
  }

  const fileHashes: Record<string, string> = {};
  const leafHashes: string[] = [];

  for (const file of files) {
    const content = readFileSync(join(RULES_DIR, file));
    const hash = sha256(content);
    fileHashes[file] = hash;
    leafHashes.push(hash);
    console.log(`  ${file}: ${hash}`);
  }

  const root = buildMerkleRoot(leafHashes);

  // Read existing manifest to get version
  let version = 1;
  try {
    const existing = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    version = (existing.version || 0) + 1;
  } catch {
    // First time — version 1
  }

  const manifest = {
    root,
    version,
    files: fileHashes,
    timestamp: Math.floor(Date.now() / 1000),
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nMerkle root: ${root}`);
  console.log(`Version: ${version}`);
  console.log(`Manifest written to: ${MANIFEST_PATH}`);
}

main();
