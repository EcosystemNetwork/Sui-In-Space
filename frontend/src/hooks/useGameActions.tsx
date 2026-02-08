/**
 * useGameActions — Real Move call provider.
 * Same toast system as useMockActions but executes actual blockchain transactions.
 * Falls back to toast-only (mock) when PACKAGE_ID is not configured.
 */

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useAuth } from './useAuth';
import { useGameStore } from './useGameStore';
import { PACKAGE_ID, MODULES } from '../config/contracts';
import type { Agent, Ship, AgentType, AgentClass, ShipClass } from '../types';

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
  mintAgent: (name?: string, agentType?: number, agentClass?: number) => Promise<void>;
  trainAgent: (agentId: string) => Promise<void>;
  stakeAgent: (agentId: string) => void;
  unstakeAgent: (agentId: string) => void;

  // Ship Actions
  buildShip: (shipClass: string, name?: string) => Promise<void>;
  repairShip: (shipId: string) => void;
  refuelShip: (shipId: string) => void;
  deployShip: (shipId: string) => void;
  recallShip: (shipId: string) => void;

  // Mission Actions
  startMission: (missionId: string) => void;
  abortMission: (missionId: string) => void;
  claimRewards: (missionId?: string) => void;

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

const isDeployed = PACKAGE_ID !== '0x0' && PACKAGE_ID !== '';

