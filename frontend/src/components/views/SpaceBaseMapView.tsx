import React, { useState, useRef, useEffect, useCallback } from 'react';
import anime from 'animejs';

/**
 * Space Base Map View Component
 * DeFi Kingdoms-style explorable space station map
 * 
 * Core Design:
 * - One explorable space base (not a galaxy map)
 * - Characters physically move between locations
 * - Visual continuity like DeFi Kingdoms' overworld
 * - Isometric sci-fi city aesthetic
 */

// ============ Types ============

interface District {
  id: string;
  name: string;
  icon: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  features: string[];
  isUnlocked: boolean;
}

interface MapAgent {
  id: string;
  name: string;
  type: 'player' | 'npc';
  avatar: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  faction: 'corporation' | 'cyberguild' | 'aicollective' | 'nomad' | 'synthetic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  currentDistrict: string | null;
}

interface NPC {
  id: string;
  type: 'drone' | 'worker' | 'guard' | 'trader' | 'scientist';
  x: number;
  y: number;
  pathIndex: number;
  speed: number;
}

// ============ Constants ============

const DISTRICTS: District[] = [
  {
    id: 'command-nexus',
    name: 'Command Nexus',
    icon: '🏛️',
    description: 'DAO governance, war planning, faction HQ',
    x: 45,
    y: 15,
    width: 14,
    height: 18,
    color: 'from-purple-600/40 to-purple-900/60',
    glowColor: 'purple',
    features: ['Governance', 'War Room', 'Faction HQ'],
    isUnlocked: true,
  },
  {
    id: 'mission-bay',
    name: 'Mission Bay',
    icon: '📜',
    description: 'Quests, expeditions, contracts hub',
    x: 70,
    y: 25,
    width: 16,
    height: 16,
    color: 'from-yellow-600/40 to-yellow-900/60',
    glowColor: 'yellow',
    features: ['Quest Board', 'Expeditions', 'Contracts'],
    isUnlocked: true,
  },
  {
    id: 'research-lab',
    name: 'Research Lab',
    icon: '🔬',
    description: 'Upgrades, tech trees, mutations',
    x: 15,
    y: 25,
    width: 15,
    height: 15,
    color: 'from-cyan-600/40 to-cyan-900/60',
    glowColor: 'cyan',
    features: ['Tech Tree', 'Upgrades', 'Mutations'],
    isUnlocked: true,
  },
  {
    id: 'hangar-deck',
    name: 'Hangar Deck',
    icon: '🚀',
    description: 'Ships, vehicles, travel unlocks',
    x: 75,
    y: 55,
    width: 18,
    height: 20,
    color: 'from-blue-600/40 to-blue-900/60',
    glowColor: 'blue',
    features: ['Ship Bay', 'Vehicle Storage', 'Travel Hub'],
    isUnlocked: true,
  },
  {
    id: 'market-ring',
    name: 'Market Ring',
    icon: '🏪',
    description: 'Trading, AMM, NFT marketplace',
    x: 45,
    y: 45,
    width: 20,
    height: 18,
    color: 'from-green-600/40 to-green-900/60',
    glowColor: 'green',
    features: ['Trading Post', 'AMM Exchange', 'NFT Market'],
    isUnlocked: true,
  },
  {
    id: 'forge-sector',
    name: 'Forge Sector',
    icon: '⚒️',
    description: 'Crafting, repairs, item fusion',
    x: 10,
    y: 50,
    width: 16,
    height: 18,
    color: 'from-orange-600/40 to-orange-900/60',
    glowColor: 'orange',
    features: ['Crafting Bay', 'Repair Shop', 'Fusion Lab'],
    isUnlocked: true,
  },
  {
    id: 'data-vault',
    name: 'Data Vault',
    icon: '💾',
    description: 'Staking, yield, resource storage',
    x: 25,
    y: 72,
    width: 16,
    height: 16,
    color: 'from-teal-600/40 to-teal-900/60',
    glowColor: 'teal',
    features: ['Staking Pools', 'Yield Farms', 'Storage'],
    isUnlocked: true,
  },
  {
    id: 'residential-pods',
    name: 'Residential Pods',
    icon: '🏠',
    description: 'Agent housing, buffs, lore',
    x: 55,
    y: 75,
    width: 18,
    height: 15,
    color: 'from-pink-600/40 to-pink-900/60',
    glowColor: 'pink',
    features: ['Agent Housing', 'Rest & Buff', 'Lore Archive'],
    isUnlocked: true,
  },
  {
    id: 'warp-gate',
    name: 'Warp Gate',
    icon: '🌀',
    description: 'Unlocks new zones (expansion)',
    x: 80,
    y: 85,
    width: 14,
    height: 12,
    color: 'from-violet-600/40 to-violet-900/60',
    glowColor: 'violet',
    features: ['Zone Travel', 'Expansion', 'Coming Soon'],
    isUnlocked: false,
  },
];

