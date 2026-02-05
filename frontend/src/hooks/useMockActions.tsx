/**
 * useMockActions Hook
 * Provides mock action handlers with toast-style notifications
 */

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
}

interface MockActionsContextType {
    toasts: Toast[];
    dismissToast: (id: string) => void;

    // Agent Actions
    mintAgent: (name?: string) => void;
    trainAgent: (agentId: string) => void;
    stakeAgent: (agentId: string) => void;
    unstakeAgent: (agentId: string) => void;

    // Ship Actions
    buildShip: (shipClass: string) => void;
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

const MockActionsContext = createContext<MockActionsContextType | null>(null);

export function MockActionsProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
        const id = Date.now().toString();
        const newToast: Toast = { id, type, title, message };
        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Agent Actions
    const mintAgent = useCallback((name?: string) => {
        const agentName = name || `Agent-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        addToast('success', 'Agent Minted! 🤖', `${agentName} has joined your crew.`);
    }, [addToast]);

    const trainAgent = useCallback((_agentId: string) => {
        addToast('info', 'Training Started 📚', `Agent is now training. +50 XP earned.`);
    }, [addToast]);

    const stakeAgent = useCallback((_agentId: string) => {
        addToast('success', 'Agent Staked ⛓️', `Agent is now staked and earning yield.`);
    }, [addToast]);

    const unstakeAgent = useCallback((_agentId: string) => {
        addToast('info', 'Agent Unstaked', `Agent has been unstaked and is available.`);
    }, [addToast]);

    // Ship Actions
    const buildShip = useCallback((shipClass: string) => {
        addToast('success', 'Ship Built! 🚀', `New ${shipClass} added to your hangar.`);
    }, [addToast]);

    const repairShip = useCallback((_shipId: string) => {
        addToast('success', 'Ship Repaired 🔧', `Hull integrity restored to 100%.`);
    }, [addToast]);

    const refuelShip = useCallback((_shipId: string) => {
        addToast('success', 'Ship Refueled ⛽', `Fuel tanks filled to capacity.`);
    }, [addToast]);

    const deployShip = useCallback((_shipId: string) => {
        addToast('info', 'Ship Deployed 🛫', `Ship has left the hangar on patrol.`);
    }, [addToast]);

    const recallShip = useCallback((_shipId: string) => {
        addToast('info', 'Ship Recalled', `Ship is returning to hangar.`);
    }, [addToast]);

    // Mission Actions
    const startMission = useCallback((_missionId: string) => {
        addToast('success', 'Mission Started! 📜', `Your agent has embarked on the mission.`);
    }, [addToast]);

    const abortMission = useCallback((_missionId: string) => {
        addToast('warning', 'Mission Aborted', `Mission cancelled. No rewards earned.`);
    }, [addToast]);

    const claimRewards = useCallback((_missionId?: string) => {
        const reward = Math.floor(Math.random() * 1000) + 500;
        addToast('success', 'Rewards Claimed! 💰', `Received ${reward.toLocaleString()} GALACTIC tokens.`);
    }, [addToast]);

    // DeFi Actions
    const swap = useCallback((fromToken: string, toToken: string, amount: number) => {
        addToast('success', 'Swap Complete 🔄', `Swapped ${amount} ${fromToken} for ${toToken}.`);
    }, [addToast]);

    const addLiquidity = useCallback((amount: number) => {
        addToast('success', 'Liquidity Added 💧', `Added ${amount} to the liquidity pool.`);
    }, [addToast]);

    const removeLiquidity = useCallback((amount: number) => {
        addToast('info', 'Liquidity Removed', `Removed ${amount} from the pool.`);
    }, [addToast]);

    const stake = useCallback((amount: number) => {
        addToast('success', 'Staked! ⛓️', `Staked ${amount} GALACTIC. Earning 12.5% APY.`);
    }, [addToast]);

    const unstake = useCallback((amount: number) => {
        addToast('info', 'Unstaked', `Unstaked ${amount} GALACTIC.`);
    }, [addToast]);

    const claimYield = useCallback(() => {
        const yield_ = Math.floor(Math.random() * 500) + 100;
        addToast('success', 'Yield Claimed! 🌾', `Claimed ${yield_} GALACTIC rewards.`);
    }, [addToast]);

    // Governance Actions
    const vote = useCallback((_proposalId: string, support: boolean) => {
        addToast('success', 'Vote Cast! 🗳️', `You voted ${support ? 'FOR' : 'AGAINST'} the proposal.`);
    }, [addToast]);

    const createProposal = useCallback((title: string) => {
        addToast('success', 'Proposal Created 📝', `"${title}" submitted for voting.`);
    }, [addToast]);

    // Map Actions
    const travelTo = useCallback((destination: string) => {
        addToast('info', 'Traveling... 🌌', `En route to ${destination}. ETA: 2 hours.`);
    }, [addToast]);

    const explore = useCallback((_locationId: string) => {
        addToast('success', 'Exploring 🔭', `Scanning the area... Resources detected!`);
    }, [addToast]);

    const dock = useCallback((_stationId: string) => {
        addToast('success', 'Docked 🛸', `Successfully docked at the station.`);
    }, [addToast]);

    const value: MockActionsContextType = {
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
        stake,
        unstake,
        claimYield,
        vote,
        createProposal,
        travelTo,
        explore,
        dock,
    };

    return (
        <MockActionsContext.Provider value= { value } >
        { children }
    {/* Toast Container */ }
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm" >
    {
        toasts.map(toast => (
            <div
            key= { toast.id }
            className = {`p-4 rounded-lg border backdrop-blur-md shadow-lg animate-slide-in ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                    toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                        toast.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                            'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                }`}
    onClick = {() => dismissToast(toast.id)
}
          >
    <div className="font-bold text-sm" > { toast.title } </div>
        < div className = "text-xs opacity-80 mt-1" > { toast.message } </div>
            </div>
        ))}
</div>
    </MockActionsContext.Provider>
  );
}

export function useMockActions(): MockActionsContextType {
    const context = useContext(MockActionsContext);
    if (!context) {
        throw new Error('useMockActions must be used within MockActionsProvider');
    }
    return context;
}

export default useMockActions;
