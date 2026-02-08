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
            console.log('Supabase not configured, using local state only');
            // Set a basic player state without persistence
            setPlayer({
                address: auth.address!,
                galacticBalance: 0n,
                suiBalance: 0n,
                agents: [],
                ships: [],
                planets: [],
                stations: [],
                activeMissions: [],
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