const FACTION_COLORS = {
  corporation: 'bg-yellow-400',
  cyberguild: 'bg-cyan-400',
  aicollective: 'bg-purple-400',
  nomad: 'bg-orange-400',
  synthetic: 'bg-pink-400',
};

const RARITY_GLOWS = {
  common: '',
  uncommon: 'ring-2 ring-green-400/50',
  rare: 'ring-2 ring-blue-400/50 animate-pulse',
  epic: 'ring-2 ring-purple-400/60 animate-pulse',
  legendary: 'ring-3 ring-yellow-400/70 animate-pulse shadow-lg shadow-yellow-400/30',
};

// Pre-defined Tailwind classes for district glow colors (JIT-safe)
const DISTRICT_BORDER_CLASSES: Record<string, { default: string; hover: string; active: string }> = {
  purple: {
    default: 'border-purple-500/30',
    hover: 'border-purple-400 shadow-lg shadow-purple-400/30',
    active: 'border-purple-400 bg-purple-500/10',
  },
  yellow: {
    default: 'border-yellow-500/30',
    hover: 'border-yellow-400 shadow-lg shadow-yellow-400/30',
    active: 'border-yellow-400 bg-yellow-500/10',
  },
  cyan: {
    default: 'border-cyan-500/30',
    hover: 'border-cyan-400 shadow-lg shadow-cyan-400/30',
    active: 'border-cyan-400 bg-cyan-500/10',
  },
  blue: {
    default: 'border-blue-500/30',
    hover: 'border-blue-400 shadow-lg shadow-blue-400/30',
    active: 'border-blue-400 bg-blue-500/10',
  },
  green: {
    default: 'border-green-500/30',
    hover: 'border-green-400 shadow-lg shadow-green-400/30',
    active: 'border-green-400 bg-green-500/10',
  },
  orange: {
    default: 'border-orange-500/30',
    hover: 'border-orange-400 shadow-lg shadow-orange-400/30',
    active: 'border-orange-400 bg-orange-500/10',
  },
  teal: {
    default: 'border-teal-500/30',
    hover: 'border-teal-400 shadow-lg shadow-teal-400/30',
    active: 'border-teal-400 bg-teal-500/10',
  },
  pink: {
    default: 'border-pink-500/30',
    hover: 'border-pink-400 shadow-lg shadow-pink-400/30',
    active: 'border-pink-400 bg-pink-500/10',
  },
  violet: {
    default: 'border-violet-500/30',
    hover: 'border-violet-400 shadow-lg shadow-violet-400/30',
    active: 'border-violet-400 bg-violet-500/10',
  },
};

const DISTRICT_HOVER_BORDER_CLASSES: Record<string, string> = {
  purple: 'hover:border-purple-500/50',
  yellow: 'hover:border-yellow-500/50',
  cyan: 'hover:border-cyan-500/50',
  blue: 'hover:border-blue-500/50',
  green: 'hover:border-green-500/50',
  orange: 'hover:border-orange-500/50',
  teal: 'hover:border-teal-500/50',
  pink: 'hover:border-pink-500/50',
  violet: 'hover:border-violet-500/50',
};

