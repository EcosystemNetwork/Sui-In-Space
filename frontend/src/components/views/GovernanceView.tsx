import React, { useState } from 'react';
import { ProposalType, ProposalStatus } from '../../types';

/**
 * Governance View Component
 * DAO voting and proposals
 */

interface DemoProposal {
  id: string;
  proposalId: number;
  title: string;
  description: string;
  proposer: string;
  proposalType: ProposalType;
  votesFor: number;
  votesAgainst: number;
  status: ProposalStatus;
  createdAt: string;
  endsAt: string;
  executionAfter: string;
  quorumReached: boolean;
}

// Demo proposals
const DEMO_PROPOSALS: DemoProposal[] = [
  {
    id: '1',
    proposalId: 47,
    title: 'Increase Staking Rewards by 15%',
    description: 'This proposal aims to increase the base staking rewards across all yield farms by 15% to incentivize more participation and liquidity.',
    proposer: '0x1a2b...3c4d',
    proposalType: ProposalType.Emission,
    votesFor: 125000000,
    votesAgainst: 45000000,
    status: ProposalStatus.Active,
    createdAt: '3 days ago',
    endsAt: '4 days left',
    executionAfter: '7 days',
    quorumReached: true,
  },
  {
    id: '2',
    proposalId: 46,
    title: 'Launch New Combat Arena Season',
    description: 'Start Season 4 of the Combat Arena with new rewards, leaderboard resets, and exclusive NFT prizes for top performers.',
    proposer: '0x5e6f...7g8h',
    proposalType: ProposalType.Feature,
    votesFor: 89000000,
    votesAgainst: 12000000,
    status: ProposalStatus.Active,
    createdAt: '5 days ago',
    endsAt: '2 days left',
    executionAfter: '5 days',
    quorumReached: true,
  },
  {
    id: '3',
    proposalId: 45,
    title: 'Reduce Protocol Swap Fees',
    description: 'Lower the swap fee from 0.3% to 0.25% to increase trading volume and competitiveness with other DEXes.',
    proposer: '0x9i0j...1k2l',
    proposalType: ProposalType.Parameter,
    votesFor: 78000000,
    votesAgainst: 92000000,
    status: ProposalStatus.Rejected,
    createdAt: '12 days ago',
    endsAt: 'Ended',
    executionAfter: '-',
    quorumReached: true,
  },
  {
    id: '4',
    proposalId: 44,
    title: 'War Declaration: Cyber Guild vs Corporations',
    description: 'The Cyber Guild formally declares economic warfare against the Corporations faction for control of Sector 12.',
    proposer: '0x3m4n...5o6p',
    proposalType: ProposalType.War,
    votesFor: 156000000,
    votesAgainst: 34000000,
    status: ProposalStatus.Executed,
    createdAt: '20 days ago',
    endsAt: 'Ended',
    executionAfter: 'Executed',
    quorumReached: true,
  },
];

const PROPOSAL_TYPE_ICONS: Record<ProposalType, string> = {
  [ProposalType.Parameter]: '⚙️',
  [ProposalType.Emission]: '💰',
  [ProposalType.Feature]: '🚀',
  [ProposalType.War]: '⚔️',
  [ProposalType.Upgrade]: '📦',
};

const PROPOSAL_TYPE_NAMES: Record<ProposalType, string> = {
  [ProposalType.Parameter]: 'Parameter Change',
  [ProposalType.Emission]: 'Emission Change',
  [ProposalType.Feature]: 'New Feature',
  [ProposalType.War]: 'War Declaration',
  [ProposalType.Upgrade]: 'Protocol Upgrade',
};

const STATUS_COLORS: Record<ProposalStatus, { bg: string; text: string; border: string }> = {
  [ProposalStatus.Active]: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  [ProposalStatus.Passed]: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  [ProposalStatus.Rejected]: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  [ProposalStatus.Executed]: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  [ProposalStatus.Cancelled]: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/50' },
};

const STATUS_NAMES: Record<ProposalStatus, string> = {
  [ProposalStatus.Active]: 'Active',
  [ProposalStatus.Passed]: 'Passed',
  [ProposalStatus.Rejected]: 'Rejected',
  [ProposalStatus.Executed]: 'Executed',
  [ProposalStatus.Cancelled]: 'Cancelled',
};

