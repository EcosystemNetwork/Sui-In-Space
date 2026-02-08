import React from 'react';
import {
  PLANET_TYPE_NAMES,
  RESOURCE_TYPE_NAMES,
  MISSION_TYPE_NAMES,
  AI_AGENT_ADDRESSES,
} from '../../../config/contracts';
import type { WorldState, PlanetInfo, MissionTemplateInfo } from '../../../hooks/useAIRivalsState';

function ownerLabel(owner: string | null): { text: string; color: string } {
  if (!owner) return { text: 'Unclaimed', color: 'text-slate-500' };
  if (owner === AI_AGENT_ADDRESSES.NEXUS7) return { text: 'NEXUS-7', color: 'text-cyan-400' };
  if (owner === AI_AGENT_ADDRESSES.KRAITX) return { text: 'KRAIT-X', color: 'text-red-400' };
  return { text: owner.slice(0, 8) + '...', color: 'text-slate-400' };
}

function PlanetCard({ planet }: { planet: PlanetInfo }) {
  const { text: ownerText, color: ownerColor } = ownerLabel(planet.owner);
  const borderColor = planet.owner === AI_AGENT_ADDRESSES.NEXUS7
    ? 'border-cyan-500/30'
    : planet.owner === AI_AGENT_ADDRESSES.KRAITX
    ? 'border-red-500/30'
    : 'border-slate-700/50';

  const typeName = PLANET_TYPE_NAMES[planet.planet_type] || String(planet.planet_type);
  const resourceName = RESOURCE_TYPE_NAMES[planet.primary_resource] || String(planet.primary_resource);

  const reservePct = planet.total_reserves > 0
    ? Math.min(100, ((planet.total_reserves - planet.extracted_resources) / planet.total_reserves) * 100)
    : 0;

  return (
    <div className={`p-3 rounded-lg bg-slate-800/60 border ${borderColor} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">{planet.name}</span>
        <span className={`text-xs font-semibold ${ownerColor}`}>{ownerText}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="px-1.5 py-0.5 rounded bg-slate-700/60">{typeName}</span>
        <span className="px-1.5 py-0.5 rounded bg-slate-700/60">{resourceName}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Pop</span>
          <span className="ml-1 text-slate-300">{planet.population}</span>
        </div>
        <div>
          <span className="text-slate-500">Def</span>
          <span className="ml-1 text-slate-300">{planet.defense_level}</span>
        </div>
        <div>
          <span className="text-slate-500">Reserves</span>
          <span className="ml-1 text-slate-300">{Math.round(reservePct)}%</span>
        </div>
      </div>

      {/* Reserve bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${reservePct}%` }} />
      </div>

      {planet.is_under_attack && (
        <span className="text-xs text-red-400 font-semibold">UNDER ATTACK</span>
      )}
    </div>
  );
}

function MissionCard({ mission }: { mission: MissionTemplateInfo }) {
  const typeName = MISSION_TYPE_NAMES[mission.mission_type] || String(mission.mission_type);
  const stars = Array.from({ length: 5 }, (_, i) => i < mission.difficulty ? 'text-yellow-400' : 'text-slate-700');

  return (
    <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">{mission.name}</span>
        <div className="flex gap-0.5">
          {stars.map((c, i) => (
            <span key={i} className={`text-xs ${c}`}>*</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{typeName}</span>
        {!mission.is_active && <span className="text-red-400">[INACTIVE]</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Reward</span>
          <span className="ml-1 text-yellow-300">{mission.base_reward}</span>
        </div>
        <div>
          <span className="text-slate-500">XP</span>
          <span className="ml-1 text-green-300">{mission.experience_reward}</span>
        </div>
        <div>
          <span className="text-slate-500">Done</span>
          <span className="ml-1 text-slate-300">{mission.times_completed}x</span>
        </div>
      </div>
    </div>
  );
}

export const WorldPanel: React.FC<{ world: WorldState }> = ({ world }) => {
  return (
    <div className="space-y-6">
      {/* Planets */}
      <div>
        <h3 className="text-sm font-semibold text-emerald-300 mb-3">
          Planets ({world.planets.length})
        </h3>
        {world.planets.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center text-slate-500 text-sm">
            No planets discovered yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {world.planets.map(p => <PlanetCard key={p.id} planet={p} />)}
          </div>
        )}
      </div>

      {/* Mission Templates */}
      <div>
        <h3 className="text-sm font-semibold text-purple-300 mb-3">
          Mission Templates ({world.missionTemplates.length})
        </h3>
        {world.missionTemplates.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center text-slate-500 text-sm">
            No missions created yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {world.missionTemplates.map(m => <MissionCard key={m.id} mission={m} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldPanel;