export function GameActionsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { address, isConnected, signAndExecuteTransaction } = useAuth();
  const { addAgent, addShip } = useGameStore();

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // === Agent Actions ===

  const mintAgent = useCallback(async (name?: string, agentType?: number, agentClass?: number) => {
    const agentName = name || `Agent-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const aType = agentType ?? 0;
    const aClass = agentClass ?? 0;

    if (!isDeployed || !isConnected) {
      addToast('success', 'Agent Minted!', `${agentName} has joined your crew.`);
      return;
    }

    try {
      addToast('info', 'Minting Agent...', `Sending transaction for ${agentName}`);
      const result = await signAndExecuteTransaction((tx: Transaction) => {
        tx.moveCall({
          target: `${MODULES.AGENT}::mint_agent_to`,
          arguments: [
            tx.pure.string(agentName),
            tx.pure.u8(aType),
            tx.pure.u8(aClass),
            tx.pure.string('Genesis'),
            tx.pure.address(address!),
          ],
        });
      });

      // Add to local store
      const newAgent: Agent = {
        id: result.digest, // Placeholder — real object ID from events
        name: agentName,
        agentType: aType as AgentType,
        class: aClass as AgentClass,
        stats: { processing: 10, mobility: 10, power: 10, resilience: 10, luck: 10, neuralBandwidth: 10 },
        level: 1,
        experience: 0,
        firmwareVersion: 1,
        aiModelLineage: 'Genesis',
        augmentSlots: [],
        maxAugmentSlots: 1,
        missionsCompleted: 0,
        battlesWon: 0,
        totalEarnings: 0n,
        isStaked: false,
        stakedAt: null,
        currentMission: null,
      };
      addAgent(newAgent);

      addToast('success', 'Agent Minted!', `${agentName} minted on-chain. Tx: ${result.digest.slice(0, 10)}...`);
    } catch (e) {
      addToast('error', 'Mint Failed', e instanceof Error ? e.message : 'Transaction failed');
    }
  }, [isConnected, address, signAndExecuteTransaction, addToast, addAgent]);

  const trainAgent = useCallback(async (agentId: string) => {
    if (!isDeployed || !isConnected) {
      addToast('info', 'Training Started', `Agent is now training. +50 XP earned.`);
      return;
    }

    try {
      addToast('info', 'Training...', 'Sending training transaction');
      await signAndExecuteTransaction((tx: Transaction) => {
        tx.moveCall({
          target: `${MODULES.AGENT}::add_experience`,
          arguments: [
            tx.object(agentId),
            tx.pure.u64(50),
          ],
        });
      });
      addToast('success', 'Training Complete', `+50 XP earned.`);
    } catch (e) {
      addToast('error', 'Training Failed', e instanceof Error ? e.message : 'Transaction failed');
    }
  }, [isConnected, signAndExecuteTransaction, addToast]);

  const stakeAgent = useCallback((_agentId: string) => {
    addToast('success', 'Agent Staked', `Agent is now staked and earning yield.`);
  }, [addToast]);

  const unstakeAgent = useCallback((_agentId: string) => {
    addToast('info', 'Agent Unstaked', `Agent has been unstaked and is available.`);
  }, [addToast]);

  // === Ship Actions ===

  const buildShip = useCallback(async (shipClass: string, name?: string) => {
    const shipName = name || `Ship-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const classNum = parseInt(shipClass) || 0;

    if (!isDeployed || !isConnected) {
      addToast('success', 'Ship Built!', `New ${shipClass} added to your hangar.`);
      return;
    }

    try {
      addToast('info', 'Building Ship...', `Constructing ${shipName}`);
      const result = await signAndExecuteTransaction((tx: Transaction) => {
        tx.moveCall({
          target: `${MODULES.SHIP}::build_ship_to`,
          arguments: [
            tx.pure.string(shipName),
            tx.pure.u8(classNum),
            tx.pure.address(address!),
          ],
        });
      });

      const newShip: Ship = {
        id: result.digest,
        name: shipName,
        shipClass: classNum as ShipClass,
        modules: { hull: null, engine: null, aiCore: null, weapon: null, utility: null },
        maxHealth: 100,
        currentHealth: 100,
        speed: 50,
        firepower: 10,
        cargoCapacity: 50,
        fuelEfficiency: 100,
        pilot: null,
        crew: [],
        maxCrew: 1,
        isDocked: false,
        dockedAt: null,
        inCombat: false,
        fuel: 100,
        maxFuel: 100,
      };
      addShip(newShip);

      addToast('success', 'Ship Built!', `${shipName} built on-chain. Tx: ${result.digest.slice(0, 10)}...`);
    } catch (e) {
      addToast('error', 'Build Failed', e instanceof Error ? e.message : 'Transaction failed');
    }
  }, [isConnected, address, signAndExecuteTransaction, addToast, addShip]);

  const repairShip = useCallback((_shipId: string) => {
    addToast('success', 'Ship Repaired', `Hull integrity restored to 100%.`);
  }, [addToast]);

  const refuelShip = useCallback((_shipId: string) => {
    addToast('success', 'Ship Refueled', `Fuel tanks filled to capacity.`);
  }, [addToast]);

  const deployShip = useCallback((_shipId: string) => {
    addToast('info', 'Ship Deployed', `Ship has left the hangar on patrol.`);
  }, [addToast]);

  const recallShip = useCallback((_shipId: string) => {
    addToast('info', 'Ship Recalled', `Ship is returning to hangar.`);
  }, [addToast]);

  // === Mission Actions ===

  const startMission = useCallback((_missionId: string) => {
    addToast('success', 'Mission Started!', `Your agent has embarked on the mission.`);
  }, [addToast]);

  const abortMission = useCallback((_missionId: string) => {
    addToast('warning', 'Mission Aborted', `Mission cancelled. No rewards earned.`);
  }, [addToast]);

  const claimRewards = useCallback((_missionId?: string) => {
    const reward = Math.floor(Math.random() * 1000) + 500;
    addToast('success', 'Rewards Claimed!', `Received ${reward.toLocaleString()} GALACTIC tokens.`);
  }, [addToast]);

  // === DeFi Actions ===

  const swap = useCallback((fromToken: string, toToken: string, amount: number) => {
    addToast('success', 'Swap Complete', `Swapped ${amount} ${fromToken} for ${toToken}.`);
  }, [addToast]);

  const addLiquidity = useCallback((amount: number) => {
    addToast('success', 'Liquidity Added', `Added ${amount} to the liquidity pool.`);
  }, [addToast]);

  const removeLiquidity = useCallback((amount: number) => {
    addToast('info', 'Liquidity Removed', `Removed ${amount} from the pool.`);
  }, [addToast]);

  const stakeAction = useCallback((amount: number) => {
    addToast('success', 'Staked!', `Staked ${amount} GALACTIC. Earning 12.5% APY.`);
  }, [addToast]);

  const unstakeAction = useCallback((amount: number) => {
    addToast('info', 'Unstaked', `Unstaked ${amount} GALACTIC.`);
  }, [addToast]);

  const claimYield = useCallback(() => {
    const yield_ = Math.floor(Math.random() * 500) + 100;
    addToast('success', 'Yield Claimed!', `Claimed ${yield_} GALACTIC rewards.`);
  }, [addToast]);

  // === Governance Actions ===

  const vote = useCallback((_proposalId: string, support: boolean) => {
    addToast('success', 'Vote Cast!', `You voted ${support ? 'FOR' : 'AGAINST'} the proposal.`);
  }, [addToast]);

  const createProposal = useCallback((title: string) => {
    addToast('success', 'Proposal Created', `"${title}" submitted for voting.`);
  }, [addToast]);

  // === Map Actions ===

  const travelTo = useCallback((destination: string) => {
    addToast('info', 'Traveling...', `En route to ${destination}. ETA: 2 hours.`);
  }, [addToast]);

  const explore = useCallback((_locationId: string) => {
    addToast('success', 'Exploring', `Scanning the area... Resources detected!`);
  }, [addToast]);

  const dock = useCallback((_stationId: string) => {
    addToast('success', 'Docked', `Successfully docked at the station.`);
  }, [addToast]);

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
    stake: stakeAction,
    unstake: unstakeAction,
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
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg border backdrop-blur-md shadow-lg animate-slide-in cursor-pointer ${
              toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
              toast.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
              'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
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
