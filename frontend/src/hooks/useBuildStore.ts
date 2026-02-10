/**
 * useBuildStore — Zustand store for AI Builder suggestion queue.
 * OpenClaw agents submit suggestions here; the Build UI renders them.
 */

import { create } from 'zustand';
import type { BuildSuggestion } from '../types';

interface BuildStore {
  // Suggestions (OpenClaw → user)
  suggestions: BuildSuggestion[];
  addSuggestion: (suggestion: Omit<BuildSuggestion, 'id' | 'timestamp' | 'status'>) => string;
  acceptSuggestion: (id: string, txDigest?: string) => void;
  dismissSuggestion: (id: string) => void;
}

export const useBuildStore = create<BuildStore>((set) => ({
  suggestions: [],

  addSuggestion: (suggestion) => {
    const id = `sug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const full: BuildSuggestion = {
      ...suggestion,
      id,
      timestamp: Date.now(),
      status: 'pending',
    };
    set((state) => ({ suggestions: [...state.suggestions, full] }));
    return id;
  },

  acceptSuggestion: (id, txDigest) => {
    set((state) => ({
      suggestions: state.suggestions.map(s =>
        s.id === id ? { ...s, status: 'accepted' as const, txDigest } : s
      ),
    }));
  },

  dismissSuggestion: (id) => {
    set((state) => ({
      suggestions: state.suggestions.map(s =>
        s.id === id ? { ...s, status: 'dismissed' as const } : s
      ),
    }));
  },
}));
