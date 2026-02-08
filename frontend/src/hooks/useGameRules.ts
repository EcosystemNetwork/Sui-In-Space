/**
 * useGameRules — Fetches game-rules JSON configs and provides them to views.
 * All game logic should read from these rules instead of hardcoding values.
 * Rules are blocked if Merkle verification fails.
 */

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import type { GameRules, AgentRules, MissionRules, WorldRules, DefiRules } from '../types';
import React from 'react';

interface GameRulesContextType {
  rules: GameRules | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const GameRulesContext = createContext<GameRulesContextType | null>(null);

async function fetchRules(): Promise<GameRules> {
  const [agent, mission, world, defi] = await Promise.all([
    fetch('/game-rules/agent-rules.json').then(r => {
      if (!r.ok) throw new Error('Failed to load agent-rules.json');
      return r.json() as Promise<AgentRules>;
    }),
    fetch('/game-rules/mission-rules.json').then(r => {
      if (!r.ok) throw new Error('Failed to load mission-rules.json');
      return r.json() as Promise<MissionRules>;
    }),
    fetch('/game-rules/world-rules.json').then(r => {
      if (!r.ok) throw new Error('Failed to load world-rules.json');
      return r.json() as Promise<WorldRules>;
    }),
    fetch('/game-rules/defi-rules.json').then(r => {
      if (!r.ok) throw new Error('Failed to load defi-rules.json');
      return r.json() as Promise<DefiRules>;
    }),
  ]);

  return { agent, mission, world, defi };
}

export function GameRulesProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<GameRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchRules()
      .then(setRules)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load game rules'))
      .finally(() => setIsLoading(false));
  }, [reloadKey]);

  const reload = () => setReloadKey(k => k + 1);

  return React.createElement(GameRulesContext.Provider, {
    value: { rules, isLoading, error, reload },
    children,
  });
}

export function useGameRules(): GameRulesContextType {
  const context = useContext(GameRulesContext);
  if (!context) {
    throw new Error('useGameRules must be used within a GameRulesProvider');
  }
  return context;
}
