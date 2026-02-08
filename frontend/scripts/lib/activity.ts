/**
 * Activity log — writes agent decisions to public/agent-activity.json
 * so the frontend can display them in real time.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ActivityEntry } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ACTIVITY_FILE = resolve(__dirname, '../../public/agent-activity.json');
const MAX_ENTRIES = 200;

export function loadActivityLog(): ActivityEntry[] {
  if (!existsSync(ACTIVITY_FILE)) return [];
  try {
    return JSON.parse(readFileSync(ACTIVITY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function logActivity(entry: ActivityEntry): void {
  const log = loadActivityLog();
  log.unshift(entry); // newest first
  // Cap at MAX_ENTRIES
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  writeFileSync(ACTIVITY_FILE, JSON.stringify(log, null, 2));
}

export function createActivityEntry(
  agent: string,
  phase: ActivityEntry['phase'],
  action: string,
  description: string,
  reasoning: string,
  txDigest: string | null,
  success: boolean,
  details?: Record<string, unknown>,
): ActivityEntry {
  return {
    timestamp: new Date().toISOString(),
    agent,
    phase,
    action,
    description,
    reasoning,
    txDigest,
    success,
    details,
  };
}
