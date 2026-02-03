import { create } from 'zustand';
import type { PlayerState, GameState, UIState, ObjectId, Agent, Ship, Planet, Station, ActiveMission } from '../types';

/**
 * Global game store using Zustand
 */
interface GameStore {
  // Player State
  player: PlayerState | null;
  setPlayer: (player: PlayerState | null) => void;
  updatePlayerBalance: (galactic: bigint, sui: bigint) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  addShip: (ship: Ship) => void;
  updateShip: (ship: Ship) => void;
  addPlanet: (planet: Planet) => void;
  addStation: (station: Station) => void;
  addActiveMission: (mission: ActiveMission) => void;
  removeActiveMission: (missionId: ObjectId) => void;

  // Game State
  game: GameState;
  setGameState: (state: Partial<GameState>) => void;

  // UI State
  ui: UIState;
  setUIState: (state: Partial<UIState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectAgent: (id: ObjectId | null) => void;
  selectShip: (id: ObjectId | null) => void;
  selectPlanet: (id: ObjectId | null) => void;
  selectStation: (id: ObjectId | null) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial player state
  player: null,
  
  setPlayer: (player) => set({ player }),
  
  updatePlayerBalance: (galactic, sui) => set((state) => ({
    player: state.player ? {
      ...state.player,
      galacticBalance: galactic,
      suiBalance: sui,
    } : null,
  })),
  
  addAgent: (agent) => set((state) => ({
    player: state.player ? {
      ...state.player,
      agents: [...state.player.agents, agent],
    } : null,
  })),
  
  updateAgent: (agent) => set((state) => ({
    player: state.player ? {
      ...state.player,
      agents: state.player.agents.map((a) => a.id === agent.id ? agent : a),
    } : null,
  })),
  
  addShip: (ship) => set((state) => ({
    player: state.player ? {
      ...state.player,
      ships: [...state.player.ships, ship],
    } : null,
  })),
  
  updateShip: (ship) => set((state) => ({
    player: state.player ? {
      ...state.player,
      ships: state.player.ships.map((s) => s.id === ship.id ? ship : s),
    } : null,
  })),
  
  addPlanet: (planet) => set((state) => ({
    player: state.player ? {
      ...state.player,
      planets: [...state.player.planets, planet],
    } : null,
  })),
  
  addStation: (station) => set((state) => ({
    player: state.player ? {
      ...state.player,
      stations: [...state.player.stations, station],
    } : null,
  })),
  
  addActiveMission: (mission) => set((state) => ({
    player: state.player ? {
      ...state.player,
      activeMissions: [...state.player.activeMissions, mission],
    } : null,
  })),
  
  removeActiveMission: (missionId) => set((state) => ({
    player: state.player ? {
      ...state.player,
      activeMissions: state.player.activeMissions.filter((m) => m.id !== missionId),
    } : null,
  })),

  // Initial game state
  game: {
    currentEpoch: 0,
    totalPlayers: 0,
    totalValueLocked: 0n,
    galacticPrice: 0,
    activeMissions: 0,
    activeProposals: 0,
  },
  
  setGameState: (state) => set((prev) => ({
    game: { ...prev.game, ...state },
  })),

  // Initial UI state
  ui: {
    isLoading: false,
    error: null,
    selectedAgent: null,
    selectedShip: null,
    selectedPlanet: null,
    selectedStation: null,
    activeTab: 'map',
  },
  
  setUIState: (state) => set((prev) => ({
    ui: { ...prev.ui, ...state },
  })),
  
  setLoading: (loading) => set((prev) => ({
    ui: { ...prev.ui, isLoading: loading },
  })),
  
  setError: (error) => set((prev) => ({
    ui: { ...prev.ui, error },
  })),
  
  selectAgent: (id) => set((prev) => ({
    ui: { ...prev.ui, selectedAgent: id },
  })),
  
  selectShip: (id) => set((prev) => ({
    ui: { ...prev.ui, selectedShip: id },
  })),
  
  selectPlanet: (id) => set((prev) => ({
    ui: { ...prev.ui, selectedPlanet: id },
  })),
  
  selectStation: (id) => set((prev) => ({
    ui: { ...prev.ui, selectedStation: id },
  })),
  
  setActiveTab: (tab) => set((prev) => ({
    ui: { ...prev.ui, activeTab: tab },
  })),
}));

export default useGameStore;
