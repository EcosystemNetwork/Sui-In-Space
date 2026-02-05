/**
 * Database Service
 * Provides CRUD operations for all game entities with Supabase
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Database, Player, Agent, Ship, Station, Mission, ActivityLog, UserSettings } from './database.types';

type PlayerInsert = Database['public']['Tables']['players']['Insert'];
type AgentInsert = Database['public']['Tables']['agents']['Insert'];
type ShipInsert = Database['public']['Tables']['ships']['Insert'];
type StationInsert = Database['public']['Tables']['stations']['Insert'];
type MissionInsert = Database['public']['Tables']['missions']['Insert'];
type ActivityLogInsert = Database['public']['Tables']['activity_log']['Insert'];

// ============ Player Operations ============

export async function getPlayerByWallet(walletAddress: string): Promise<Player | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching player:', error);
    }
    return data;
}

export async function createPlayer(walletAddress: string, username?: string): Promise<Player | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('players')
        .insert({
            wallet_address: walletAddress,
            username: username || null,
            galactic_balance: 0,
            sui_balance: 0,
            level: 1,
            experience: 0,
        } as PlayerInsert)
        .select()
        .single();

    if (error) {
        console.error('Error creating player:', error);
        return null;
    }
    return data;
}

export async function updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('players')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', playerId)
        .select()
        .single();

    if (error) {
        console.error('Error updating player:', error);
        return null;
    }
    return data;
}

export async function getOrCreatePlayer(walletAddress: string): Promise<Player | null> {
    let player = await getPlayerByWallet(walletAddress);
    if (!player) {
        player = await createPlayer(walletAddress);
    }
    return player;
}

// ============ Agent Operations ============

export async function getAgentsByPlayer(playerId: string): Promise<Agent[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agents:', error);
        return [];
    }
    return data || [];
}

export async function createAgent(agent: AgentInsert): Promise<Agent | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('agents')
        .insert(agent)
        .select()
        .single();

    if (error) {
        console.error('Error creating agent:', error);
        return null;
    }
    return data;
}

export async function updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('agents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', agentId)
        .select()
        .single();

    if (error) {
        console.error('Error updating agent:', error);
        return null;
    }
    return data;
}

// ============ Ship Operations ============

export async function getShipsByPlayer(playerId: string): Promise<Ship[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('ships')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching ships:', error);
        return [];
    }
    return data || [];
}

export async function createShip(ship: ShipInsert): Promise<Ship | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('ships')
        .insert(ship)
        .select()
        .single();

    if (error) {
        console.error('Error creating ship:', error);
        return null;
    }
    return data;
}

export async function updateShip(shipId: string, updates: Partial<Ship>): Promise<Ship | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('ships')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', shipId)
        .select()
        .single();

    if (error) {
        console.error('Error updating ship:', error);
        return null;
    }
    return data;
}

// ============ Station Operations ============

export async function getStationsByPlayer(playerId: string): Promise<Station[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching stations:', error);
        return [];
    }
    return data || [];
}

export async function createStation(station: StationInsert): Promise<Station | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('stations')
        .insert(station)
        .select()
        .single();

    if (error) {
        console.error('Error creating station:', error);
        return null;
    }
    return data;
}

// ============ Mission Operations ============

export async function getMissionsByPlayer(playerId: string): Promise<Mission[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('player_id', playerId)
        .order('started_at', { ascending: false });

    if (error) {
        console.error('Error fetching missions:', error);
        return [];
    }
    return data || [];
}

export async function createMission(mission: MissionInsert): Promise<Mission | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('missions')
        .insert(mission)
        .select()
        .single();

    if (error) {
        console.error('Error creating mission:', error);
        return null;
    }
    return data;
}

export async function completeMission(
    missionId: string,
    success: boolean,
    reward: number
): Promise<Mission | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('missions')
        .update({
            status: success ? 1 : 2, // 1 = Completed, 2 = Failed
            completed_at: new Date().toISOString(),
            success,
            reward,
        })
        .eq('id', missionId)
        .select()
        .single();

    if (error) {
        console.error('Error completing mission:', error);
        return null;
    }
    return data;
}

// ============ Activity Log Operations ============

export async function logActivity(activity: ActivityLogInsert): Promise<ActivityLog | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('activity_log')
        .insert(activity)
        .select()
        .single();

    if (error) {
        console.error('Error logging activity:', error);
        return null;
    }
    return data;
}

export async function getActivityLog(playerId: string, limit = 50): Promise<ActivityLog[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching activity log:', error);
        return [];
    }
    return data || [];
}

// ============ User Settings Operations ============

export async function getUserSettings(playerId: string): Promise<UserSettings | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('player_id', playerId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user settings:', error);
    }
    return data;
}

export async function updateUserSettings(
    playerId: string,
    settings: Partial<UserSettings>
): Promise<UserSettings | null> {
    if (!isSupabaseConfigured()) return null;

    // Try to update first
    const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('player_id', playerId)
        .single();

    if (existingSettings) {
        const { data, error } = await supabase
            .from('user_settings')
            .update({ ...settings, updated_at: new Date().toISOString() })
            .eq('player_id', playerId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user settings:', error);
            return null;
        }
        return data;
    } else {
        // Create new settings
        const { data, error } = await supabase
            .from('user_settings')
            .insert({
                player_id: playerId,
                theme: 'dark',
                sound_enabled: true,
                notifications_enabled: true,
                language: 'en',
                ...settings,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user settings:', error);
            return null;
        }
        return data;
    }
}

// ============ Full Player Data Loading ============

export interface FullPlayerData {
    player: Player;
    agents: Agent[];
    ships: Ship[];
    stations: Station[];
    missions: Mission[];
    settings: UserSettings | null;
}

export async function loadFullPlayerData(walletAddress: string): Promise<FullPlayerData | null> {
    if (!isSupabaseConfigured()) return null;

    const player = await getOrCreatePlayer(walletAddress);
    if (!player) return null;

    const [agents, ships, stations, missions, settings] = await Promise.all([
        getAgentsByPlayer(player.id),
        getShipsByPlayer(player.id),
        getStationsByPlayer(player.id),
        getMissionsByPlayer(player.id),
        getUserSettings(player.id),
    ]);

    return {
        player,
        agents,
        ships,
        stations,
        missions,
        settings,
    };
}
