/**
 * usePlayerData Hook
 * Handles loading and syncing player data from Supabase when wallet is connected
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useGameStore } from './useGameStore';
import { loadFullPlayerData, logActivity } from '../lib/database';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Agent, Ship, Station, ActiveMission } from '../types';
import { AgentType, AgentClass, ShipClass, StationType, MissionStatus } from '../types';

// ============ Demo seed data for local-only mode ============

const SEED_AGENTS: Agent[] = [
  {
    id: 'seed-agent-1',
    name: 'Nova-7',
    agentType: AgentType.Cyborg,
    class: AgentClass.Hacker,
    stats: { processing: 48, mobility: 35, power: 22, resilience: 30, luck: 15, neuralBandwidth: 55 },
    level: 15,
    experience: 12450,
    firmwareVersion: 2,
    aiModelLineage: 'Prometheus-V3',
    augmentSlots: ['0xaug1', '0xaug2'],
    maxAugmentSlots: 3,
    missionsCompleted: 47,
    battlesWon: 12,
    totalEarnings: BigInt(125000000000000),
    isStaked: false,
    stakedAt: null,
    currentMission: null,
  },
  {
    id: 'seed-agent-2',
    name: 'Vex-Prime',
    agentType: AgentType.Android,
    class: AgentClass.Pilot,
    stats: { processing: 30, mobility: 72, power: 35, resilience: 28, luck: 20, neuralBandwidth: 40 },
    level: 22,
    experience: 45800,
    firmwareVersion: 3,
    aiModelLineage: 'Zenith-X2',
    augmentSlots: ['0xaug3'],
    maxAugmentSlots: 4,
    missionsCompleted: 89,
    battlesWon: 34,
    totalEarnings: BigInt(350000000000000),
    isStaked: true,
    stakedAt: '0xstation1',
    currentMission: null,
  },
  {
    id: 'seed-agent-3',
    name: 'Titan-9',
    agentType: AgentType.Cyborg,
    class: AgentClass.MechOperator,
    stats: { processing: 22, mobility: 25, power: 75, resilience: 60, luck: 10, neuralBandwidth: 25 },
    level: 18,
    experience: 28000,
    firmwareVersion: 2,
    aiModelLineage: 'Atlas-M4',
    augmentSlots: [],
    maxAugmentSlots: 3,
    missionsCompleted: 62,
    battlesWon: 28,
    totalEarnings: BigInt(180000000000000),
    isStaked: false,
    stakedAt: null,
    currentMission: 'seed-mission-1',
  },
  {
    id: 'seed-agent-4',
    name: 'Echo-∞',
    agentType: AgentType.AlienSynthetic,
    class: AgentClass.Psionic,
    stats: { processing: 40, mobility: 35, power: 20, resilience: 25, luck: 35, neuralBandwidth: 80 },
    level: 25,
    experience: 68000,
    firmwareVersion: 4,
    aiModelLineage: 'Unknown Origin',
    augmentSlots: ['0xaug4', '0xaug5', '0xaug6'],
    maxAugmentSlots: 5,
    missionsCompleted: 102,
    battlesWon: 45,
    totalEarnings: BigInt(520000000000000),
    isStaked: false,
    stakedAt: null,
    currentMission: null,
  },
];

const SEED_SHIPS: Ship[] = [
  {
    id: 'seed-ship-1',
    name: 'Shadow Runner',
    shipClass: ShipClass.Cruiser,
    modules: { hull: '0xhull1', engine: '0xengine1', aiCore: null, weapon: '0xweapon1', utility: null },
    maxHealth: 350,
    currentHealth: 280,
    speed: 60,
    firepower: 45,
    cargoCapacity: 150,
    fuelEfficiency: 120,
    pilot: '0xpilot1',
    crew: ['0xcrew1', '0xcrew2'],
    maxCrew: 5,
    isDocked: false,
    dockedAt: null,
    inCombat: false,
    fuel: 85,
    maxFuel: 150,
  },
  {
    id: 'seed-ship-2',
    name: 'Stellar Phoenix',
    shipClass: ShipClass.Fighter,
    modules: { hull: '0xhull2', engine: '0xengine2', aiCore: '0xai1', weapon: '0xweapon2', utility: null },
    maxHealth: 180,
    currentHealth: 180,
    speed: 95,
    firepower: 65,
    cargoCapacity: 30,
    fuelEfficiency: 85,
    pilot: '0xpilot2',
    crew: [],
    maxCrew: 2,
    isDocked: true,
    dockedAt: '0xstation1',
    inCombat: false,
    fuel: 120,
    maxFuel: 120,
  },
  {
    id: 'seed-ship-3',
    name: 'Cargo Whale',
    shipClass: ShipClass.Freighter,
    modules: { hull: '0xhull3', engine: '0xengine3', aiCore: null, weapon: null, utility: '0xutil1' },
    maxHealth: 500,
    currentHealth: 450,
    speed: 35,
    firepower: 10,
    cargoCapacity: 500,
    fuelEfficiency: 60,
    pilot: null,
    crew: [],
    maxCrew: 8,
    isDocked: true,
    dockedAt: '0xstation2',
    inCombat: false,
    fuel: 200,
    maxFuel: 300,
  },
];

const SEED_STATIONS: Station[] = [
  {
    id: 'seed-station-1',
    name: 'Alpha Yield Farm',
    stationType: StationType.YieldFarm,
    planetId: null,
    coordinates: { galaxy: 0, system: 0, x: 0, y: 0, z: 0 },
    totalStaked: 2500000n,
    yieldRate: 245,
    lastYieldTime: 0,
    accumulatedYield: 0n,
    operators: [],
    maxOperators: 5,
    dockedShips: [],
    maxDocked: 10,
    level: 5,
    experience: 0,
    efficiency: 115,
    owner: '',
    factionId: null,
    isActive: true,
    underMaintenance: false,
  },
  {
    id: 'seed-station-2',
    name: 'Quantum Research Lab',
    stationType: StationType.ResearchLab,
    planetId: null,
    coordinates: { galaxy: 0, system: 0, x: 0, y: 0, z: 0 },
    totalStaked: 1200000n,
    yieldRate: 182,
    lastYieldTime: 0,
    accumulatedYield: 0n,
    operators: [],
    maxOperators: 4,
    dockedShips: [],
    maxDocked: 10,
    level: 3,
    experience: 0,
    efficiency: 95,
    owner: '',
    factionId: null,
    isActive: true,
    underMaintenance: false,
  },
];

const SEED_ACTIVE_MISSIONS: ActiveMission[] = [
  {
    id: 'seed-mission-1',
    templateId: '1',
    player: '',
    agentId: 'seed-agent-3',
    shipId: null,
    startedAt: Date.now() - 2 * 60 * 60 * 1000,
    endsAt: Date.now() + 2 * 60 * 60 * 1000,
    status: MissionStatus.Active,
  },
];

export function usePlayerData() {
    const auth = useAuth();
    const { setPlayer, setLoading, setError } = useGameStore();

    // Load player data when wallet connects
    const loadPlayerData = useCallback(async () => {
        if (!auth.address) {
            setPlayer(null);
            return;
        }

        if (!isSupabaseConfigured()) {
            console.log('Supabase not configured, using local state with seed data');
            // Set a player state with seed data for a functional experience
            setPlayer({
                address: auth.address!,
                galacticBalance: 125000n,
                suiBalance: 50n,
                agents: SEED_AGENTS,
                ships: SEED_SHIPS,
                planets: [],
                stations: SEED_STATIONS,
                activeMissions: SEED_ACTIVE_MISSIONS.map((m) => ({ ...m, player: auth.address! })),
                stakeReceipts: [],
                votingPower: null,
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await loadFullPlayerData(auth.address!);

            if (data) {
                // Convert database format to game store format
                const agents: Agent[] = data.agents.map((a) => ({
                    id: a.id,
                    name: a.name,
                    agentType: a.agent_type,
                    class: a.agent_class,
                    stats: a.stats as unknown as Agent['stats'],
                    level: a.level,
                    experience: a.experience,
                    firmwareVersion: 1,
                    aiModelLineage: 'Genesis',
                    augmentSlots: [],
                    maxAugmentSlots: 3,
                    missionsCompleted: a.missions_completed,
                    battlesWon: 0,
                    totalEarnings: 0n,
                    isStaked: a.is_staked,
                    stakedAt: null,
                    currentMission: null,
                }));

                const ships: Ship[] = data.ships.map((s) => ({
                    id: s.id,
                    name: s.name,
                    shipClass: s.ship_class,
                    modules: {
                        hull: null,
                        engine: null,
                        aiCore: null,
                        weapon: null,
                        utility: null,
                    },
                    maxHealth: s.max_health,
                    currentHealth: s.current_health,
                    speed: s.speed,
                    firepower: s.firepower,
                    cargoCapacity: 100,
                    fuelEfficiency: 1,
                    pilot: null,
                    crew: [],
                    maxCrew: 4,
                    isDocked: s.is_docked,
                    dockedAt: null,
                    inCombat: false,
                    fuel: s.fuel,
                    maxFuel: s.max_fuel,
                }));

                const stations: Station[] = data.stations.map((st) => ({
                    id: st.id,
                    name: st.name,
                    stationType: st.station_type,
                    planetId: null,
                    coordinates: { galaxy: 0, system: 0, x: 0, y: 0, z: 0 },
                    totalStaked: BigInt(st.total_staked),
                    yieldRate: st.yield_rate,
                    lastYieldTime: 0,
                    accumulatedYield: 0n,
                    operators: [],
                    maxOperators: 5,
                    dockedShips: [],
                    maxDocked: 10,
                    level: st.level,
                    experience: 0,
                    efficiency: 1,
                    owner: auth.address!,
                    factionId: null,
                    isActive: st.is_active,
                    underMaintenance: false,
                }));

                const activeMissions: ActiveMission[] = data.missions
                    .filter((m) => m.status === 0)
                    .map((m) => ({
                        id: m.id,
                        templateId: m.template_id,
                        player: auth.address!,
                        agentId: m.agent_id,
                        shipId: m.ship_id,
                        startedAt: new Date(m.started_at).getTime(),
                        endsAt: 0,
                        status: m.status,
                    }));

                setPlayer({
                    address: auth.address!,
                    dbId: data.player.id,
                    galacticBalance: BigInt(data.player.galactic_balance),
                    suiBalance: BigInt(data.player.sui_balance),
                    agents,
                    ships,
                    planets: [],
                    stations,
                    activeMissions,
                    stakeReceipts: [],
                    votingPower: null,
                });

                // Log the login activity
                await logActivity({
                    player_id: data.player.id,
                    event_type: 'login',
                    description: 'Player connected wallet',
                    metadata: { wallet: auth.address! },
                });
            }
        } catch (error) {
            console.error('Error loading player data:', error);
            setError('Failed to load player data');
        } finally {
            setLoading(false);
        }
    }, [auth.address, auth.isConnected, setPlayer, setLoading, setError]);

    // Load data when wallet connects
    useEffect(() => {
        loadPlayerData();
    }, [loadPlayerData]);

    return {
        isConnected: auth.isConnected,
        address: auth.address || null,
        reload: loadPlayerData,
    };
}

export default usePlayerData;