// Demo player agents
const INITIAL_AGENTS: MapAgent[] = [
  {
    id: 'player-agent-1',
    name: 'Nova-7',
    type: 'player',
    avatar: '🤖',
    x: 50,
    y: 50,
    targetX: 50,
    targetY: 50,
    isMoving: false,
    faction: 'cyberguild',
    rarity: 'epic',
    currentDistrict: 'market-ring',
  },
  {
    id: 'player-agent-2',
    name: 'Vex-Prime',
    type: 'player',
    avatar: '👨‍🚀',
    x: 78,
    y: 60,
    targetX: 78,
    targetY: 60,
    isMoving: false,
    faction: 'nomad',
    rarity: 'rare',
    currentDistrict: 'hangar-deck',
  },
  {
    id: 'player-agent-3',
    name: 'Echo-∞',
    type: 'player',
    avatar: '👽',
    x: 18,
    y: 32,
    targetX: 18,
    targetY: 32,
    isMoving: false,
    faction: 'synthetic',
    rarity: 'legendary',
    currentDistrict: 'research-lab',
  },
];

// NPC paths for ambient movement
const NPC_PATHS = [
  // Traders moving between Market and Hangar
  [
    { x: 45, y: 50 },
    { x: 55, y: 52 },
    { x: 65, y: 55 },
    { x: 75, y: 58 },
    { x: 65, y: 55 },
    { x: 55, y: 52 },
  ],
  // Scientists between Research Lab and Data Vault
  [
    { x: 20, y: 30 },
    { x: 22, y: 45 },
    { x: 24, y: 60 },
    { x: 26, y: 75 },
    { x: 24, y: 60 },
    { x: 22, y: 45 },
  ],
  // Guards patrolling Command Nexus
  [
    { x: 40, y: 18 },
    { x: 50, y: 20 },
    { x: 55, y: 22 },
    { x: 50, y: 20 },
  ],
  // Workers in Forge Sector
  [
    { x: 12, y: 52 },
    { x: 18, y: 55 },
    { x: 22, y: 58 },
    { x: 18, y: 55 },
  ],
];

const INITIAL_NPCS: NPC[] = [
  { id: 'npc-1', type: 'trader', x: 45, y: 50, pathIndex: 0, speed: 0.02 },
  { id: 'npc-2', type: 'trader', x: 55, y: 52, pathIndex: 0, speed: 0.015 },
  { id: 'npc-3', type: 'scientist', x: 20, y: 30, pathIndex: 1, speed: 0.01 },
  { id: 'npc-4', type: 'guard', x: 40, y: 18, pathIndex: 2, speed: 0.025 },
  { id: 'npc-5', type: 'guard', x: 50, y: 20, pathIndex: 2, speed: 0.02 },
  { id: 'npc-6', type: 'worker', x: 12, y: 52, pathIndex: 3, speed: 0.018 },
  { id: 'npc-7', type: 'drone', x: 60, y: 40, pathIndex: 0, speed: 0.03 },
  { id: 'npc-8', type: 'drone', x: 30, y: 60, pathIndex: 1, speed: 0.035 },
];

const NPC_ICONS = {
  drone: '🛸',
  worker: '👷',
  guard: '💂',
  trader: '🧑‍💼',
  scientist: '🧑‍🔬',
};

// ============ Component ============

