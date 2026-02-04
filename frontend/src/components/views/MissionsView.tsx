import React, { useState, useRef, useEffect } from 'react';
import anime from 'animejs';
import { MissionType, MissionStatus } from '../../types';

/**
 * Missions View Component
 * Mission board with available quests and active missions
 * Enhanced with anime.js animations
 */

interface DemoMission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  difficulty: number;
  duration: string;
  requirements: {
    minLevel: number;
    minProcessing?: number;
    minMobility?: number;
    minPower?: number;
  };
  rewards: {
    galactic: number;
    experience: number;
    lootChance: number;
  };
  successRate: number;
  timesCompleted: number;
}

interface ActiveMission {
  id: string;
  missionName: string;
  agentName: string;
  progress: number;
  timeRemaining: string;
  status: MissionStatus;
}

// Demo available missions
const AVAILABLE_MISSIONS: DemoMission[] = [
  {
    id: '1',
    name: 'Corporate Data Heist',
    description: 'Infiltrate Megacorp servers and extract classified intel',
    type: MissionType.DataHeist,
    difficulty: 2,
    duration: '4 hours',
    requirements: { minLevel: 5, minProcessing: 30 },
    rewards: { galactic: 5000, experience: 200, lootChance: 15 },
    successRate: 78,
    timesCompleted: 1247,
  },
  {
    id: '2',
    name: 'Deep Space Reconnaissance',
    description: 'Scout the unknown regions beyond Sector 12',
    type: MissionType.Exploration,
    difficulty: 1,
    duration: '2 hours',
    requirements: { minLevel: 1, minMobility: 20 },
    rewards: { galactic: 2000, experience: 100, lootChance: 25 },
    successRate: 92,
    timesCompleted: 5621,
  },
  {
    id: '3',
    name: 'Rogue AI Elimination',
    description: 'Destroy a corrupted AI construct threatening trade routes',
    type: MissionType.Combat,
    difficulty: 3,
    duration: '6 hours',
    requirements: { minLevel: 10, minPower: 40 },
    rewards: { galactic: 12000, experience: 500, lootChance: 30 },
    successRate: 65,
    timesCompleted: 892,
  },
  {
    id: '4',
    name: 'Black Market Delivery',
    description: 'Transport sensitive cargo through hostile territory',
    type: MissionType.Smuggling,
    difficulty: 2,
    duration: '3 hours',
    requirements: { minLevel: 8, minMobility: 35 },
    rewards: { galactic: 8000, experience: 300, lootChance: 20 },
    successRate: 72,
    timesCompleted: 2341,
  },
  {
    id: '5',
    name: 'Neural Network Training',
    description: 'Run complex AI simulations to improve capabilities',
    type: MissionType.AITraining,
    difficulty: 2,
    duration: '8 hours',
    requirements: { minLevel: 12, minProcessing: 45 },
    rewards: { galactic: 3000, experience: 800, lootChance: 10 },
    successRate: 88,
    timesCompleted: 1578,
  },
  {
    id: '6',
    name: 'Faction Infiltration',
    description: 'Gather intelligence on rival faction operations',
    type: MissionType.Espionage,
    difficulty: 4,
    duration: '12 hours',
    requirements: { minLevel: 18, minProcessing: 50, minMobility: 40 },
    rewards: { galactic: 25000, experience: 1200, lootChance: 40 },
    successRate: 55,
    timesCompleted: 234,
  },
];

// Demo active missions
const ACTIVE_MISSIONS: ActiveMission[] = [
  {
    id: 'active1',
    missionName: 'Corporate Data Heist',
    agentName: 'Titan-9',
    progress: 67,
    timeRemaining: '1h 23m',
    status: MissionStatus.Active,
  },
];

const MISSION_TYPE_ICONS: Record<MissionType, string> = {
  [MissionType.DataHeist]: '💻',
  [MissionType.Espionage]: '🕵️',
  [MissionType.Smuggling]: '📦',
  [MissionType.AITraining]: '🧠',
  [MissionType.Combat]: '⚔️',
  [MissionType.Exploration]: '🔭',
};

