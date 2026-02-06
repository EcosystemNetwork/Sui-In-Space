/**
 * OpenClaw Bridge — Exposes window.suiInSpace API for external AI agents.
 * OpenClaw agents interact with the game through this bridge.
 */

import type { BuildSuggestion, RuleProposal, CodeVerificationState, Agent, Ship, Station } from '../types';
import type { useGameStore } from '../hooks/useGameStore';
import { AGENT_TYPES, AGENT_CLASSES, SHIP_CLASSES, STATION_TYPES } from '../config/contracts';

type GameStoreApi = typeof useGameStore;

export interface SuiInSpaceBridge {
  version: string;

  // Read state
  getState: () => ReturnType<typeof getGameState>;
  getSuggestions: () => BuildSuggestion[];
  getRuleProposals: () => RuleProposal[];
  isConnected: () => boolean;

  // Suggest builds
  suggest: (suggestion: {
    type: 'mint_agent' | 'build_ship' | 'build_station';
    params: Record<string, unknown>;
    description: string;
    suggestedBy?: string;
  }) => string;

  // Propose rule changes
  proposeRule: (proposal: {
    title: string;
    description: string;
    targetFile: string;
    patch: Record<string, unknown>;
    proposedBy?: string;
  }) => string;

  // Direct build (async — requires wallet approval)
  buildAgent: (params: {
    name: string;
    agentType: number;
    agentClass: number;
  }) => Promise<{ digest: string }>;

  buildShip: (params: {
    name: string;
    shipClass: number;
  }) => Promise<{ digest: string }>;

  // Code integrity
  getCodeHash: () => {
    localRoot: string | null;
    onChainRoot: string | null;
    isVerified: boolean;
    version: number;
  };

  // Constants
  constants: {
    AGENT_TYPES: typeof AGENT_TYPES;
    AGENT_CLASSES: typeof AGENT_CLASSES;
    SHIP_CLASSES: typeof SHIP_CLASSES;
    STATION_TYPES: typeof STATION_TYPES;
  };
}

function getGameState(store: GameStoreApi) {
  const state = store.getState();
  if (!state.player) return null;
  return {
    player: {
      address: state.player.address,
      galacticBalance: state.player.galacticBalance.toString(),
      suiBalance: state.player.suiBalance.toString(),
      level: 1,
    },
    agents: state.player.agents.map((a: Agent) => ({
      id: a.id,
      name: a.name,
      type: a.agentType,
      class: a.class,
      level: a.level,
      experience: a.experience,
      isStaked: a.isStaked,
    })),
    ships: state.player.ships.map((s: Ship) => ({
      id: s.id,
      name: s.name,
      class: s.shipClass,
      health: s.currentHealth,
      maxHealth: s.maxHealth,
      isDocked: s.isDocked,
    })),
    stations: state.player.stations.map((st: Station) => ({
      id: st.id,
      name: st.name,
      type: st.stationType,
      level: st.level,
    })),
    activeMissions: state.player.activeMissions.length,
  };
}

interface BridgeDeps {
  store: GameStoreApi;
  addSuggestion: (s: Omit<BuildSuggestion, 'id' | 'timestamp' | 'status'>) => string;
  addRuleProposal: (p: Omit<RuleProposal, 'id' | 'timestamp' | 'status'>) => string;
  getSuggestions: () => BuildSuggestion[];
  getRuleProposals: () => RuleProposal[];
  mintAgent: (name?: string, agentType?: number, agentClass?: number) => Promise<void>;
  buildShip: (shipClass: string, name?: string) => Promise<void>;
  getVerification: () => CodeVerificationState;
  isConnected: () => boolean;
}

export function initBridge(deps: BridgeDeps): SuiInSpaceBridge {
  const bridge: SuiInSpaceBridge = {
    version: '1.0.0',

    getState: () => getGameState(deps.store),

    getSuggestions: () => deps.getSuggestions(),

    getRuleProposals: () => deps.getRuleProposals(),

    isConnected: () => deps.isConnected(),

    suggest: (suggestion) => {
      return deps.addSuggestion({
        type: suggestion.type,
        params: suggestion.params,
        description: suggestion.description,
        suggestedBy: suggestion.suggestedBy || 'OpenClaw-Agent',
      });
    },

    proposeRule: (proposal) => {
      return deps.addRuleProposal({
        title: proposal.title,
        description: proposal.description,
        targetFile: proposal.targetFile,
        patch: proposal.patch,
        proposedBy: proposal.proposedBy || 'OpenClaw-Agent',
      });
    },

    buildAgent: async (params) => {
      await deps.mintAgent(params.name, params.agentType, params.agentClass);
      return { digest: 'pending' };
    },

    buildShip: async (params) => {
      await deps.buildShip(String(params.shipClass), params.name);
      return { digest: 'pending' };
    },

    getCodeHash: () => {
      const v = deps.getVerification();
      return {
        localRoot: v.localRoot,
        onChainRoot: v.onChainRoot,
        isVerified: v.isVerified,
        version: v.version,
      };
    },

    constants: {
      AGENT_TYPES,
      AGENT_CLASSES,
      SHIP_CLASSES,
      STATION_TYPES,
    },
  };

  return bridge;
}

// Type augmentation for window
declare global {
  interface Window {
    suiInSpace?: SuiInSpaceBridge;
  }
}
