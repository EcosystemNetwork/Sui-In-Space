import React from 'react';
import type { WorldState } from '../../../hooks/useAIFleetsState';

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-mono text-white">{value}</span>
        {sub && <span className="text-xs text-slate-500 ml-1">{sub}</span>}
      </div>
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-700/60 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function fmtToken(amount: number, decimals = 0): string {
  if (amount === 0) return '0';
  const val = decimals > 0 ? amount / Math.pow(10, decimals) : amount;
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(2) + 'K';
  return decimals > 0 ? val.toFixed(2) : val.toLocaleString();
}

export const EconomyPanel: React.FC<{ world: WorldState }> = ({ world }) => {
  const { reactor, insurancePool, treasury, governance } = world;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Energy Reactor */}
      <div className="p-4 rounded-lg bg-slate-800/60 border border-yellow-500/30 space-y-3">
        <h3 className="text-sm font-semibold text-yellow-300">Energy Reactor (LP Pool)</h3>
        {reactor ? (
          <div className="space-y-1">
            <StatRow label="GALACTIC Reserve" value={fmtToken(reactor.galactic_reserve)} sub="GAL" />
            <StatRow label="SUI Reserve" value={fmtToken(reactor.sui_reserve, 9)} sub="SUI" />
            <StatRow label="Total LP Shares" value={reactor.total_lp_shares.toLocaleString()} />
            <div className="border-t border-slate-700/50 mt-2 pt-2">
              <StatRow label="Total Swaps" value={reactor.total_swaps.toLocaleString()} />
              <StatRow label="Volume (GALACTIC)" value={fmtToken(reactor.total_volume_galactic)} />
              <StatRow label="Volume (SUI)" value={fmtToken(reactor.total_volume_sui, 9)} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-block w-2 h-2 rounded-full ${reactor.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-slate-400">{reactor.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">Not created yet</div>
        )}
      </div>

      {/* Insurance Pool */}
      <div className="p-4 rounded-lg bg-slate-800/60 border border-blue-500/30 space-y-3">
        <h3 className="text-sm font-semibold text-blue-300">Insurance Pool</h3>
        {insurancePool ? (
          <div className="space-y-1">
            <StatRow label="Reserve" value={fmtToken(insurancePool.reserve)} sub="GAL" />
            <StatRow label="Total Insured" value={fmtToken(insurancePool.total_insured)} sub="GAL" />
            <StatRow label="Premiums Collected" value={fmtToken(insurancePool.total_premiums)} />
            <StatRow label="Total Claims" value={insurancePool.total_claims.toLocaleString()} />
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">Not created yet</div>
        )}
      </div>

      {/* Token Supply */}
      <div className="p-4 rounded-lg bg-slate-800/60 border border-cyan-500/30 space-y-3">
        <h3 className="text-sm font-semibold text-cyan-300">GALACTIC Token</h3>
        {treasury ? (
          <div className="space-y-2">
            <StatRow label="Total Minted" value={fmtToken(treasury.total_minted)} sub="GAL" />
            <StatRow label="Max Supply" value={fmtToken(treasury.max_supply / 1e9)} sub="GAL" />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Supply Used</span>
                <span className="text-slate-300">
                  {treasury.max_supply > 0 ? ((treasury.total_minted / (treasury.max_supply / 1e9)) * 100).toFixed(4) : '0'}%
                </span>
              </div>
              <Bar value={treasury.total_minted} max={treasury.max_supply / 1e9} color="bg-cyan-400" />
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">Loading...</div>
        )}
      </div>

      {/* Governance */}
      <div className="p-4 rounded-lg bg-slate-800/60 border border-purple-500/30 space-y-3">
        <h3 className="text-sm font-semibold text-purple-300">Governance</h3>
        {governance ? (
          <div className="space-y-1">
            <StatRow label="Treasury" value={fmtToken(governance.treasury_balance)} sub="GAL" />
            <StatRow label="Total Proposals" value={governance.total_proposals.toLocaleString()} />
            <StatRow label="Executed" value={governance.total_executed.toLocaleString()} />
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-4 text-center">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default EconomyPanel;