const MISSION_TYPE_NAMES: Record<MissionType, string> = {
  [MissionType.DataHeist]: 'Data Heist',
  [MissionType.Espionage]: 'Espionage',
  [MissionType.Smuggling]: 'Smuggling',
  [MissionType.AITraining]: 'AI Training',
  [MissionType.Combat]: 'Combat',
  [MissionType.Exploration]: 'Exploration',
};

// Pre-defined complete class strings for Tailwind JIT
const MISSION_BUTTON_ACTIVE_CLASSES: Record<MissionType, string> = {
  [MissionType.DataHeist]: 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50',
  [MissionType.Espionage]: 'bg-purple-500/30 text-purple-400 border border-purple-500/50',
  [MissionType.Smuggling]: 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50',
  [MissionType.AITraining]: 'bg-blue-500/30 text-blue-400 border border-blue-500/50',
  [MissionType.Combat]: 'bg-red-500/30 text-red-400 border border-red-500/50',
  [MissionType.Exploration]: 'bg-green-500/30 text-green-400 border border-green-500/50',
};

const MISSION_CARD_SELECTED_CLASSES: Record<MissionType, string> = {
  [MissionType.DataHeist]: 'border-cyan-400 shadow-lg shadow-cyan-400/20',
  [MissionType.Espionage]: 'border-purple-400 shadow-lg shadow-purple-400/20',
  [MissionType.Smuggling]: 'border-yellow-400 shadow-lg shadow-yellow-400/20',
  [MissionType.AITraining]: 'border-blue-400 shadow-lg shadow-blue-400/20',
  [MissionType.Combat]: 'border-red-400 shadow-lg shadow-red-400/20',
  [MissionType.Exploration]: 'border-green-400 shadow-lg shadow-green-400/20',
};

