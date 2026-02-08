import React, { useState, useEffect, useRef } from 'react';
import { useAgentActivity, type ActivityEntry } from '../../../hooks/useAgentActivity';

function AgentBadge({ agent }: { agent: string }) {
  const isCyan = agent === 'NEXUS-7';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
      isCyan ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {agent}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
      {phase}
    </span>
  );
}

function StatusDot({ success }: { success: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${success ? 'bg-green-400' : 'bg-red-400'}`} />
  );
}

function EntryCard({ entry }: { entry: ActivityEntry }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <StatusDot success={entry.success} />
        <AgentBadge agent={entry.agent} />
        <PhaseBadge phase={entry.phase} />
        <span className="text-xs text-slate-500 font-mono ml-auto">{time}</span>
      </div>

      <div className="text-sm text-slate-300">
        <span className="font-semibold text-slate-200">{entry.action}</span>
        {' — '}
        {entry.description}
      </div>

      {entry.reasoning && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          {expanded ? 'Hide reasoning' : 'Show reasoning'}
        </button>
      )}

      {expanded && entry.reasoning && (
        <div className="text-xs text-slate-400 italic bg-slate-900/50 rounded p-2">
          "{entry.reasoning}"
        </div>
      )}

      {entry.txDigest && (
        <a
          href={`https://suiscan.xyz/testnet/tx/${entry.txDigest}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
        >
          View transaction
        </a>
      )}
    </div>
  );
}

type AgentFilter = 'all' | 'NEXUS-7' | 'KRAIT-X';

export const ActivityFeed: React.FC = () => {
  const { entries, loading, lastUpdated } = useAgentActivity();
  const [filter, setFilter] = useState<AgentFilter>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.agent === filter);

  // Auto-scroll to top when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {(['all', 'NEXUS-7', 'KRAIT-X'] as AgentFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              filter === f
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-300'
            }`}
          >
            {f === 'all' ? 'All Agents' : f}
          </button>
        ))}
        {lastUpdated && (
          <span className="text-xs text-slate-500 ml-auto">
            {filtered.length} entries
          </span>
        )}
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No activity yet. Run <code className="text-cyan-400">pnpm agents</code> to start.
          </div>
        ) : (
          filtered.map((entry, i) => <EntryCard key={`${entry.timestamp}-${i}`} entry={entry} />)
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
