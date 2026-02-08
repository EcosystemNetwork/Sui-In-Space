import React, { useState, useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';
import { AgentCard } from '../AgentCard';
import type { Agent } from '../../types';
import { AgentClass } from '../../types';
import { useGameActions } from '../../hooks/useGameActions';
import { useGameStore } from '../../hooks/useGameStore';

/**
 * Agents View Component
 * Agent roster, upgrades, augmentations (Barracks)
 * Enhanced with anime.js animations
 */


const AGENT_CLASSES = [
  { class: AgentClass.Hacker, name: 'Hacker', icon: '💻', description: 'Information warfare specialist' },
  { class: AgentClass.Pilot, name: 'Pilot', icon: '🎮', description: 'Expert ship operator' },
  { class: AgentClass.MechOperator, name: 'Mech Operator', icon: '🦾', description: 'Heavy combat specialist' },
  { class: AgentClass.QuantumEngineer, name: 'Quantum Engineer', icon: '⚛️', description: 'Tech & repair expert' },
  { class: AgentClass.Psionic, name: 'Psionic', icon: '🔮', description: 'Mental ability master' },
  { class: AgentClass.BountyAI, name: 'Bounty AI', icon: '🎯', description: 'Autonomous hunter' },
];

export const AgentsView: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [viewMode, setViewMode] = useState<'roster' | 'recruit'>('roster');
  const [filterClass, setFilterClass] = useState<AgentClass | null>(null);
  const { mintAgent, trainAgent, stakeAgent, unstakeAgent, startMission } = useGameActions();
  const player = useGameStore((s) => s.player);
  const agents = player?.agents ?? [];

  const filteredAgents = filterClass !== null
    ? agents.filter(a => a.class === filterClass)
    : agents;

  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

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

    if (filterRef.current) {
      const buttons = filterRef.current.querySelectorAll('button');
      animate(buttons, {
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 400,
        delay: stagger(50, { start: 400 }),
        ease: 'outCubic',
      });
    }
  }, [viewMode]);

  // Animate grid when filter changes
  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.agent-card-wrapper');
      animate(cards, {
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 500,
        delay: stagger(80),
        ease: 'outCubic',
      });
    }
  }, [filterClass, viewMode]);

  // Animate actions panel
  useEffect(() => {
    if (actionsRef.current && selectedAgent) {
      animate(actionsRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outCubic',
      });
    }
  }, [selectedAgent]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">🤖</span>
          Agent Barracks
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('roster')}
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'roster'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
          >
            My Agents
          </button>
          <button
            onClick={() => setViewMode('recruit')}
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'recruit'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
          >
            Recruit
          </button>
        </div>
      </div>

      {viewMode === 'roster' ? (
        <>
          {/* Agent Stats */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-card p-3 rounded-lg bg-purple-500/10 border border-purple-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-purple-400">{agents.length}</div>
              <div className="text-xs text-slate-400">Total Agents</div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-green-500/10 border border-green-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-green-400">{agents.filter(a => a.isStaked).length}</div>
              <div className="text-xs text-slate-400">Staked</div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-blue-500/10 border border-blue-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-blue-400">{agents.filter(a => a.currentMission).length}</div>
              <div className="text-xs text-slate-400">On Mission</div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-orange-500/10 border border-orange-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-orange-400">
                {agents.length > 0 ? Math.floor(agents.reduce((sum, a) => sum + a.level, 0) / agents.length) : 0}
              </div>
              <div className="text-xs text-slate-400">Avg Level</div>
            </div>
          </div>

          {/* Class Filter */}
          <div ref={filterRef} className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterClass(null)}
              className={`px-3 py-1.5 rounded text-xs ${filterClass === null
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
                }`}
            >
              All Classes
            </button>
            {AGENT_CLASSES.map((cls) => (
              <button
                key={cls.class}
                onClick={() => setFilterClass(cls.class)}
                className={`px-3 py-1.5 rounded text-xs ${filterClass === cls.class
                    ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
              >
                {cls.icon} {cls.name}
              </button>
            ))}
          </div>

          {/* Agent Grid */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="agent-card-wrapper" style={{ opacity: 0 }}>
                <AgentCard
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onClick={() => setSelectedAgent(agent)}
                />
              </div>
            ))}
          </div>

          {/* Selected Agent Actions */}
          {selectedAgent && (
            <div ref={actionsRef} className="p-4 rounded-lg bg-slate-900/80 border border-purple-500/30" style={{ opacity: 0 }}>
              <h3 className="text-lg font-bold text-white mb-3">Agent Actions: {selectedAgent.name}</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => trainAgent(selectedAgent.id)} className="px-4 py-2 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm">
                  ⬆️ Level Up
                </button>
                <button onClick={() => trainAgent(selectedAgent.id)} className="px-4 py-2 rounded bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm">
                  🔧 Augment
                </button>
                <button onClick={() => startMission(selectedAgent.id)} className="px-4 py-2 rounded bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
                  🚀 Assign to Ship
                </button>
                <button onClick={() => selectedAgent.isStaked ? unstakeAgent(selectedAgent.id) : stakeAgent(selectedAgent.id)} className="px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                  {selectedAgent.isStaked ? '📤 Unstake' : '📥 Stake'}
                </button>
                <button onClick={() => startMission(selectedAgent.id)} className="px-4 py-2 rounded bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm">
                  📜 Send on Mission
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Recruitment Center */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recruit New Agent</h3>
              <div className="text-sm text-slate-400">
                Your Balance: <span className="text-cyan-400 font-bold">125,000</span> GALACTIC
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AGENT_CLASSES.map((cls) => (
                <div
                  key={cls.class}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{cls.icon}</span>
                    <div>
                      <h4 className="font-bold text-white">{cls.name}</h4>
                      <p className="text-xs text-slate-400">{cls.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    Random stats based on class affinity
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <div className="text-sm">
                      <span className="text-slate-400">Cost: </span>
                      <span className="text-cyan-400 font-bold">10,000</span>
                    </div>
                    <button onClick={() => mintAgent(cls.name)} className="px-3 py-1 rounded bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-colors text-xs">
                      Recruit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Random Recruitment */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">🎲 Mystery Recruitment</h3>
                <p className="text-sm text-slate-400">Random class with chance for rare traits and higher base stats</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400 mb-1">Cost: <span className="text-cyan-400 font-bold">25,000</span></div>
                <button onClick={() => mintAgent()} className="px-4 py-2 rounded bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border border-purple-400/50 text-white hover:from-purple-500/50 hover:to-cyan-500/50 transition-all text-sm font-bold">
                  🎰 Roll for Agent
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentsView;