export const MissionsView: React.FC = () => {
  const [selectedMission, setSelectedMission] = useState<DemoMission | null>(null);
  const [filterType, setFilterType] = useState<MissionType | null>(null);

  const filteredMissions = filterType !== null
    ? AVAILABLE_MISSIONS.filter(m => m.type === filterType)
    : AVAILABLE_MISSIONS;

  const getDifficultyStars = (difficulty: number) => '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  
  const headerRef = useRef<HTMLDivElement>(null);
  const activeMissionsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Initial entrance animations
  useEffect(() => {
    if (headerRef.current) {
      anime({
        targets: headerRef.current,
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutCubic',
      });
    }
    
    if (activeMissionsRef.current) {
      anime({
        targets: activeMissionsRef.current,
        translateX: [-30, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 200,
        easing: 'easeOutCubic',
      });
      
      // Animate progress bar
      const progressBar = activeMissionsRef.current.querySelector('.progress-bar-fill');
      if (progressBar) {
        anime({
          targets: progressBar,
          width: ['0%', '67%'],
          duration: 1200,
          delay: 400,
          easing: 'easeOutCubic',
        });
      }
    }
    
    if (statsRef.current) {
      const statCards = statsRef.current.querySelectorAll('.stat-card');
      anime({
        targets: statCards,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(80, { start: 300 }),
        easing: 'easeOutCubic',
      });
    }
    
    if (filterRef.current) {
      const buttons = filterRef.current.querySelectorAll('button');
      anime({
        targets: buttons,
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(50, { start: 500 }),
        easing: 'easeOutCubic',
      });
    }
  }, []);
  
  // Animate grid when filter changes
  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.mission-card');
      anime({
        targets: cards,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(80),
        easing: 'easeOutCubic',
      });
    }
  }, [filterType]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-400">📜</span>
          Mission Board
        </h2>
        <div className="text-sm text-slate-400">
          <span className="text-green-400">{ACTIVE_MISSIONS.length}</span> Active Missions
        </div>
      </div>

      {/* Active Missions */}
      {ACTIVE_MISSIONS.length > 0 && (
        <div ref={activeMissionsRef} className="p-4 rounded-lg bg-slate-900/80 border border-green-500/30" style={{ opacity: 0 }}>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-green-400">▶</span>
            Active Missions
          </h3>
          <div className="space-y-3">
            {ACTIVE_MISSIONS.map((mission) => (
              <div
                key={mission.id}
                className="p-3 rounded-lg bg-slate-800/50 border border-green-500/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-white">{mission.missionName}</h4>
                    <p className="text-xs text-slate-400">Agent: {mission.agentName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-400">{mission.timeRemaining}</div>
                    <div className="text-xs text-slate-400">remaining</div>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="progress-bar-fill h-full bg-green-500 rounded-full"
                    style={{ width: '0%' }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                  <span>Progress: {mission.progress}%</span>
                  <button className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    Abort
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mission Stats */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-yellow-400">{AVAILABLE_MISSIONS.length}</div>
          <div className="text-xs text-slate-400">Available</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-green-500/10 border border-green-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-green-400">{ACTIVE_MISSIONS.length}</div>
          <div className="text-xs text-slate-400">In Progress</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-cyan-400">47</div>
          <div className="text-xs text-slate-400">Completed</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-orange-500/10 border border-orange-500/30" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-orange-400">92%</div>
          <div className="text-xs text-slate-400">Success Rate</div>
        </div>
      </div>

      {/* Type Filter */}
      <div ref={filterRef} className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType(null)}
          className={`px-3 py-1.5 rounded text-xs ${
            filterType === null
              ? 'bg-slate-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
          }`}
        >
          All Types
        </button>
        {Object.entries(MISSION_TYPE_NAMES).map(([type, name]) => {
          const missionType = Number(type) as MissionType;
          return (
            <button
              key={type}
              onClick={() => setFilterType(missionType)}
              className={`px-3 py-1.5 rounded text-xs ${
                filterType === missionType
                  ? MISSION_BUTTON_ACTIVE_CLASSES[missionType]
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              {MISSION_TYPE_ICONS[missionType]} {name}
            </button>
          );
        })}
      </div>

      {/* Available Missions Grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.map((mission) => {
          return (
            <div
              key={mission.id}
              onClick={() => setSelectedMission(selectedMission?.id === mission.id ? null : mission)}
              className={`mission-card p-4 rounded-lg bg-slate-900/80 border cursor-pointer ${
                selectedMission?.id === mission.id
                  ? MISSION_CARD_SELECTED_CLASSES[mission.type]
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              style={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{MISSION_TYPE_ICONS[mission.type]}</span>
                  <div>
                    <h3 className="font-bold text-white">{mission.name}</h3>
                    <p className="text-xs text-slate-400">{MISSION_TYPE_NAMES[mission.type]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 text-sm">{getDifficultyStars(mission.difficulty)}</div>
                  <div className="text-xs text-slate-400">{mission.duration}</div>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-3">{mission.description}</p>

              {/* Requirements */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-0.5 text-xs rounded bg-slate-700/50 text-slate-300">
                  Lv.{mission.requirements.minLevel}+
                </span>
                {mission.requirements.minProcessing && (
                  <span className="px-2 py-0.5 text-xs rounded bg-cyan-500/20 text-cyan-400">
                    PRO {mission.requirements.minProcessing}+
                  </span>
                )}
                {mission.requirements.minMobility && (
                  <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">
                    MOB {mission.requirements.minMobility}+
                  </span>
                )}
                {mission.requirements.minPower && (
                  <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400">
                    PWR {mission.requirements.minPower}+
                  </span>
                )}
              </div>

              {/* Rewards */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                <div className="flex gap-4 text-sm">
                  <span className="text-cyan-400">💎 {mission.rewards.galactic.toLocaleString()}</span>
                  <span className="text-green-400">⭐ {mission.rewards.experience} XP</span>
                  <span className="text-purple-400">🎁 {mission.rewards.lootChance}%</span>
                </div>
                <div className="text-xs text-slate-400">
                  {mission.successRate}% success
                </div>
              </div>

              {/* Expanded Actions */}
              {selectedMission?.id === mission.id && (
                <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
                  <div className="text-xs text-slate-400">
                    Completed {mission.timesCompleted.toLocaleString()} times
                  </div>
                  <button className="px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                    🚀 Start Mission
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionsView;
