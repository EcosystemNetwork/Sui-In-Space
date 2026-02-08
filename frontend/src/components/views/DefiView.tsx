import React, { useState, useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';
import { StationType } from '../../types';
import { useGameActions } from '../../hooks/useGameActions';
import { useGameStore } from '../../hooks/useGameStore';

/**
 * DeFi View Component
 * Staking, liquidity pools, yield farming (Station Hub)
 * Enhanced with anime.js animations
 */

interface DemoStation {
  id: string;
  name: string;
  type: StationType;
  level: number;
  totalStaked: number;
  apy: number;
  operators: number;
  maxOperators: number;
  efficiency: number;
  playerStake: number;
  pendingRewards: number;
}

interface DemoPool {
  id: string;
  name: string;
  token1: string;
  token2: string;
  tvl: number;
  apy: number;
  volume24h: number;
  fees24h: number;
  playerLP: number;
}

// Demo stations
const DEMO_STATIONS: DemoStation[] = [
  {
    id: '1',
    name: 'Alpha Yield Farm',
    type: StationType.YieldFarm,
    level: 5,
    totalStaked: 2500000,
    apy: 24.5,
    operators: 3,
    maxOperators: 5,
    efficiency: 115,
    playerStake: 50000,
    pendingRewards: 1247,
  },
  {
    id: '2',
    name: 'Quantum Research Lab',
    type: StationType.ResearchLab,
    level: 3,
    totalStaked: 1200000,
    apy: 18.2,
    operators: 2,
    maxOperators: 4,
    efficiency: 95,
    playerStake: 25000,
    pendingRewards: 456,
  },
  {
    id: '3',
    name: 'Shadow Market Hub',
    type: StationType.BlackMarket,
    level: 4,
    totalStaked: 3800000,
    apy: 35.8,
    operators: 4,
    maxOperators: 6,
    efficiency: 125,
    playerStake: 0,
    pendingRewards: 0,
  },
];

// Demo liquidity pools
const DEMO_POOLS: DemoPool[] = [
  {
    id: 'pool1',
    name: 'GALACTIC-SUI',
    token1: 'GALACTIC',
    token2: 'SUI',
    tvl: 8500000,
    apy: 45.2,
    volume24h: 1250000,
    fees24h: 3750,
    playerLP: 12500,
  },
  {
    id: 'pool2',
    name: 'GALACTIC-USDC',
    token1: 'GALACTIC',
    token2: 'USDC',
    tvl: 4200000,
    apy: 32.8,
    volume24h: 850000,
    fees24h: 2550,
    playerLP: 0,
  },
];

const STATION_ICONS: Record<StationType, string> = {
  [StationType.YieldFarm]: '🌾',
  [StationType.ResearchLab]: '🔬',
  [StationType.BlackMarket]: '🏴‍☠️',
  [StationType.WarpGate]: '🌀',
  [StationType.DefensePlatform]: '🛡️',
};

const STATION_NAMES: Record<StationType, string> = {
  [StationType.YieldFarm]: 'Yield Farm',
  [StationType.ResearchLab]: 'Research Lab',
  [StationType.BlackMarket]: 'Black Market',
  [StationType.WarpGate]: 'Warp Gate',
  [StationType.DefensePlatform]: 'Defense Platform',
};

export const DefiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stations' | 'pools' | 'swap'>('stations');
  const [selectedStation, setSelectedStation] = useState<DemoStation | null>(null);
  const { stake, unstake, claimYield, addLiquidity, removeLiquidity, swap } = useGameActions();
  const player = useGameStore((s) => s.player);

  // Build display stations from game store data, fall back to demo if empty
  const storeStations: DemoStation[] = (player?.stations ?? []).map((st) => ({
    id: st.id,
    name: st.name,
    type: st.stationType,
    level: st.level,
    totalStaked: Number(st.totalStaked),
    apy: st.yieldRate / 10,
    operators: st.operators.length,
    maxOperators: st.maxOperators,
    efficiency: st.efficiency,
    playerStake: 0,
    pendingRewards: 0,
  }));

  const displayStations = storeStations.length > 0 ? storeStations : DEMO_STATIONS;

  const totalStakedByPlayer = displayStations.reduce((sum, s) => sum + s.playerStake, 0);
  const totalPendingRewards = displayStations.reduce((sum, s) => sum + s.pendingRewards, 0);
  const totalLPValue = DEMO_POOLS.reduce((sum, p) => sum + p.playerLP, 0);

  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initial entrance animations
  useEffect(() => {
    if (headerRef.current) {
      animate(headerRef.current, {
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        ease: 'outCubic',
      });
    }

    if (statsRef.current) {
      const statCards = statsRef.current.querySelectorAll('.stat-card');
      animate(statCards, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: stagger(80, { start: 200 }),
        ease: 'outCubic',
      });
    }
  }, []);

  // Animate content when tab changes
  useEffect(() => {
    if (contentRef.current) {
      animate(contentRef.current, {
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 500,
        ease: 'outCubic',
      });

      const items = contentRef.current.querySelectorAll('.animated-item');
      animate(items, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        delay: stagger(80, { start: 200 }),
        ease: 'outCubic',
      });
    }
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-green-400">⚡</span>
          DeFi Station Hub
        </h2>
        <div className="flex gap-2">
          {['stations', 'pools', 'swap'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'stations' | 'pools' | 'swap')}
              className={`px-3 py-1.5 rounded text-sm capitalize ${activeTab === tab
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card p-3 rounded-lg bg-green-500/10 border border-green-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-green-400">${(totalStakedByPlayer / 1000).toFixed(1)}K</div>
          <div className="text-xs text-slate-400">Your Total Staked</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-cyan-400">{totalPendingRewards.toLocaleString()}</div>
          <div className="text-xs text-slate-400">Pending Rewards</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-purple-500/10 border border-purple-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-purple-400">${(totalLPValue / 1000).toFixed(1)}K</div>
          <div className="text-xs text-slate-400">LP Position Value</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-orange-500/10 border border-orange-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-orange-400">$12.4M</div>
          <div className="text-xs text-slate-400">Protocol TVL</div>
        </div>
      </div>

      {/* Claim All Button */}
      {totalPendingRewards > 0 && (
        <div className="flex justify-end">
          <button onClick={() => claimYield()} className="px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-bold">
            🎁 Claim All Rewards ({totalPendingRewards.toLocaleString()} GALACTIC)
          </button>
        </div>
      )}

      {activeTab === 'stations' && (
        <div ref={contentRef} style={{ opacity: 0 }}>
          {/* Stations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayStations.map((station) => (
              <div
                key={station.id}
                onClick={() => setSelectedStation(selectedStation?.id === station.id ? null : station)}
                className={`animated-item p-4 rounded-lg bg-slate-900/80 border cursor-pointer ${selectedStation?.id === station.id
                  ? 'border-green-400 shadow-lg shadow-green-400/20'
                  : 'border-slate-700 hover:border-slate-600'
                  }`}
                style={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{STATION_ICONS[station.type]}</span>
                    <div>
                      <h3 className="font-bold text-white">{station.name}</h3>
                      <p className="text-xs text-slate-400">{STATION_NAMES[station.type]} • Lv.{station.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{station.apy}%</div>
                    <div className="text-xs text-slate-400">APY</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">TVL</span>
                    <span className="text-white">${(station.totalStaked / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Efficiency</span>
                    <span className={station.efficiency >= 100 ? 'text-green-400' : 'text-yellow-400'}>
                      {station.efficiency}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operators</span>
                    <span className="text-white">{station.operators}/{station.maxOperators}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Your Stake</span>
                    <span className="text-cyan-400">${station.playerStake.toLocaleString()}</span>
                  </div>
                </div>

                {/* Pending Rewards */}
                {station.pendingRewards > 0 && (
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/30 text-center mb-3">
                    <span className="text-xs text-slate-400">Pending: </span>
                    <span className="text-green-400 font-bold">{station.pendingRewards.toLocaleString()} GALACTIC</span>
                  </div>
                )}

                {/* Expanded Actions */}
                {selectedStation?.id === station.id && (
                  <div className="pt-3 border-t border-slate-700 flex gap-2">
                    <button onClick={() => stake(1000)} className="flex-1 px-3 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-xs">
                      Stake
                    </button>
                    <button onClick={() => unstake(1000)} className="flex-1 px-3 py-2 rounded bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition-colors text-xs">
                      Unstake
                    </button>
                    {station.pendingRewards > 0 && (
                      <button onClick={() => claimYield()} className="flex-1 px-3 py-2 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-xs">
                        Claim
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pools' && (
        <div ref={contentRef} style={{ opacity: 0 }}>
          {/* Energy Reactor (Liquidity Pools) */}
          <div className="animated-item p-4 rounded-lg bg-slate-900/80 border border-slate-700" style={{ opacity: 0 }}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              ⚛️ Energy Reactors (Liquidity Pools)
            </h3>

            <div className="space-y-3">
              {DEMO_POOLS.map((pool) => (
                <div
                  key={pool.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-slate-800 flex items-center justify-center text-xs">💎</div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-slate-800 flex items-center justify-center text-xs">🔵</div>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{pool.name}</h4>
                        <p className="text-xs text-slate-400">{pool.token1} / {pool.token2}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-white font-bold">${(pool.tvl / 1000000).toFixed(2)}M</div>
                        <div className="text-xs text-slate-400">TVL</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">{pool.apy}%</div>
                        <div className="text-xs text-slate-400">APY</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">${(pool.volume24h / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-slate-400">24h Vol</div>
                      </div>
                      <div className="text-right">
                        <div className="text-cyan-400">${pool.playerLP > 0 ? pool.playerLP.toLocaleString() : '-'}</div>
                        <div className="text-xs text-slate-400">Your LP</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => addLiquidity(1000)} className="px-3 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-xs">
                        Add Liquidity
                      </button>
                      {pool.playerLP > 0 && (
                        <button onClick={() => removeLiquidity(1000)} className="px-3 py-2 rounded bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition-colors text-xs">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'swap' && (
        <div ref={contentRef} style={{ opacity: 0 }}>
          {/* Token Swap */}
          <div className="animated-item max-w-md mx-auto" style={{ opacity: 0 }}>
            <div className="p-6 rounded-lg bg-slate-900/80 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 text-center">⚡ Energy Swap</h3>

              {/* From Token */}
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 mb-2">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>From</span>
                  <span>Balance: 125,000</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-2xl text-white outline-none"
                  />
                  <button className="flex items-center gap-2 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors">
                    <span>💎</span>
                    <span className="text-white">GALACTIC</span>
                    <span className="text-slate-400">▼</span>
                  </button>
                </div>
              </div>

              {/* Swap Direction */}
              <div className="flex justify-center -my-3 relative z-10">
                <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 transition-colors">
                  ↕️
                </button>
              </div>

              {/* To Token */}
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>To</span>
                  <span>Balance: 50.25</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.0"
                    disabled
                    className="flex-1 bg-transparent text-2xl text-white outline-none"
                  />
                  <button className="flex items-center gap-2 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors">
                    <span>🔵</span>
                    <span className="text-white">SUI</span>
                    <span className="text-slate-400">▼</span>
                  </button>
                </div>
              </div>

              {/* Swap Info */}
              <div className="mt-4 p-3 rounded bg-slate-800/30 text-xs">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Exchange Rate</span>
                  <span className="text-white">1 GALACTIC = 0.00042 SUI</span>
                </div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Slippage Tolerance</span>
                  <span className="text-white">0.5%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Protocol Fee</span>
                  <span className="text-white">0.3%</span>
                </div>
              </div>

              {/* Swap Button */}
              <button onClick={() => swap('GALACTIC', 'SUI', 1000)} className="w-full mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500/30 to-cyan-500/30 border border-green-400/50 text-white hover:from-green-500/50 hover:to-cyan-500/50 transition-all font-bold">
                ⚡ Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefiView;
