/**
 * BuildView — AI Builder UI
 * Shows OpenClaw suggestions, rule proposals, and recently built items.
 */

import { useCallback } from 'react';
import { useBuildStore } from '../../hooks/useBuildStore';
import { useGameActions } from '../../hooks/useGameActions';
import { useCodeVerification } from '../../hooks/useCodeVerification';
import { useGameRules } from '../../hooks/useGameRules';
import { AGENT_CLASS_NAMES, AGENT_TYPE_NAMES, SHIP_CLASS_NAMES } from '../../config/contracts';
import type { BuildSuggestion, RuleProposal } from '../../types';

function SuggestionCard({ suggestion, onBuild, onDismiss }: {
  suggestion: BuildSuggestion;
  onBuild: () => void;
  onDismiss: () => void;
}) {
  const getTypeLabel = () => {
    switch (suggestion.type) {
      case 'mint_agent': return 'Mint Agent';
      case 'build_ship': return 'Build Ship';
      case 'build_station': return 'Build Station';
    }
  };

  const getParamSummary = () => {
    const p = suggestion.params;
    if (suggestion.type === 'mint_agent') {
      const typeName = AGENT_TYPE_NAMES[p.agentType as number] || 'Human';
      const className = AGENT_CLASS_NAMES[p.agentClass as number] || 'Hacker';
      return `${typeName} ${className} — "${p.name || 'Unnamed'}"`;
    }
    if (suggestion.type === 'build_ship') {
      const className = SHIP_CLASS_NAMES[p.shipClass as number] || 'Scout';
      return `${className} — "${p.name || 'Unnamed'}"`;
    }
    return JSON.stringify(p);
  };

  return (
    <div className="p-4 rounded-lg bg-slate-800/60 border border-cyan-500/30 hover:border-cyan-400/50 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-medium">
          {getTypeLabel()}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(suggestion.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-white font-medium mb-1">{getParamSummary()}</p>
      <p className="text-xs text-slate-400 mb-3">{suggestion.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">by {suggestion.suggestedBy}</span>
        {suggestion.status === 'pending' ? (
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition-all"
            >
              Dismiss
            </button>
            <button
              onClick={onBuild}
              className="px-3 py-1 text-xs rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all"
            >
              Build
            </button>
          </div>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded ${
            suggestion.status === 'accepted'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-slate-600/20 text-slate-500'
          }`}>
            {suggestion.status === 'accepted' ? 'Built' : 'Dismissed'}
          </span>
        )}
      </div>
      {suggestion.txDigest && (
        <div className="mt-2 text-xs text-slate-500">
          Tx: <span className="text-cyan-400/60">{suggestion.txDigest.slice(0, 16)}...</span>
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: RuleProposal }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    approved: 'bg-green-500/20 text-green-400 border-green-500/50',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/50',
    applied: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  };

  return (
    <div className="p-4 rounded-lg bg-slate-800/60 border border-purple-500/30 hover:border-purple-400/50 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[proposal.status]}`}>
          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(proposal.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <h4 className="text-sm text-white font-medium mb-1">{proposal.title}</h4>
      <p className="text-xs text-slate-400 mb-2">{proposal.description}</p>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>Target: <span className="text-purple-400">{proposal.targetFile}</span></span>
        <span>by {proposal.proposedBy}</span>
      </div>
      {(proposal.votesFor !== undefined || proposal.votesAgainst !== undefined) && (
        <div className="mt-2 flex gap-4 text-xs">
          <span className="text-green-400">For: {proposal.votesFor ?? 0}</span>
          <span className="text-red-400">Against: {proposal.votesAgainst ?? 0}</span>
        </div>
      )}
      <div className="mt-2">
        <details className="text-xs">
          <summary className="text-slate-500 cursor-pointer hover:text-slate-400">View patch</summary>
          <pre className="mt-1 p-2 rounded bg-slate-900/80 text-slate-400 overflow-x-auto">
            {JSON.stringify(proposal.patch, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export function BuildView() {
  const { suggestions, ruleProposals, acceptSuggestion, dismissSuggestion } = useBuildStore();
  const { mintAgent, buildShip } = useGameActions();
  const verification = useCodeVerification();
  const { rules } = useGameRules();

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const recentBuilds = suggestions.filter(s => s.status === 'accepted').slice(-10).reverse();
  const pendingProposals = ruleProposals.filter(p => p.status === 'pending');
  const allProposals = ruleProposals.slice().reverse();

  const handleBuild = useCallback(async (suggestion: BuildSuggestion) => {
    try {
      if (suggestion.type === 'mint_agent') {
        await mintAgent(
          suggestion.params.name as string,
          suggestion.params.agentType as number,
          suggestion.params.agentClass as number,
        );
      } else if (suggestion.type === 'build_ship') {
        await buildShip(
          String(suggestion.params.shipClass ?? '0'),
          suggestion.params.name as string,
        );
      }
      acceptSuggestion(suggestion.id, 'tx-pending');
    } catch {
      // Toast already shown by useGameActions
    }
  }, [mintAgent, buildShip, acceptSuggestion]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            AI Builder
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            OpenClaw suggestions and governance proposals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Verification badge */}
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            verification.isLoading
              ? 'bg-slate-700/50 border-slate-600 text-slate-400'
              : verification.isVerified
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {verification.isLoading ? 'Verifying...' :
             verification.isVerified ? 'Rules Verified' : 'Rules Mismatch'}
          </div>
          {rules && (
            <span className="text-xs text-slate-500">
              v{verification.version || 0}
            </span>
          )}
        </div>
      </div>

      {/* Verification warning */}
      {verification.mismatch && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          Your game rules don't match the community-approved version.
          Update your rules to play with the latest configuration.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggestions Feed */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-cyan-400">&gt;</span>
            Pending Suggestions
            {pendingSuggestions.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                {pendingSuggestions.length}
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {pendingSuggestions.length === 0 ? (
              <div className="p-6 rounded-lg bg-slate-800/40 border border-slate-700 text-center">
                <p className="text-slate-500 text-sm">No pending suggestions</p>
                <p className="text-slate-600 text-xs mt-1">
                  OpenClaw agents can submit suggestions via window.suiInSpace.suggest()
                </p>
              </div>
            ) : (
              pendingSuggestions.map(s => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  onBuild={() => handleBuild(s)}
                  onDismiss={() => dismissSuggestion(s.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Rule Proposals */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-purple-400">&gt;</span>
            Rule Proposals
            {pendingProposals.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                {pendingProposals.length}
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {allProposals.length === 0 ? (
              <div className="p-6 rounded-lg bg-slate-800/40 border border-slate-700 text-center">
                <p className="text-slate-500 text-sm">No rule proposals yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  OpenClaw agents can propose changes via window.suiInSpace.proposeRule()
                </p>
              </div>
            ) : (
              allProposals.map(p => (
                <ProposalCard key={p.id} proposal={p} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recently Built */}
      {recentBuilds.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-green-400">&gt;</span>
            Recently Built
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentBuilds.map(s => (
              <div key={s.id} className="p-3 rounded-lg bg-slate-800/40 border border-green-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-400 font-medium">{s.type.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(s.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-white">{(s.params.name as string) || 'Unnamed'}</p>
                {s.txDigest && (
                  <p className="text-xs text-slate-500 mt-1">
                    Tx: {s.txDigest.slice(0, 12)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Rules Summary */}
      {rules && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-yellow-400">&gt;</span>
            Active Game Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700">
              <h4 className="text-xs text-slate-400 mb-2">Agent Rules</h4>
              <p className="text-sm text-white">
                {rules.agent.leveling.maxLevel} max level, {rules.agent.augmentSlotUnlocks.length} aug slots
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {Object.keys(rules.agent.classBonuses).length} classes configured
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700">
              <h4 className="text-xs text-slate-400 mb-2">Mission Rules</h4>
              <p className="text-sm text-white">
                {rules.mission.templates.length} templates, {rules.mission.successFormula.maxSuccess}% max
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Base: {rules.mission.successFormula.base}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700">
              <h4 className="text-xs text-slate-400 mb-2">World Rules</h4>
              <p className="text-sm text-white">
                {rules.world.areas.length} areas
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {rules.world.events.length} events
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700">
              <h4 className="text-xs text-slate-400 mb-2">DeFi Rules</h4>
              <p className="text-sm text-white">
                Swap fee: {rules.defi.swapFee} bps
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {Object.keys(rules.defi.yieldRates).length} yield sources
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bridge Status */}
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <span className="text-cyan-400">&gt;</span>
          OpenClaw Bridge
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className={`flex items-center gap-1 ${
            typeof window !== 'undefined' && window.suiInSpace ? 'text-green-400' : 'text-slate-500'
          }`}>
            <span className="inline-block w-2 h-2 rounded-full bg-current" />
            {typeof window !== 'undefined' && window.suiInSpace ? 'Active' : 'Initializing'}
          </span>
          <span className="text-slate-500">
            API: window.suiInSpace
          </span>
          <span className="text-slate-500">
            {suggestions.length} total suggestions
          </span>
          <span className="text-slate-500">
            {ruleProposals.length} total proposals
          </span>
        </div>
      </div>
    </div>
  );
}
