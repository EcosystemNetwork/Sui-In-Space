import React, { useState } from 'react';
import { MissionType, MissionStatus } from '../../types';

/**
 * Missions View Component
 * Mission board with available quests and active missions
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

const MISSION_TYPE_COLORS: Record<MissionType, string> = {
  [MissionType.DataHeist]: 'cyan',
  [MissionType.Espionage]: 'purple',
  [MissionType.Smuggling]: 'yellow',
  [MissionType.AITraining]: 'blue',
  [MissionType.Combat]: 'red',
  [MissionType.Exploration]: 'green',
};

export const MissionsView: React.FC = () => {
  const [selectedMission, setSelectedMission] = useState<DemoMission | null>(null);
  const [filterType, setFilterType] = useState<MissionType | null>(null);

  const filteredMissions = filterType !== null
    ? AVAILABLE_MISSIONS.filter(m => m.type === filterType)
    : AVAILABLE_MISSIONS;

  const getDifficultyStars = (difficulty: number) => '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
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
        <div className="p-4 rounded-lg bg-slate-900/80 border border-green-500/30">
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
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${mission.progress}%` }}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">{AVAILABLE_MISSIONS.length}</div>
          <div className="text-xs text-slate-400">Available</div>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{ACTIVE_MISSIONS.length}</div>
          <div className="text-xs text-slate-400">In Progress</div>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">47</div>
          <div className="text-xs text-slate-400">Completed</div>
        </div>
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="text-2xl font-bold text-orange-400">92%</div>
          <div className="text-xs text-slate-400">Success Rate</div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
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
        {Object.entries(MISSION_TYPE_NAMES).map(([type, name]) => (
          <button
            key={type}
            onClick={() => setFilterType(Number(type) as MissionType)}
            className={`px-3 py-1.5 rounded text-xs ${
              filterType === Number(type)
                ? `bg-${MISSION_TYPE_COLORS[Number(type) as MissionType]}-500/30 text-${MISSION_TYPE_COLORS[Number(type) as MissionType]}-400 border border-${MISSION_TYPE_COLORS[Number(type) as MissionType]}-500/50`
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            {MISSION_TYPE_ICONS[Number(type) as MissionType]} {name}
          </button>
        ))}
      </div>

      {/* Available Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.map((mission) => {
          const color = MISSION_TYPE_COLORS[mission.type];
          return (
            <div
              key={mission.id}
              onClick={() => setSelectedMission(selectedMission?.id === mission.id ? null : mission)}
              className={`p-4 rounded-lg bg-slate-900/80 border cursor-pointer transition-all ${
                selectedMission?.id === mission.id
                  ? `border-${color}-400 shadow-lg shadow-${color}-400/20`
                  : 'border-slate-700 hover:border-slate-600'
              }`}
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
