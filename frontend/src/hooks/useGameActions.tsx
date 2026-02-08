/**
 * useGameActions Hook
 * Provides real action handlers that persist to the database, update the game store,
 * and show toast-style notifications.
 *
 * Replaces the former useMockActions hook with real persistence logic.
 */

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useGameStore } from './useGameStore';
import {
  createAgent as dbCreateAgent,
  updateAgent as dbUpdateAgent,
  createShip as dbCreateShip,
  updateShip as dbUpdateShip,
  createMission as dbCreateMission,
  completeMission as dbCompleteMission,
  logActivity,
} from '../lib/database';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Agent, Ship, ActiveMission } from '../types';
import { AgentType, AgentClass, ShipClass, MissionStatus } from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface GameActionsContextType {
  toasts: Toast[];
  dismissToast: (id: string) => void;

  // Agent Actions
  mintAgent: (name?: string) => Promise<void>;
  trainAgent: (agentId: string) => Promise<void>;
  stakeAgent: (agentId: string) => Promise<void>;
  unstakeAgent: (agentId: string) => Promise<void>;

  // Ship Actions
  buildShip: (shipClass: string) => Promise<void>;
  repairShip: (shipId: string) => Promise<void>;
  refuelShip: (shipId: string) => Promise<void>;
  deployShip: (shipId: string) => Promise<void>;
  recallShip: (shipId: string) => Promise<void>;

  // Mission Actions
  startMission: (missionId: string) => Promise<void>;
  abortMission: (missionId: string) => Promise<void>;
  claimRewards: (missionId?: string) => Promise<void>;

  // DeFi Actions
  swap: (fromToken: string, toToken: string, amount: number) => void;
  addLiquidity: (amount: number) => void;
  removeLiquidity: (amount: number) => void;
  stake: (amount: number) => void;
  unstake: (amount: number) => void;
  claimYield: () => void;

  // Governance Actions
  vote: (proposalId: string, support: boolean) => void;
  createProposal: (title: string) => void;

  // Map Actions
  travelTo: (destination: string) => void;
  explore: (locationId: string) => void;
  dock: (stationId: string) => void;
}

const GameActionsContext = createContext<GameActionsContextType | null>(null);

// ============ Helpers ============

const SHIP_CLASS_MAP: Record<string, ShipClass> = {
  Scout: ShipClass.Scout,
  Fighter: ShipClass.Fighter,
  Freighter: ShipClass.Freighter,
  Cruiser: ShipClass.Cruiser,
  Battleship: ShipClass.Battleship,
  Carrier: ShipClass.Carrier,
  Dreadnought: ShipClass.Dreadnought,
};

const SHIP_CLASS_DEFAULTS: Record<ShipClass, { maxHealth: number; speed: number; firepower: number; cargoCapacity: number; maxFuel: number; maxCrew: number }> = {
  [ShipClass.Scout]: { maxHealth: 100, speed: 90, firepower: 15, cargoCapacity: 30, maxFuel: 80, maxCrew: 2 },
  [ShipClass.Fighter]: { maxHealth: 180, speed: 85, firepower: 65, cargoCapacity: 30, maxFuel: 120, maxCrew: 2 },
  [ShipClass.Freighter]: { maxHealth: 400, speed: 35, firepower: 10, cargoCapacity: 500, maxFuel: 300, maxCrew: 8 },
  [ShipClass.Cruiser]: { maxHealth: 350, speed: 60, firepower: 45, cargoCapacity: 150, maxFuel: 150, maxCrew: 5 },
  [ShipClass.Battleship]: { maxHealth: 600, speed: 40, firepower: 80, cargoCapacity: 200, maxFuel: 200, maxCrew: 10 },
  [ShipClass.Carrier]: { maxHealth: 800, speed: 30, firepower: 30, cargoCapacity: 400, maxFuel: 250, maxCrew: 15 },
  [ShipClass.Dreadnought]: { maxHealth: 1200, speed: 20, firepower: 120, cargoCapacity: 300, maxFuel: 400, maxCrew: 20 },
};

function randomStats(): Agent['stats'] {
  return {
    processing: 10 + Math.floor(Math.random() * 20),
    mobility: 10 + Math.floor(Math.random() * 20),
    power: 10 + Math.floor(Math.random() * 20),
    resilience: 10 + Math.floor(Math.random() * 20),
    luck: 5 + Math.floor(Math.random() * 15),
    neuralBandwidth: 20 + Math.floor(Math.random() * 30),
  };
}

