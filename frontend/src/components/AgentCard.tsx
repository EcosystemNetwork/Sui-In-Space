import React from 'react';
import type { Agent, AgentClass, AgentType } from '../types';

/**
 * Agent Card Component
 * Displays agent information with holographic UI styling
 */

interface AgentCardProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
}

const CLASS_NAMES: Record<AgentClass, string> = {
  0: 'Hacker',
  1: 'Pilot',
  2: 'Mech Operator',
  3: 'Quantum Engineer',
  4: 'Psionic',
  5: 'Bounty AI',
};

const TYPE_NAMES: Record<AgentType, string> = {
  0: 'Human',
  1: 'Cyborg',
  2: 'Android',
  3: 'Alien Synthetic',
};

const CLASS_COLORS: Record<AgentClass, string> = {
  0: 'text-cyan-400',
  1: 'text-blue-400',
  2: 'text-orange-400',
  3: 'text-purple-400',
  4: 'text-pink-400',
  5: 'text-red-400',
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, isSelected, onClick }) => {
  const combatPower = Math.floor(
    (agent.stats.power * 3 + agent.stats.mobility * 2 + agent.stats.resilience * 2 + agent.stats.processing) / 8
  );

  return (
    <div
      className={`
        relative p-4 rounded-lg border cursor-pointer transition-all duration-300
        bg-gradient-to-br from-slate-900/90 to-slate-800/90
        ${isSelected 
          ? 'border-cyan-400 shadow-lg shadow-cyan-400/20' 
          : 'border-slate-700 hover:border-cyan-400/50'
        }
      `}
      onClick={onClick}
    >
      {/* Holographic corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{agent.name}</h3>
          <p className={`text-sm ${CLASS_COLORS[agent.class]}`}>
            {CLASS_NAMES[agent.class]}
          </p>
          <p className="text-xs text-slate-400">
            {TYPE_NAMES[agent.agentType]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyan-400">
            Lv.{agent.level}
          </div>
          <div className="text-xs text-slate-400">
            {agent.experience.toLocaleString()} XP
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatBar label="PRO" value={agent.stats.processing} color="cyan" />
        <StatBar label="MOB" value={agent.stats.mobility} color="blue" />
        <StatBar label="PWR" value={agent.stats.power} color="orange" />
        <StatBar label="RES" value={agent.stats.resilience} color="green" />
        <StatBar label="LCK" value={agent.stats.luck} color="yellow" />
        <StatBar label="NBW" value={agent.stats.neuralBandwidth} color="purple" />
      </div>

      {/* Combat Power */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-700">
        <span className="text-xs text-slate-400">Combat Power</span>
        <span className="text-lg font-bold text-orange-400">{combatPower}</span>
      </div>

      {/* Status Indicators */}
      <div className="flex gap-2 mt-2">
        {agent.isStaked && (
          <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/50">
            STAKED
          </span>
        )}
        {agent.currentMission && (
          <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/50">
            ON MISSION
          </span>
        )}
        {agent.augmentSlots.length > 0 && (
          <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400 border border-purple-500/50">
            {agent.augmentSlots.length} AUG
          </span>
        )}
      </div>
    </div>
  );
};

interface StatBarProps {
  label: string;
  value: number;
  color: 'cyan' | 'blue' | 'orange' | 'green' | 'yellow' | 'purple';
}

const STAT_COLORS = {
  cyan: 'bg-cyan-400',
  blue: 'bg-blue-400',
  orange: 'bg-orange-400',
  green: 'bg-green-400',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-400',
};

const StatBar: React.FC<StatBarProps> = ({ label, value, color }) => {
  const percentage = Math.min((value / 100) * 100, 100);
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-8">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${STAT_COLORS[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-white w-6 text-right">{value}</span>
    </div>
  );
};

export default AgentCard;