export const GovernanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'create' | 'power'>('proposals');
  const [selectedProposal, setSelectedProposal] = useState<DemoProposal | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | null>(null);

  const filteredProposals = filterStatus !== null
    ? DEMO_PROPOSALS.filter(p => p.status === filterStatus)
    : DEMO_PROPOSALS;

  // Demo voting power
  const votingPower = {
    tokenPower: 45000,
    stakedPower: 25000,
    agentPower: 5000,
    territoryPower: 15000,
    totalPower: 90000,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">🏛️</span>
          Galactic Governance
        </h2>
        <div className="flex gap-2">
          {['proposals', 'create', 'power'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'proposals' | 'create' | 'power')}
              className={`px-3 py-1.5 rounded text-sm capitalize ${
                activeTab === tab
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'power' ? 'Voting Power' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Governance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="text-2xl font-bold text-purple-400">{DEMO_PROPOSALS.length}</div>
          <div className="text-xs text-slate-400">Total Proposals</div>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">
            {DEMO_PROPOSALS.filter(p => p.status === ProposalStatus.Active).length}
          </div>
          <div className="text-xs text-slate-400">Active Voting</div>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">{(votingPower.totalPower / 1000).toFixed(0)}K</div>
          <div className="text-xs text-slate-400">Your Voting Power</div>
        </div>
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="text-2xl font-bold text-orange-400">
            {DEMO_PROPOSALS.filter(p => p.status === ProposalStatus.Executed).length}
          </div>
          <div className="text-xs text-slate-400">Executed</div>
        </div>
      </div>

      {activeTab === 'proposals' && (
        <>
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus(null)}
              className={`px-3 py-1.5 rounded text-xs ${
                filterStatus === null
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(STATUS_NAMES).map(([status, name]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(Number(status) as ProposalStatus)}
                className={`px-3 py-1.5 rounded text-xs ${
                  filterStatus === Number(status)
                    ? `${STATUS_COLORS[Number(status) as ProposalStatus].bg} ${STATUS_COLORS[Number(status) as ProposalStatus].text} border ${STATUS_COLORS[Number(status) as ProposalStatus].border}`
                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Proposals List */}
          <div className="space-y-4">
            {filteredProposals.map((proposal) => {
              const totalVotes = proposal.votesFor + proposal.votesAgainst;
              const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
              const statusStyle = STATUS_COLORS[proposal.status];

              return (
                <div
                  key={proposal.id}
                  onClick={() => setSelectedProposal(selectedProposal?.id === proposal.id ? null : proposal)}
                  className={`p-4 rounded-lg bg-slate-900/80 border cursor-pointer transition-all ${
                    selectedProposal?.id === proposal.id
                      ? 'border-purple-400 shadow-lg shadow-purple-400/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{PROPOSAL_TYPE_ICONS[proposal.proposalType]}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">#{proposal.proposalId}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                            {STATUS_NAMES[proposal.status]}
                          </span>
                        </div>
                        <h3 className="font-bold text-white">{proposal.title}</h3>
                        <p className="text-xs text-slate-400">{PROPOSAL_TYPE_NAMES[proposal.proposalType]}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-slate-400">{proposal.createdAt}</div>
                      {proposal.status === ProposalStatus.Active && (
                        <div className="text-green-400">{proposal.endsAt}</div>
                      )}
                    </div>
                  </div>

                  {/* Vote Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-400">For: {(proposal.votesFor / 1000000).toFixed(1)}M ({forPercentage.toFixed(1)}%)</span>
                      <span className="text-red-400">Against: {(proposal.votesAgainst / 1000000).toFixed(1)}M ({(100 - forPercentage).toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${forPercentage}%` }}
                      />
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${100 - forPercentage}%` }}
                      />
                    </div>
                    {proposal.quorumReached && (
                      <div className="text-xs text-cyan-400 mt-1">✓ Quorum reached</div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {selectedProposal?.id === proposal.id && (
                    <div className="pt-3 border-t border-slate-700">
                      <p className="text-sm text-slate-300 mb-3">{proposal.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                          Proposed by {proposal.proposer}
                        </div>
                        {proposal.status === ProposalStatus.Active && (
                          <div className="flex gap-2">
                            <button className="px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                              👍 Vote For
                            </button>
                            <button className="px-4 py-2 rounded bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors text-sm">
                              👎 Vote Against
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-lg bg-slate-900/80 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Create New Proposal</h3>

            <div className="space-y-4">
              {/* Proposal Type */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Proposal Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(PROPOSAL_TYPE_NAMES).map(([type, name]) => (
                    <button
                      key={type}
                      className="p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all text-center"
                    >
                      <div className="text-xl mb-1">{PROPOSAL_TYPE_ICONS[Number(type) as ProposalType]}</div>
                      <div className="text-xs text-slate-400">{name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Enter proposal title..."
                  className="w-full p-3 rounded bg-slate-800/50 border border-slate-700 text-white outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your proposal in detail..."
                  className="w-full p-3 rounded bg-slate-800/50 border border-slate-700 text-white outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              {/* Requirements */}
              <div className="p-3 rounded bg-slate-800/30 text-xs text-slate-400">
                <div className="flex justify-between mb-1">
                  <span>Required Voting Power</span>
                  <span className="text-white">100,000 VP</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Your Voting Power</span>
                  <span className={votingPower.totalPower >= 100000 ? 'text-green-400' : 'text-red-400'}>
                    {votingPower.totalPower.toLocaleString()} VP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Proposal Cost</span>
                  <span className="text-cyan-400">10,000 GALACTIC</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled={votingPower.totalPower < 100000}
                className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${
                  votingPower.totalPower >= 100000
                    ? 'bg-purple-500/30 border border-purple-400/50 text-white hover:bg-purple-500/50'
                    : 'bg-slate-700/50 border border-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                {votingPower.totalPower >= 100000 ? '📜 Submit Proposal' : '🔒 Insufficient Voting Power'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'power' && (
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-lg bg-slate-900/80 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Your Voting Power</h3>

            <div className="space-y-4">
              {/* Total Power */}
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
                <div className="text-4xl font-bold text-purple-400 mb-1">
                  {votingPower.totalPower.toLocaleString()}
                </div>
                <div className="text-slate-400">Total Voting Power</div>
              </div>

              {/* Power Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💎</span>
                    <div>
                      <div className="text-white font-medium">Token Holdings</div>
                      <div className="text-xs text-slate-400">1 GALACTIC = 1 VP</div>
                    </div>
                  </div>
                  <div className="text-cyan-400 font-bold">{votingPower.tokenPower.toLocaleString()}</div>
                </div>

                <div className="flex justify-between items-center p-3 rounded bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                      <div className="text-white font-medium">Staked Amount</div>
                      <div className="text-xs text-slate-400">1.5x multiplier on staked tokens</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">{votingPower.stakedPower.toLocaleString()}</div>
                </div>

                <div className="flex justify-between items-center p-3 rounded bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🤖</span>
                    <div>
                      <div className="text-white font-medium">Agent Power</div>
                      <div className="text-xs text-slate-400">500 VP per agent level</div>
                    </div>
                  </div>
                  <div className="text-purple-400 font-bold">{votingPower.agentPower.toLocaleString()}</div>
                </div>

                <div className="flex justify-between items-center p-3 rounded bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌍</span>
                    <div>
                      <div className="text-white font-medium">Territory Control</div>
                      <div className="text-xs text-slate-400">5,000 VP per owned system</div>
                    </div>
                  </div>
                  <div className="text-orange-400 font-bold">{votingPower.territoryPower.toLocaleString()}</div>
                </div>
              </div>

              {/* Increase Power Tip */}
              <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/30 text-sm">
                <div className="font-medium text-cyan-400 mb-1">💡 Increase Your Voting Power</div>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>• Acquire more GALACTIC tokens</li>
                  <li>• Stake tokens in yield farms (1.5x bonus)</li>
                  <li>• Level up your agents</li>
                  <li>• Claim more star systems</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernanceView;
