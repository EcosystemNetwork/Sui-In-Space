/**
 * Utility functions for Sui-In-Space
 */

/**
 * Format a bigint balance with decimals
 */
export function formatBalance(balance: bigint, decimals: number = 9): string {
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fractionStr}`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompact(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Calculate time remaining until epoch
 */
export function getTimeRemaining(targetEpoch: number, currentEpoch: number, epochDurationMs: number = 3600000): {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const epochsRemaining = targetEpoch - currentEpoch;
  const msRemaining = epochsRemaining * epochDurationMs;
  
  return {
    hours: Math.floor(msRemaining / 3600000),
    minutes: Math.floor((msRemaining % 3600000) / 60000),
    seconds: Math.floor((msRemaining % 60000) / 1000),
    total: msRemaining,
  };
}

/**
 * Calculate APY from basis points
 */
export function bpsToApy(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: number): string {
  const colors = {
    0: 'text-slate-400',    // Common
    1: 'text-green-400',    // Uncommon
    2: 'text-blue-400',     // Rare
    3: 'text-purple-400',   // Epic
    4: 'text-orange-400',   // Legendary
  };
  return colors[rarity as keyof typeof colors] || colors[0];
}

/**
 * Get difficulty stars display
 */
export function getDifficultyStars(difficulty: number): string {
  return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
}

/**
 * Calculate success chance percentage
 */
export function calculateSuccessChance(
  agentLevel: number,
  minLevel: number,
  agentProcessing: number,
  minProcessing: number,
  agentMobility: number,
  minMobility: number,
  agentPower: number,
  minPower: number,
  agentLuck: number,
  difficulty: number
): number {
  let baseChance = 70;

  // Level bonus
  if (agentLevel > minLevel) {
    baseChance += (agentLevel - minLevel) * 2;
  }

  // Stat bonuses
  if (agentProcessing > minProcessing) {
    baseChance += Math.floor((agentProcessing - minProcessing) / 2);
  }
  if (agentMobility > minMobility) {
    baseChance += Math.floor((agentMobility - minMobility) / 2);
  }
  if (agentPower > minPower) {
    baseChance += Math.floor((agentPower - minPower) / 2);
  }

  // Luck bonus
  baseChance += Math.floor(agentLuck / 5);

  // Difficulty penalty
  const difficultyPenalty = (difficulty - 1) * 10;
  baseChance = Math.max(10, baseChance - difficultyPenalty);

  // Cap at 95%
  return Math.min(95, baseChance);
}

/**
 * Generate pseudo-random number from seed
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get planet type name
 */
export function getPlanetTypeName(type: number): string {
  const names = ['Terran', 'Gas Giant', 'Ice World', 'Desert', 'Ocean', 'Volcanic', 'Artificial'];
  return names[type] || 'Unknown';
}

/**
 * Get resource type name
 */
export function getResourceTypeName(type: number): string {
  const names = ['Energy', 'Metal', 'Bio-matter', 'Fuel', 'Quantum', 'Dark Matter', 'Psionic', 'Relics'];
  return names[type] || 'Unknown';
}

/**
 * Get station type name
 */
export function getStationTypeName(type: number): string {
  const names = ['Yield Farm', 'Research Lab', 'Black Market', 'Warp Gate', 'Defense Platform'];
  return names[type] || 'Unknown';
}

/**
 * Format epoch as human-readable time
 */
export function formatEpoch(epoch: number): string {
  // Assuming each epoch is approximately 1 hour
  const date = new Date(epoch * 3600000);
  return date.toLocaleString();
}
