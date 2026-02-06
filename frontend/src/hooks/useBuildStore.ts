/**
 * useBuildStore — Zustand store for AI Builder suggestion queue and rule proposals.
 * OpenClaw agents submit suggestions here; the Build UI renders them.
 */

import { create } from 'zustand';
import type { BuildSuggestion, RuleProposal } from '../types';

interface BuildStore {
  // Suggestions (OpenClaw → user)
  suggestions: BuildSuggestion[];
  addSuggestion: (suggestion: Omit<BuildSuggestion, 'id' | 'timestamp' | 'status'>) => string;
  acceptSuggestion: (id: string, txDigest?: string) => void;
  dismissSuggestion: (id: string) => void;

  // Rule proposals (OpenClaw → governance)
  ruleProposals: RuleProposal[];
  addRuleProposal: (proposal: Omit<RuleProposal, 'id' | 'timestamp' | 'status'>) => string;
  updateProposalStatus: (id: string, status: RuleProposal['status']) => void;
  updateProposalVotes: (id: string, votesFor: number, votesAgainst: number) => void;
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

  ruleProposals: [],

  addRuleProposal: (proposal) => {
    const id = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const full: RuleProposal = {
      ...proposal,
      id,
      timestamp: Date.now(),
      status: 'pending',
    };
    set((state) => ({ ruleProposals: [...state.ruleProposals, full] }));
    return id;
  },

  updateProposalStatus: (id, status) => {
    set((state) => ({
      ruleProposals: state.ruleProposals.map(p =>
        p.id === id ? { ...p, status } : p
      ),
    }));
  },

  updateProposalVotes: (id, votesFor, votesAgainst) => {
    set((state) => ({
      ruleProposals: state.ruleProposals.map(p =>
        p.id === id ? { ...p, votesFor, votesAgainst } : p
      ),
    }));
  },
}));