export function GameActionsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const player = useGameStore((s) => s.player);
  const addAgentToStore = useGameStore((s) => s.addAgent);
  const updateAgentInStore = useGameStore((s) => s.updateAgent);
  const addShipToStore = useGameStore((s) => s.addShip);
  const updateShipInStore = useGameStore((s) => s.updateShip);
  const addActiveMissionToStore = useGameStore((s) => s.addActiveMission);
  const removeActiveMissionFromStore = useGameStore((s) => s.removeActiveMission);

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ============ Agent Actions ============

  const mintAgent = useCallback(async (name?: string) => {
    const agentName = name || `Agent-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const stats = randomStats();
    const agentClass = Math.floor(Math.random() * 6) as AgentClass;
    const agentType = Math.floor(Math.random() * 4) as AgentType;

    const newAgent: Agent = {
      id: crypto.randomUUID(),
      name: agentName,
      agentType,
      class: agentClass,
      stats,
      level: 1,
      experience: 0,
      firmwareVersion: 1,
      aiModelLineage: 'Genesis',
      augmentSlots: [],
      maxAugmentSlots: 3,
      missionsCompleted: 0,
      battlesWon: 0,
      totalEarnings: 0n,
      isStaked: false,
      stakedAt: null,
      currentMission: null,
    };

    // Persist to database
    if (isSupabaseConfigured() && player?.dbId) {
      const dbAgent = await dbCreateAgent({
        player_id: player.dbId,
        name: agentName,
        agent_type: agentType,
        agent_class: agentClass,
        level: 1,
        experience: 0,
        stats: stats as unknown as Record<string, number>,
        is_staked: false,
        missions_completed: 0,
      });
      if (dbAgent) {
        newAgent.id = dbAgent.id;
      }
      await logActivity({
        player_id: player.dbId,
        event_type: 'agent_minted',
        description: `Minted agent "${agentName}"`,
        metadata: { agentId: newAgent.id, agentType, agentClass },
      });
    }

    // Update store
    addAgentToStore(newAgent);

    addToast('success', 'Agent Minted! 🤖', `${agentName} has joined your crew.`);
  }, [addToast, player, addAgentToStore]);

  const trainAgent = useCallback(async (agentId: string) => {
    const agent = player?.agents.find((a) => a.id === agentId);
    if (!agent) {
      addToast('error', 'Error', 'Agent not found.');
      return;
    }

    const xpGain = 50;
    const updatedAgent: Agent = {
      ...agent,
      experience: agent.experience + xpGain,
    };

    // Level up if enough XP (simple threshold: level * 1000)
    if (updatedAgent.experience >= updatedAgent.level * 1000) {
      updatedAgent.level += 1;
      updatedAgent.experience = updatedAgent.experience - (updatedAgent.level - 1) * 1000;
    }

    // Persist to database
    if (isSupabaseConfigured() && player?.dbId) {
      await dbUpdateAgent(agentId, {
        experience: updatedAgent.experience,
        level: updatedAgent.level,
      });
      await logActivity({
        player_id: player.dbId,
        event_type: 'agent_trained',
        description: `Trained agent "${agent.name}" (+${xpGain} XP)`,
        metadata: { agentId, xpGain },
      });
    }

    updateAgentInStore(updatedAgent);
    addToast('info', 'Training Started 📚', `Agent is now training. +${xpGain} XP earned.`);
  }, [addToast, player, updateAgentInStore]);

  const stakeAgent = useCallback(async (agentId: string) => {
    const agent = player?.agents.find((a) => a.id === agentId);
    if (!agent) {
      addToast('error', 'Error', 'Agent not found.');
      return;
    }

    const updatedAgent: Agent = { ...agent, isStaked: true };

    if (isSupabaseConfigured() && player?.dbId) {
      await dbUpdateAgent(agentId, { is_staked: true });
      await logActivity({
        player_id: player.dbId,
        event_type: 'agent_staked',
        description: `Staked agent "${agent.name}"`,
        metadata: { agentId },
      });
    }

    updateAgentInStore(updatedAgent);
    addToast('success', 'Agent Staked ⛓️', `Agent is now staked and earning yield.`);
  }, [addToast, player, updateAgentInStore]);

  const unstakeAgent = useCallback(async (agentId: string) => {
    const agent = player?.agents.find((a) => a.id === agentId);
    if (!agent) {
      addToast('error', 'Error', 'Agent not found.');
      return;
    }

    const updatedAgent: Agent = { ...agent, isStaked: false, stakedAt: null };

    if (isSupabaseConfigured() && player?.dbId) {
      await dbUpdateAgent(agentId, { is_staked: false });
      await logActivity({
        player_id: player.dbId,
        event_type: 'agent_unstaked',
        description: `Unstaked agent "${agent.name}"`,
        metadata: { agentId },
      });
    }

    updateAgentInStore(updatedAgent);
    addToast('info', 'Agent Unstaked', `Agent has been unstaked and is available.`);
  }, [addToast, player, updateAgentInStore]);

  // ============ Ship Actions ============

  const buildShip = useCallback(async (shipClassName: string) => {
    const shipClass = SHIP_CLASS_MAP[shipClassName] ?? ShipClass.Scout;
    const defaults = SHIP_CLASS_DEFAULTS[shipClass];
    const shipName = `${shipClassName}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const newShip: Ship = {
      id: crypto.randomUUID(),
      name: shipName,
      shipClass,
      modules: { hull: null, engine: null, aiCore: null, weapon: null, utility: null },
      maxHealth: defaults.maxHealth,
      currentHealth: defaults.maxHealth,
      speed: defaults.speed,
      firepower: defaults.firepower,
      cargoCapacity: defaults.cargoCapacity,
      fuelEfficiency: 1,
      pilot: null,
      crew: [],
      maxCrew: defaults.maxCrew,
      isDocked: true,
      dockedAt: null,
      inCombat: false,
      fuel: defaults.maxFuel,
      maxFuel: defaults.maxFuel,
    };

    if (isSupabaseConfigured() && player?.dbId) {
      const dbShip = await dbCreateShip({
        player_id: player.dbId,
        name: shipName,
        ship_class: shipClass,
        max_health: defaults.maxHealth,
        current_health: defaults.maxHealth,
        speed: defaults.speed,
        firepower: defaults.firepower,
        fuel: defaults.maxFuel,
        max_fuel: defaults.maxFuel,
        is_docked: true,
      });
      if (dbShip) {
        newShip.id = dbShip.id;
      }
      await logActivity({
        player_id: player.dbId,
        event_type: 'ship_built',
        description: `Built new ${shipClassName} "${shipName}"`,
        metadata: { shipId: newShip.id, shipClass },
      });
    }

    addShipToStore(newShip);
    addToast('success', 'Ship Built! 🚀', `New ${shipClassName} "${shipName}" added to your hangar.`);
  }, [addToast, player, addShipToStore]);

  const repairShip = useCallback(async (shipId: string) => {
    const ship = player?.ships.find((s) => s.id === shipId);
    if (!ship) {
      addToast('error', 'Error', 'Ship not found.');
      return;
    }

    const updatedShip: Ship = { ...ship, currentHealth: ship.maxHealth };

    if (isSupabaseConfigured() && player?.dbId) {
      await dbUpdateShip(shipId, { current_health: ship.maxHealth });
      await logActivity({
        player_id: player.dbId,
        event_type: 'ship_repaired',
        description: `Repaired "${ship.name}" to full health`,
        metadata: { shipId },
      });
    }

    updateShipInStore(updatedShip);
    addToast('success', 'Ship Repaired 🔧', `Hull integrity restored to 100%.`);
  }, [addToast, player, updateShipInStore]);

  const refuelShip = useCallback(async (shipId: string) => {
    const ship = player?.ships.find((s) => s.id === shipId);
    if (!ship) {
      addToast('error', 'Error', 'Ship not found.');
      return;
    }

    const updatedShip: Ship = { ...ship, fuel: ship.maxFuel };

    if (isSupabaseConfigured() && player?.dbId) {
      await dbUpdateShip(shipId, { fuel: ship.maxFuel });
      await logActivity({
        player_id: player.dbId,
        event_type: 'ship_refueled',
        description: `Refueled "${ship.name}" to capacity`,
        metadata: { shipId },
      });
    }

    updateShipInStore(updatedShip);
    addToast('success', 'Ship Refueled ⛽', `Fuel tanks filled to capacity.`);
  }, [addToast, player, updateShipInStore]);

  const deployShip = useCallback(async (shipId: string) => {
    const ship = player?.ships.find((s) => s.id === shipId);
    if (!ship) {
      addToast('error', 'Error', 'Ship not found.');
      return;
    }

    const updatedShip: Ship = { ...ship, isDocked: false, dockedAt: null };

    if (isSupabaseConfigured() && player?.dbId) {
      await dbUpdateShip(shipId, { is_docked: false });
      await logActivity({
        player_id: player.dbId,
        event_type: 'ship_deployed',
        description: `Deployed "${ship.name}"`,
        metadata: { shipId },
      });
    }

    updateShipInStore(updatedShip);
    addToast('info', 'Ship Deployed 🛫', `Ship has left the hangar on patrol.`);
  }, [addToast, player, updateShipInStore]);

  const recallShip = useCallback(async (shipId: string) => {
    const ship = player?.ships.find((s) => s.id === shipId);
    if (!ship) {
      addToast('error', 'Error', 'Ship not found.');
      return;
    }

    const updatedShip: Ship = { ...ship, isDocked: true };

    if (isSupabaseConfigured() && player?.dbId) {
      await dbUpdateShip(shipId, { is_docked: true });
      await logActivity({
        player_id: player.dbId,
        event_type: 'ship_recalled',
        description: `Recalled "${ship.name}" to hangar`,
        metadata: { shipId },
      });
    }

    updateShipInStore(updatedShip);
    addToast('info', 'Ship Recalled', `Ship is returning to hangar.`);
  }, [addToast, player, updateShipInStore]);

  // ============ Mission Actions ============

  const startMission = useCallback(async (missionId: string) => {
    if (!player) {
      addToast('error', 'Error', 'No player data.');
      return;
    }

    const newMission: ActiveMission = {
      id: crypto.randomUUID(),
      templateId: missionId,
      player: player.address,
      agentId: missionId, // Using missionId as agentId for now (views pass agentId here)
      shipId: null,
      startedAt: Date.now(),
      endsAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
      status: MissionStatus.Active,
    };

    if (isSupabaseConfigured() && player.dbId) {
      const dbMission = await dbCreateMission({
        player_id: player.dbId,
        template_id: missionId,
        agent_id: missionId,
        ship_id: null,
        status: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
        reward: null,
        success: null,
      });
      if (dbMission) {
        newMission.id = dbMission.id;
      }
      await logActivity({
        player_id: player.dbId,
        event_type: 'mission_started',
        description: `Started a new mission`,
        metadata: { missionId: newMission.id },
      });
    }

    addActiveMissionToStore(newMission);
    addToast('success', 'Mission Started! 📜', `Your agent has embarked on the mission.`);
  }, [addToast, player, addActiveMissionToStore]);

  const abortMission = useCallback(async (missionId: string) => {
    if (isSupabaseConfigured() && player?.dbId) {
      await dbCompleteMission(missionId, false, 0);
      await logActivity({
        player_id: player.dbId,
        event_type: 'mission_aborted',
        description: `Aborted mission`,
        metadata: { missionId },
      });
    }

    removeActiveMissionFromStore(missionId);
    addToast('warning', 'Mission Aborted', `Mission cancelled. No rewards earned.`);
  }, [addToast, player, removeActiveMissionFromStore]);

  const claimRewards = useCallback(async (_missionId?: string) => {
    const reward = Math.floor(Math.random() * 1000) + 500;

    if (isSupabaseConfigured() && player?.dbId && _missionId) {
      await dbCompleteMission(_missionId, true, reward);
      await logActivity({
        player_id: player.dbId,
        event_type: 'rewards_claimed',
        description: `Claimed ${reward} GALACTIC tokens`,
        metadata: { missionId: _missionId, reward },
      });
    }

    if (_missionId) {
      removeActiveMissionFromStore(_missionId);
    }

    addToast('success', 'Rewards Claimed! 💰', `Received ${reward.toLocaleString()} GALACTIC tokens.`);
  }, [addToast, player, removeActiveMissionFromStore]);

  // ============ DeFi Actions (persist activity log) ============

  const swap = useCallback((fromToken: string, toToken: string, amount: number) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'swap',
        description: `Swapped ${amount} ${fromToken} for ${toToken}`,
        metadata: { fromToken, toToken, amount },
      });
    }
    addToast('success', 'Swap Complete 🔄', `Swapped ${amount} ${fromToken} for ${toToken}.`);
  }, [addToast, player]);

  const addLiquidity = useCallback((amount: number) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'add_liquidity',
        description: `Added ${amount} to the liquidity pool`,
        metadata: { amount },
      });
    }
    addToast('success', 'Liquidity Added 💧', `Added ${amount} to the liquidity pool.`);
  }, [addToast, player]);

  const removeLiquidity = useCallback((amount: number) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'remove_liquidity',
        description: `Removed ${amount} from the pool`,
        metadata: { amount },
      });
    }
    addToast('info', 'Liquidity Removed', `Removed ${amount} from the pool.`);
  }, [addToast, player]);

  const stakeTokens = useCallback((amount: number) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'stake',
        description: `Staked ${amount} GALACTIC`,
        metadata: { amount },
      });
    }
    addToast('success', 'Staked! ⛓️', `Staked ${amount} GALACTIC. Earning 12.5% APY.`);
  }, [addToast, player]);

  const unstakeTokens = useCallback((amount: number) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'unstake',
        description: `Unstaked ${amount} GALACTIC`,
        metadata: { amount },
      });
    }
    addToast('info', 'Unstaked', `Unstaked ${amount} GALACTIC.`);
  }, [addToast, player]);

  const claimYield = useCallback(() => {
    const yield_ = Math.floor(Math.random() * 500) + 100;
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'claim_yield',
        description: `Claimed ${yield_} GALACTIC rewards`,
        metadata: { yield: yield_ },
      });
    }
    addToast('success', 'Yield Claimed! 🌾', `Claimed ${yield_} GALACTIC rewards.`);
  }, [addToast, player]);

  // ============ Governance Actions (persist activity log) ============

  const vote = useCallback((_proposalId: string, support: boolean) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'vote',
        description: `Voted ${support ? 'FOR' : 'AGAINST'} proposal`,
        metadata: { proposalId: _proposalId, support },
      });
    }
    addToast('success', 'Vote Cast! 🗳️', `You voted ${support ? 'FOR' : 'AGAINST'} the proposal.`);
  }, [addToast, player]);

  const createProposal = useCallback((title: string) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'proposal_created',
        description: `Created proposal "${title}"`,
        metadata: { title },
      });
    }
    addToast('success', 'Proposal Created 📝', `"${title}" submitted for voting.`);
  }, [addToast, player]);

  // ============ Map Actions (persist activity log) ============

  const travelTo = useCallback((destination: string) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'travel',
        description: `Traveling to ${destination}`,
        metadata: { destination },
      });
    }
    addToast('info', 'Traveling... 🌌', `En route to ${destination}. ETA: 2 hours.`);
  }, [addToast, player]);

  const explore = useCallback((_locationId: string) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'explore',
        description: `Exploring location`,
        metadata: { locationId: _locationId },
      });
    }
    addToast('success', 'Exploring 🔭', `Scanning the area... Resources detected!`);
  }, [addToast, player]);

  const dock = useCallback((_stationId: string) => {
    if (isSupabaseConfigured() && player?.dbId) {
      logActivity({
        player_id: player.dbId,
        event_type: 'dock',
        description: `Docked at station`,
        metadata: { stationId: _stationId },
      });
    }
    addToast('success', 'Docked 🛸', `Successfully docked at the station.`);
  }, [addToast, player]);

  const value: GameActionsContextType = {
    toasts,
    dismissToast,
    mintAgent,
    trainAgent,
    stakeAgent,
    unstakeAgent,
    buildShip,
    repairShip,
    refuelShip,
    deployShip,
    recallShip,
    startMission,
    abortMission,
    claimRewards,
    swap,
    addLiquidity,
    removeLiquidity,
    stake: stakeTokens,
    unstake: unstakeTokens,
    claimYield,
    vote,
    createProposal,
    travelTo,
    explore,
    dock,
  };

  return (
    <GameActionsContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg border backdrop-blur-md shadow-lg animate-slide-in ${
              toast.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                : toast.type === 'error'
                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                  : toast.type === 'warning'
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                    : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
            }`}
            onClick={() => dismissToast(toast.id)}
          >
            <div className="font-bold text-sm">{toast.title}</div>
            <div className="text-xs opacity-80 mt-1">{toast.message}</div>
          </div>
        ))}
      </div>
    </GameActionsContext.Provider>
  );
}

export function useGameActions(): GameActionsContextType {
  const context = useContext(GameActionsContext);
  if (!context) {
    throw new Error('useGameActions must be used within GameActionsProvider');
  }
  return context;
}

export default useGameActions;