export const SpaceBaseMapView: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<MapAgent | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [agents, setAgents] = useState<MapAgent[]>(INITIAL_AGENTS);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [showDistrictPanel, setShowDistrictPanel] = useState<District | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const npcProgressRef = useRef<number[]>(INITIAL_NPCS.map(() => 0));
  const animationFrameRef = useRef<number>(0);

  // Move agent to a position
  const moveAgent = useCallback((agentId: string, targetX: number, targetY: number) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          targetX,
          targetY,
          isMoving: true,
        };
      }
      return agent;
    }));

    // Find the district at target location
    const targetDistrict = DISTRICTS.find(d => 
      targetX >= d.x && targetX <= d.x + d.width &&
      targetY >= d.y && targetY <= d.y + d.height
    );

    // Animate agent movement
    const agentEl = document.getElementById(`agent-${agentId}`);
    if (agentEl) {
      anime({
        targets: agentEl,
        left: `${targetX}%`,
        top: `${targetY}%`,
        duration: 1000,
        easing: 'easeOutQuad',
        complete: () => {
          setAgents(prev => prev.map(agent => {
            if (agent.id === agentId) {
              return {
                ...agent,
                x: targetX,
                y: targetY,
                isMoving: false,
                currentDistrict: targetDistrict?.id || null,
              };
            }
            return agent;
          }));
        },
      });
    }
  }, []);

  // Handle map click for agent movement
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedAgent || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    moveAgent(selectedAgent.id, x, y);
  }, [selectedAgent, moveAgent]);

  // Handle district click
  const handleDistrictClick = useCallback((district: District, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!district.isUnlocked) return;
    
    if (selectedAgent) {
      // Move agent to district center
      const centerX = district.x + district.width / 2;
      const centerY = district.y + district.height / 2;
      moveAgent(selectedAgent.id, centerX, centerY);
    }
    
    setShowDistrictPanel(district);
  }, [selectedAgent, moveAgent]);

  // Animate NPCs
  useEffect(() => {
    const animateNPCs = () => {
      setNpcs(prevNpcs => {
        return prevNpcs.map((npc, index) => {
          const path = NPC_PATHS[npc.pathIndex];
          if (!path) return npc;
          
          const progress = npcProgressRef.current[index];
          const pathLength = path.length;
          const currentIndex = Math.floor(progress) % pathLength;
          const nextIndex = (currentIndex + 1) % pathLength;
          const t = progress - Math.floor(progress);
          
          const currentPoint = path[currentIndex];
          const nextPoint = path[nextIndex];
          
          const x = currentPoint.x + (nextPoint.x - currentPoint.x) * t;
          const y = currentPoint.y + (nextPoint.y - currentPoint.y) * t;
          
          npcProgressRef.current[index] = (progress + npc.speed) % pathLength;
          
          return { ...npc, x, y };
        });
      });
      
      animationFrameRef.current = requestAnimationFrame(animateNPCs);
    };
    
    animationFrameRef.current = requestAnimationFrame(animateNPCs);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

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

    if (mapRef.current) {
      anime({
        targets: mapRef.current,
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 800,
        delay: 200,
        easing: 'easeOutCubic',
      });

      // Animate districts appearing
      const districts = mapRef.current.querySelectorAll('.district');
      anime({
        targets: districts,
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 600,
        delay: anime.stagger(80, { start: 400 }),
        easing: 'easeOutBack',
      });

      // Animate agents appearing
      const agentEls = mapRef.current.querySelectorAll('.map-agent');
      anime({
        targets: agentEls,
        opacity: [0, 1],
        scale: [0, 1],
        duration: 500,
        delay: anime.stagger(100, { start: 800 }),
        easing: 'easeOutBack',
      });
    }
  }, []);

  // Animate info panel when selection changes
  useEffect(() => {
    if (infoPanelRef.current && (selectedAgent || showDistrictPanel)) {
      anime({
        targets: infoPanelRef.current,
        translateX: [20, 0],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutCubic',
      });
    }
  }, [selectedAgent, showDistrictPanel]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-cyan-400">🛰️</span>
          Orbital Station Alpha
        </h2>
        <div className="flex gap-3 text-sm">
          <div className="px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700">
            <span className="text-slate-400">Agents:</span>
            <span className="text-cyan-400 ml-2">{agents.filter(a => a.type === 'player').length}</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700">
            <span className="text-slate-400">Districts:</span>
            <span className="text-green-400 ml-2">{DISTRICTS.filter(d => d.isUnlocked).length}/{DISTRICTS.length}</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Space Station Map */}
        <div className="lg:col-span-3">
          <div
            ref={mapRef}
            onClick={handleMapClick}
            className="relative aspect-[16/10] bg-slate-900/90 rounded-lg border border-cyan-500/30 overflow-hidden cursor-crosshair"
            style={{ opacity: 0 }}
          >
            {/* Space Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            
            {/* Grid overlay for station floor */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="station-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#station-grid)" />
              </svg>
            </div>

            {/* Station Outline / Hull */}
            <div className="absolute inset-4 border-2 border-cyan-500/20 rounded-lg" />
            <div className="absolute inset-6 border border-cyan-500/10 rounded-lg" />

            {/* Animated ambient lights */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '1.5s' }} />

            {/* Connection corridors between districts */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Corridor lines */}
              <line x1="52%" y1="33%" x2="52%" y2="45%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
              <line x1="55%" y1="54%" x2="70%" y2="58%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
              <line x1="45%" y1="54%" x2="26%" y2="58%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
              <line x1="30%" y1="30%" x2="40%" y2="22%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
              <line x1="60%" y1="25%" x2="70%" y2="28%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
              <line x1="26%" y1="68%" x2="30%" y2="75%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
              <line x1="55%" y1="63%" x2="58%" y2="75%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
              <line x1="73%" y1="75%" x2="80%" y2="85%" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="8" strokeLinecap="round" />
            </svg>

            {/* Districts */}
            {DISTRICTS.map((district) => {
              const borderClasses = DISTRICT_BORDER_CLASSES[district.glowColor] || DISTRICT_BORDER_CLASSES.cyan;
              return (
                <button
                  key={district.id}
                  onClick={(e) => handleDistrictClick(district, e)}
                  onMouseEnter={() => setHoveredDistrict(district)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  className={`district absolute rounded-lg bg-gradient-to-br ${district.color} border-2 transition-all duration-300 ${
                    district.isUnlocked
                      ? 'cursor-pointer hover:scale-105 hover:z-10'
                      : 'opacity-40 cursor-not-allowed grayscale'
                  } ${
                    hoveredDistrict?.id === district.id
                      ? borderClasses.hover
                      : borderClasses.default
                  } ${
                    showDistrictPanel?.id === district.id
                      ? 'ring-2 ring-white/50'
                      : ''
                  }`}
                  style={{
                    left: `${district.x}%`,
                    top: `${district.y}%`,
                    width: `${district.width}%`,
                    height: `${district.height}%`,
                    opacity: 0,
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <span className="text-2xl md:text-3xl mb-1">{district.icon}</span>
                    <span className="text-[10px] md:text-xs font-bold text-white text-center leading-tight drop-shadow-lg">
                      {district.name}
                    </span>
                    {!district.isUnlocked && (
                      <span className="text-[8px] text-slate-400 mt-1">🔒 Locked</span>
                  )}
                </div>
                
                {/* District activity indicator */}
                {district.isUnlocked && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </button>
              );
            })}

            {/* NPCs */}
            {npcs.map((npc) => (
              <div
                key={npc.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 pointer-events-none"
                style={{
                  left: `${npc.x}%`,
                  top: `${npc.y}%`,
                  zIndex: 5,
                }}
              >
                <div className="relative">
                  <span className="text-lg opacity-70">{NPC_ICONS[npc.type]}</span>
                </div>
              </div>
            ))}

            {/* Player Agents */}
            {agents.filter(a => a.type === 'player').map((agent) => (
              <button
                key={agent.id}
                id={`agent-${agent.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAgent(selectedAgent?.id === agent.id ? null : agent);
                }}
                className={`map-agent absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-20 ${
                  selectedAgent?.id === agent.id ? 'scale-125' : ''
                }`}
                style={{
                  left: `${agent.x}%`,
                  top: `${agent.y}%`,
                  opacity: 0,
                }}
              >
                <div className={`relative flex flex-col items-center`}>
                  {/* Agent avatar with rarity glow */}
                  <div className={`w-10 h-10 rounded-full bg-slate-800 border-2 flex items-center justify-center ${FACTION_COLORS[agent.faction]} bg-opacity-20 ${RARITY_GLOWS[agent.rarity]}`}>
                    <span className="text-xl">{agent.avatar}</span>
                  </div>
                  
                  {/* Agent name */}
                  <span className="absolute -bottom-4 text-[9px] text-white font-bold whitespace-nowrap bg-slate-900/80 px-1 rounded">
                    {agent.name}
                  </span>
                  
                  {/* Moving indicator */}
                  {agent.isMoving && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <span className="text-xs animate-bounce">🏃</span>
                    </div>
                  )}
                  
                  {/* Selection indicator */}
                  {selectedAgent?.id === agent.id && (
                    <div className="absolute -inset-2 border-2 border-cyan-400 rounded-full animate-pulse" />
                  )}
                </div>
              </button>
            ))}

            {/* Ambient decorations */}
            <div className="absolute top-8 left-[30%] text-2xl opacity-30 animate-pulse">✨</div>
            <div className="absolute bottom-12 right-[25%] text-xl opacity-30 animate-pulse" style={{ animationDelay: '0.7s' }}>✨</div>
            <div className="absolute top-[40%] left-[5%] text-lg opacity-20">🛸</div>
            <div className="absolute bottom-[30%] right-[8%] text-lg opacity-20">📡</div>

            {/* Station name badge */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900/90 border border-cyan-500/50 rounded-full">
              <span className="text-xs font-bold text-cyan-400">ORBITAL STATION ALPHA • SECTOR 7G</span>
            </div>

            {/* Hovered district tooltip */}
            {hoveredDistrict && (
              <div 
                className="absolute z-30 p-3 bg-slate-900/95 border border-slate-600 rounded-lg shadow-xl pointer-events-none max-w-48"
                style={{
                  left: `${Math.min(hoveredDistrict.x + hoveredDistrict.width + 2, 75)}%`,
                  top: `${hoveredDistrict.y}%`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{hoveredDistrict.icon}</span>
                  <span className="font-bold text-white text-sm">{hoveredDistrict.name}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{hoveredDistrict.description}</p>
                <div className="flex flex-wrap gap-1">
                  {hoveredDistrict.features.map((feature) => (
                    <span key={feature} className="px-1.5 py-0.5 text-[10px] bg-slate-700/50 text-slate-300 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions overlay */}
            {!selectedAgent && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 border border-slate-600 rounded-lg">
                <span className="text-xs text-slate-400">Click an agent to select, then click anywhere to move them</span>
              </div>
            )}
            {selectedAgent && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-900/90 border border-cyan-500/50 rounded-lg">
                <span className="text-xs text-cyan-300">
                  <span className="font-bold">{selectedAgent.name}</span> selected • Click on map or district to move
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1">
          <div ref={infoPanelRef} className="bg-slate-900/80 rounded-lg border border-slate-700 p-4 h-full min-h-[400px]">
            {showDistrictPanel ? (
              // District Info
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{showDistrictPanel.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{showDistrictPanel.name}</h3>
                      <p className="text-xs text-slate-400">{showDistrictPanel.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowDistrictPanel(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 border-t border-slate-700 pt-3">
                  <h4 className="text-sm font-bold text-slate-300">Available Actions</h4>
                  {showDistrictPanel.features.map((feature) => (
                    <button
                      key={feature}
                      className="w-full px-3 py-2 rounded bg-slate-800/50 border border-slate-700 hover:border-slate-500 text-left text-sm text-slate-300 hover:text-white transition-all"
                    >
                      {feature}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 border-t border-slate-700 pt-3">
                  <h4 className="text-sm font-bold text-slate-300">Agents Here</h4>
                  {agents.filter(a => a.currentDistrict === showDistrictPanel.id).map((agent) => (
                    <div key={agent.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/30 border border-slate-700">
                      <span className="text-xl">{agent.avatar}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{agent.name}</div>
                        <div className="text-xs text-slate-400 capitalize">{agent.faction}</div>
                      </div>
                    </div>
                  ))}
                  {agents.filter(a => a.currentDistrict === showDistrictPanel.id).length === 0 && (
                    <p className="text-xs text-slate-500 italic">No agents in this district</p>
                  )}
                </div>

                <button className="w-full px-4 py-2 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm font-bold">
                  Enter {showDistrictPanel.name}
                </button>
              </div>
            ) : selectedAgent ? (
              // Agent Info
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-full bg-slate-800 border-2 flex items-center justify-center ${FACTION_COLORS[selectedAgent.faction]} bg-opacity-20 ${RARITY_GLOWS[selectedAgent.rarity]}`}>
                    <span className="text-3xl">{selectedAgent.avatar}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedAgent.name}</h3>
                    <p className="text-xs text-slate-400 capitalize">{selectedAgent.faction} • {selectedAgent.rarity}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-700 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Location</span>
                    <span className="text-white">
                      {selectedAgent.currentDistrict 
                        ? DISTRICTS.find(d => d.id === selectedAgent.currentDistrict)?.name 
                        : 'Station Corridor'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status</span>
                    <span className={selectedAgent.isMoving ? 'text-yellow-400' : 'text-green-400'}>
                      {selectedAgent.isMoving ? 'Moving...' : 'Idle'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button className="w-full px-4 py-2 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm">
                    📜 View Quests
                  </button>
                  <button className="w-full px-4 py-2 rounded bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm">
                    🔧 Manage Equipment
                  </button>
                  <button className="w-full px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                    📊 View Stats
                  </button>
                </div>
              </div>
            ) : (
              // Default Info
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🛰️</div>
                <h3 className="text-lg font-bold text-white mb-2">Welcome to the Station</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Select an agent to move them around the station, or click a district to explore.
                </p>
                
                <div className="text-left space-y-2 mt-6">
                  <h4 className="text-sm font-bold text-slate-300 mb-2">Your Agents</h4>
                  {agents.filter(a => a.type === 'player').map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className="w-full flex items-center gap-2 p-2 rounded bg-slate-800/30 border border-slate-700 hover:border-cyan-500/50 transition-all"
                    >
                      <span className="text-xl">{agent.avatar}</span>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">{agent.name}</div>
                        <div className="text-xs text-slate-400">
                          {agent.currentDistrict 
                            ? DISTRICTS.find(d => d.id === agent.currentDistrict)?.name 
                            : 'Corridor'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* District Quick Navigation */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {DISTRICTS.map((district) => {
          const borderClasses = DISTRICT_BORDER_CLASSES[district.glowColor] || DISTRICT_BORDER_CLASSES.cyan;
          const hoverBorderClass = DISTRICT_HOVER_BORDER_CLASSES[district.glowColor] || DISTRICT_HOVER_BORDER_CLASSES.cyan;
          return (
            <button
              key={district.id}
              onClick={() => setShowDistrictPanel(district)}
              disabled={!district.isUnlocked}
              className={`p-2 rounded-lg border text-center transition-all ${
                district.isUnlocked
                  ? `bg-slate-800/50 border-slate-700 ${hoverBorderClass} hover:bg-slate-800`
                  : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
              } ${
                showDistrictPanel?.id === district.id
                  ? borderClasses.active
                  : ''
              }`}
            >
              <span className="text-xl block mb-1">{district.icon}</span>
              <span className="text-[10px] text-slate-300 leading-tight block">{district.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SpaceBaseMapView;
