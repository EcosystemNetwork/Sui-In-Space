import React, { useRef, useEffect } from 'react';
import anime from 'animejs';
import type { Agent, AgentClass, AgentType } from '../types';

/**
 * Agent Card Component
 * Displays agent information with holographic UI styling
 * Enhanced with anime.js animations and futuristic sci-fi HUD design
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
  0: 'text-[#00f0ff]',
  1: 'text-[#0080ff]',
  2: 'text-[#ff9500]',
  3: 'text-[#bf5af2]',
  4: 'text-[#ff2d55]',
  5: 'text-[#ff2d55]',
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, isSelected, onClick }) => {
  const combatPower = Math.floor(
    (agent.stats.power * 3 + agent.stats.mobility * 2 + agent.stats.resilience * 2 + agent.stats.processing) / 8
  );
  
  const cardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<HTMLDivElement[]>([]);
  
  // Animate stat bars on mount
  useEffect(() => {
    if (statsRef.current) {
      const bars = statsRef.current.querySelectorAll('.stat-bar-fill');
      anime({
        targets: bars,
        width: (el: Element) => el.getAttribute('data-width') || '0%',
        duration: 800,
        delay: anime.stagger(100, { start: 200 }),
        easing: 'easeOutCubic',
      });
    }
  }, []);
  
  // Animate selection state
  useEffect(() => {
    if (cardRef.current) {
      if (isSelected) {
        anime({
          targets: cardRef.current,
          scale: [1, 1.02],
          duration: 200,
          easing: 'easeOutCubic',
        });
        anime({
          targets: cornersRef.current,
          borderColor: ['rgba(0, 240, 255, 0.5)', 'rgba(0, 240, 255, 1)'],
          duration: 300,
          easing: 'easeOutCubic',
        });
      } else {
        anime({
          targets: cardRef.current,
          scale: 1,
          duration: 200,
          easing: 'easeOutCubic',
        });
      }
    }
  }, [isSelected]);
  
  const handleMouseEnter = () => {
    if (cardRef.current && !isSelected) {
      anime({
        targets: cardRef.current,
        translateY: -4,
        duration: 200,
        easing: 'easeOutCubic',
      });
    }
  };
  
  const handleMouseLeave = () => {
    if (cardRef.current && !isSelected) {
      anime({
        targets: cardRef.current,
        translateY: 0,
        duration: 200,
        easing: 'easeOutCubic',
      });
    }
  };
  
  const handleClick = () => {
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        scale: [1, 0.98, 1.02],
        duration: 200,
        easing: 'easeInOutQuad',
      });
    }
    onClick?.();
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative p-4 rounded-lg border cursor-pointer
        bg-gradient-to-br from-[#001020]/95 to-[#000a14]/90
        ${isSelected 
          ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.3)]' 
          : 'border-[#00f0ff]/30 hover:border-[#00f0ff]/60'
        }
        transition-all duration-300
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* HUD corner accents */}
      <div ref={el => { if (el) cornersRef.current[0] = el; }} className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00f0ff]/60 rounded-tl" />
      <div ref={el => { if (el) cornersRef.current[1] = el; }} className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff]/60 rounded-tr" />
      <div ref={el => { if (el) cornersRef.current[2] = el; }} className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00f0ff]/60 rounded-bl" />
      <div ref={el => { if (el) cornersRef.current[3] = el; }} className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00f0ff]/60 rounded-br" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-display font-bold text-[#e0f7ff]">{agent.name}</h3>
          <p className={`text-sm font-semibold ${CLASS_COLORS[agent.class]}`}>
            {CLASS_NAMES[agent.class]}
          </p>
          <p className="text-xs text-[#00f0ff]/50 font-mono">
            {TYPE_NAMES[agent.agentType]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-bold text-[#00f0ff]">
            Lv.{agent.level}
          </div>
          <div className="text-xs text-[#00f0ff]/50 font-mono">
            {agent.experience.toLocaleString()} XP
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-2 gap-2 mb-3">
        <StatBar label="PRO" value={agent.stats.processing} color="cyan" />
        <StatBar label="MOB" value={agent.stats.mobility} color="blue" />
        <StatBar label="PWR" value={agent.stats.power} color="orange" />
        <StatBar label="RES" value={agent.stats.resilience} color="green" />
        <StatBar label="LCK" value={agent.stats.luck} color="yellow" />
        <StatBar label="NBW" value={agent.stats.neuralBandwidth} color="purple" />
      </div>

      {/* Combat Power */}
      <div className="flex justify-between items-center pt-2 border-t border-[#00f0ff]/20">
        <span className="text-xs text-[#00f0ff]/50 font-mono">COMBAT POWER</span>
        <span className="text-lg font-display font-bold text-[#ff9500]">{combatPower}</span>
      </div>

      {/* Status Indicators */}
      <div className="flex gap-2 mt-2">
        {agent.isStaked && (
          <span className="px-2 py-0.5 text-xs rounded bg-[#00ff9d]/10 text-[#00ff9d] border border-[#00ff9d]/50 font-mono">
            STAKED
          </span>
        )}
        {agent.currentMission && (
          <span className="px-2 py-0.5 text-xs rounded bg-[#0080ff]/10 text-[#0080ff] border border-[#0080ff]/50 font-mono">
            ON MISSION
          </span>
        )}
        {agent.augmentSlots.length > 0 && (
          <span className="px-2 py-0.5 text-xs rounded bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/50 font-mono">
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
  cyan: 'bg-[#00f0ff]',
  blue: 'bg-[#0080ff]',
  orange: 'bg-[#ff9500]',
  green: 'bg-[#00ff9d]',
  yellow: 'bg-[#ffd60a]',
  purple: 'bg-[#bf5af2]',
};

const StatBar: React.FC<StatBarProps> = ({ label, value, color }) => {
  const percentage = Math.min((value / 100) * 100, 100);
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#00f0ff]/50 w-8 font-mono">{label}</span>
      <div className="flex-1 h-1.5 bg-[#001a30] rounded-full overflow-hidden border border-[#00f0ff]/20">
        <div 
          className={`stat-bar-fill h-full ${STAT_COLORS[color]} rounded-full`}
          style={{ width: '0%' }}
          data-width={`${percentage}%`}
        />
      </div>
      <span className="text-xs text-[#e0f7ff] w-6 text-right font-display font-bold">{value}</span>
    </div>
  );
};

export default AgentCard;
