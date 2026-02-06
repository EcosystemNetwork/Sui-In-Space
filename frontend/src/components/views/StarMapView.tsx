import React, { useState, useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';

/**
 * Star Map View Component
 * Galaxy navigation and system information
 * Enhanced with anime.js animations
 */

interface StarSystem {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'terran' | 'gas' | 'ice' | 'desert' | 'volcanic';
  planets: number;
  stations: number;
  claimed: boolean;
  playerOwned: boolean;
}

// Demo star systems for display
const DEMO_SYSTEMS: StarSystem[] = [
  { id: '1', name: 'Sol Prime', x: 50, y: 50, type: 'terran', planets: 5, stations: 3, claimed: true, playerOwned: true },
  { id: '2', name: 'Nexus Alpha', x: 30, y: 25, type: 'gas', planets: 8, stations: 1, claimed: true, playerOwned: false },
  { id: '3', name: 'Frost Haven', x: 70, y: 30, type: 'ice', planets: 3, stations: 2, claimed: true, playerOwned: false },
  { id: '4', name: 'Dune Reach', x: 20, y: 65, type: 'desert', planets: 2, stations: 0, claimed: false, playerOwned: false },
  { id: '5', name: 'Inferno Gate', x: 75, y: 70, type: 'volcanic', planets: 4, stations: 1, claimed: true, playerOwned: false },
  { id: '6', name: 'Unknown Sector', x: 85, y: 20, type: 'terran', planets: 0, stations: 0, claimed: false, playerOwned: false },
  { id: '7', name: 'Quantum Junction', x: 45, y: 80, type: 'gas', planets: 6, stations: 4, claimed: true, playerOwned: false },
];

const TYPE_COLORS = {
  terran: 'bg-green-400',
  gas: 'bg-orange-400',
  ice: 'bg-cyan-400',
  desert: 'bg-yellow-400',
  volcanic: 'bg-red-400',
};

const TYPE_ICONS = {
  terran: '🌍',
  gas: '🪐',
  ice: '❄️',
  desert: '🏜️',
  volcanic: '🌋',
};

export const StarMapView: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<StarSystem | null>(null);
  const [viewMode, setViewMode] = useState<'galaxy' | 'system'>('galaxy');
  
  const headerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  // Initial entrance animations
  useEffect(() => {
    // Animate header
    if (headerRef.current) {
      animate(headerRef.current, {
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        ease: 'outCubic',
      });
    }
    
    // Animate map container
    if (mapRef.current) {
      animate(mapRef.current, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 800,
        delay: 200,
        ease: 'outCubic',
      });
      
      // Animate star systems appearing
      const systems = mapRef.current.querySelectorAll('.star-system');
      animate(systems, {
        opacity: [0, 1],
        scale: [0, 1],
        duration: 600,
        delay: stagger(100, { start: 400 }),
        ease: 'outBack',
      });
      
      // Animate connection lines
      const lines = mapRef.current.querySelectorAll('.connection-line');
      animate(lines, {
        strokeDashoffset: [(el: SVGLineElement) => {
          const x1 = parseFloat(el.getAttribute('x1') || '0');
          const y1 = parseFloat(el.getAttribute('y1') || '0');
          const x2 = parseFloat(el.getAttribute('x2') || '0');
          const y2 = parseFloat(el.getAttribute('y2') || '0');
          return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        }, 0] as unknown as number,
        duration: 1500,
        delay: stagger(200, { start: 600 }),
        ease: 'outCubic',
      });
    }
    
    // Animate stats
    if (statsRef.current) {
      const statCards = statsRef.current.querySelectorAll('.stat-card');
      animate(statCards, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: stagger(100, { start: 800 }),
        ease: 'outCubic',
      });
    }
  }, []);
  
  // Animate info panel when selection changes
  useEffect(() => {
    if (infoPanelRef.current && selectedSystem) {
      animate(infoPanelRef.current, {
        translateX: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outCubic',
      });
    }
  }, [selectedSystem]);
  
  const handleSystemClick = (system: StarSystem, e: React.MouseEvent) => {
    const button = e.currentTarget;
    animate(button, {
      scale: [1, 1.3, 1.1],
      duration: 300,
      ease: 'outBack',
    });
    setSelectedSystem(system);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-cyan-400">🗺️</span>
          Galactic Star Map
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('galaxy')}
            className={`px-3 py-1.5 rounded text-sm ${
              viewMode === 'galaxy'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            Galaxy View
          </button>
          <button
            onClick={() => setViewMode('system')}
            className={`px-3 py-1.5 rounded text-sm ${
              viewMode === 'system'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            System View
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Star Map */}
        <div className="lg:col-span-3">
          <div ref={mapRef} className="relative aspect-[16/9] bg-slate-900/80 rounded-lg border border-slate-700 overflow-hidden" style={{ opacity: 0 }}>
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full">
              {DEMO_SYSTEMS.slice(0, 5).map((system, index) => {
                const nextSystem = DEMO_SYSTEMS[(index + 1) % 5];
                return (
                  <line
                    key={`line-${index}`}
                    className="connection-line"
                    x1={`${system.x}%`}
                    y1={`${system.y}%`}
                    x2={`${nextSystem.x}%`}
                    y2={`${nextSystem.y}%`}
                    stroke="rgba(34, 211, 238, 0.3)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                  />
                );
              })}
            </svg>

            {/* Star systems */}
            {DEMO_SYSTEMS.map((system) => (
              <button
                key={system.id}
                onClick={(e) => handleSystemClick(system, e)}
                className={`star-system absolute transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedSystem?.id === system.id ? 'z-10' : ''
                }`}
                style={{ left: `${system.x}%`, top: `${system.y}%`, opacity: 0 }}
              >
                <div className="relative">
                  <div
                    className={`w-4 h-4 rounded-full ${TYPE_COLORS[system.type]} ${
                      selectedSystem?.id === system.id ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''
                    } ${system.claimed ? 'opacity-100' : 'opacity-50'}`}
                  />
                  {system.playerOwned && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
                  )}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 whitespace-nowrap">
                    {system.name}
                  </span>
                </div>
              </button>
            ))}

            {/* Legend */}
            <div className="absolute bottom-2 left-2 p-2 rounded bg-slate-800/80 border border-slate-700 text-xs">
              <div className="flex gap-3">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-slate-400 capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Location Indicator */}
            <div className="absolute top-2 right-2 p-2 rounded bg-slate-800/80 border border-cyan-500/30 text-xs">
              <div className="text-cyan-400">📍 Current: Sol Prime</div>
              <div className="text-slate-400">Sector 7G</div>
            </div>
          </div>
        </div>

        {/* System Info Panel */}
        <div className="lg:col-span-1">
          <div ref={infoPanelRef} className="bg-slate-900/80 rounded-lg border border-slate-700 p-4 h-full">
            {selectedSystem ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{TYPE_ICONS[selectedSystem.type]}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedSystem.name}</h3>
                    <p className="text-sm text-slate-400 capitalize">{selectedSystem.type} System</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-700 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Planets</span>
                    <span className="text-white">{selectedSystem.planets}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Stations</span>
                    <span className="text-white">{selectedSystem.stations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status</span>
                    <span className={selectedSystem.claimed ? 'text-orange-400' : 'text-green-400'}>
                      {selectedSystem.claimed ? 'Claimed' : 'Unclaimed'}
                    </span>
                  </div>
                  {selectedSystem.playerOwned && (
                    <div className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded text-center">
                      ★ You own this system
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button className="w-full px-4 py-2 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm">
                    🚀 Travel Here
                  </button>
                  {!selectedSystem.claimed && (
                    <button className="w-full px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                      🏴 Claim System
                    </button>
                  )}
                  <button className="w-full px-4 py-2 rounded bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm">
                    🔍 Scan System
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <div className="text-4xl mb-3">🌌</div>
                <p>Select a star system to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card p-3 rounded-lg bg-slate-800/50 border border-slate-700" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-cyan-400">7</div>
          <div className="text-xs text-slate-400">Systems Discovered</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-slate-800/50 border border-slate-700" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-green-400">1</div>
          <div className="text-xs text-slate-400">Systems Owned</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-slate-800/50 border border-slate-700" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-orange-400">5</div>
          <div className="text-xs text-slate-400">Planets Colonized</div>
        </div>
        <div className="stat-card p-3 rounded-lg bg-slate-800/50 border border-slate-700" style={{ opacity: 0 }}>
          <div className="text-2xl font-bold text-purple-400">3</div>
          <div className="text-xs text-slate-400">Active Stations</div>
        </div>
      </div>
    </div>
  );
};

export default StarMapView;
