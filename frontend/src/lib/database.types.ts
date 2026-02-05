/**
 * Supabase Database Types
 * Auto-generated types for database tables
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            players: {
                Row: {
                    id: string;
                    wallet_address: string;
                    username: string | null;
                    galactic_balance: number;
                    sui_balance: number;
                    level: number;
                    experience: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    wallet_address: string;
                    username?: string | null;
                    galactic_balance?: number;
                    sui_balance?: number;
                    level?: number;
                    experience?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    wallet_address?: string;
                    username?: string | null;
                    galactic_balance?: number;
                    sui_balance?: number;
                    level?: number;
                    experience?: number;
                    updated_at?: string;
                };
            };
            agents: {
                Row: {
                    id: string;
                    player_id: string;
                    name: string;
                    agent_type: number;
                    agent_class: number;
                    level: number;
                    experience: number;
                    stats: Json;
                    is_staked: boolean;
                    missions_completed: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    player_id: string;
                    name: string;
                    agent_type: number;
                    agent_class: number;
                    level?: number;
                    experience?: number;
                    stats?: Json;
                    is_staked?: boolean;
                    missions_completed?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    name?: string;
                    agent_type?: number;
                    agent_class?: number;
                    level?: number;
                    experience?: number;
                    stats?: Json;
                    is_staked?: boolean;
                    missions_completed?: number;
                    updated_at?: string;
                };
            };
            ships: {
                Row: {
                    id: string;
                    player_id: string;
                    name: string;
                    ship_class: number;
                    max_health: number;
                    current_health: number;
                    speed: number;
                    firepower: number;
                    fuel: number;
                    max_fuel: number;
                    is_docked: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    player_id: string;
                    name: string;
                    ship_class: number;
                    max_health?: number;
                    current_health?: number;
                    speed?: number;
                    firepower?: number;
                    fuel?: number;
                    max_fuel?: number;
                    is_docked?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    name?: string;
                    ship_class?: number;
                    max_health?: number;
                    current_health?: number;
                    speed?: number;
                    firepower?: number;
                    fuel?: number;
                    max_fuel?: number;
                    is_docked?: boolean;
                    updated_at?: string;
                };
            };
            stations: {
                Row: {
                    id: string;
                    player_id: string;
                    name: string;
                    station_type: number;
                    level: number;
                    total_staked: number;
                    yield_rate: number;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    player_id: string;
                    name: string;
                    station_type: number;
                    level?: number;
                    total_staked?: number;
                    yield_rate?: number;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    name?: string;
                    station_type?: number;
                    level?: number;
                    total_staked?: number;
                    yield_rate?: number;
                    is_active?: boolean;
                    updated_at?: string;
                };
            };
            missions: {
                Row: {
                    id: string;
                    player_id: string;
                    template_id: string;
                    agent_id: string;
                    ship_id: string | null;
                    status: number;
                    started_at: string;
                    completed_at: string | null;
                    reward: number | null;
                    success: boolean | null;
                };
                Insert: {
                    id?: string;
                    player_id: string;
                    template_id: string;
                    agent_id: string;
                    ship_id?: string | null;
                    status?: number;
                    started_at?: string;
                    completed_at?: string | null;
                    reward?: number | null;
                    success?: boolean | null;
                };
                Update: {
                    status?: number;
                    completed_at?: string | null;
                    reward?: number | null;
                    success?: boolean | null;
                };
            };
            activity_log: {
                Row: {
                    id: string;
                    player_id: string;
                    event_type: string;
                    description: string;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    player_id: string;
                    event_type: string;
                    description: string;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: never;
            };
            user_settings: {
                Row: {
                    id: string;
                    player_id: string;
                    theme: string;
                    sound_enabled: boolean;
                    notifications_enabled: boolean;
                    language: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    player_id: string;
                    theme?: string;
                    sound_enabled?: boolean;
                    notifications_enabled?: boolean;
                    language?: string;
                    updated_at?: string;
                };
                Update: {
                    theme?: string;
                    sound_enabled?: boolean;
                    notifications_enabled?: boolean;
                    language?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {};
        Functions: {};
        Enums: {};
    };
}

export type Player = Database['public']['Tables']['players']['Row'];
export type Agent = Database['public']['Tables']['agents']['Row'];
export type Ship = Database['public']['Tables']['ships']['Row'];
export type Station = Database['public']['Tables']['stations']['Row'];
export type Mission = Database['public']['Tables']['missions']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
