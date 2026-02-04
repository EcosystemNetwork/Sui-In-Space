import React, { useRef, useEffect, useState } from 'react';
import anime from 'animejs';

/**
 * Space Command View Component
 * Main dock/hub view matching gameart.png design
 * Shows: Mission Control, Research Lab, Warp Gate, Galactic Exchange areas
 */

interface Location {
  id: string;
  name: string;
  icon: string;
  description: string;
  position: { x: number; y: number };
  available: boolean;
}

const SPACE_COMMAND_LOCATIONS: Location[] = [
  {
    id: 'mission-control',
    name: 'Mission Control',
    icon: '🎯',
    description: 'Access mission briefings and deployments',
    position: { x: 15, y: 25 },
    available: true,
  },
  {
    id: 'research-lab',
    name: 'Research Lab',
    icon: '🔬',
    description: 'Research new technologies and upgrades',
    position: { x: 70, y: 20 },
    available: true,
  },
  {
    id: 'warp-gate',
    name: 'Warp Gate',
    icon: '🌀',
    description: 'Travel to distant star systems',
    position: { x: 50, y: 50 },
    available: true,
  },
  {
    id: 'galactic-exchange',
    name: 'Galactic Exchange',
    icon: '💱',
    description: 'Trade resources and tokens',
    position: { x: 75, y: 65 },
    available: true,
  },
  {
    id: 'mission-control-2',
    name: 'Mision Control',
    icon: '📡',
    description: 'Secondary command center',
    position: { x: 10, y: 70 },
    available: true,
  },
];

export const SpaceCommandView: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  
  const headerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const locationsRef = useRef<HTMLDivElement>(null);

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
        scale: [0.98, 1],
        duration: 800,
        delay: 200,
        easing: 'easeOutCubic',
      });
    }

    if (locationsRef.current) {
      const locations = locationsRef.current.querySelectorAll('.location-point');
      anime({
        targets: locations,
        opacity: [0, 1],
        scale: [0, 1],
        duration: 500,
        delay: anime.stagger(100, { start: 400 }),
        easing: 'easeOutBack',
      });
    }
  }, []);

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            — Space Command —
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-metallic-silver text-sm">Current Location:</span>
          <span className="text-galactic-cyan font-medium">Dock Alpha</span>
        </div>
      </div>

      {/* Main Space Command Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Command Center Image/Map Area */}
        <div className="lg:col-span-2">
          <div 
            ref={mapRef}
            className="relative aspect-[16/10] rounded-lg overflow-hidden border-2 border-space-border"
            style={{ 
              opacity: 0,
              background: 'linear-gradient(135deg, #0d1424 0%, #060810 100%)',
            }}
          >
            {/* Background image - using gameart as reference style */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{ 
                backgroundImage: 'url(/gameart.png)',
                backgroundPosition: 'left center',
                backgroundSize: 'cover',
                filter: 'brightness(0.6) saturate(1.2)',
              }}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-space-darker via-transparent to-space-darker/50" />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Location Points */}
            <div ref={locationsRef}>
              {SPACE_COMMAND_LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationClick(location)}
                  onMouseEnter={() => setHoveredLocation(location.id)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  className={`location-point absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                    selectedLocation?.id === location.id ? 'z-20 scale-110' : 'z-10'
                  }`}
                  style={{ 
                    left: `${location.position.x}%`, 
                    top: `${location.position.y}%`,
                    opacity: 0,
                  }}
                >
                  <div className={`
                    relative px-3 py-1.5 rounded-lg
                    bg-space-panel/90 backdrop-blur-sm
                    border transition-all duration-300
                    ${selectedLocation?.id === location.id 
                      ? 'border-galactic-cyan shadow-cyan-glow' 
                      : hoveredLocation === location.id
                        ? 'border-galactic-cyan/60'
                        : 'border-space-border'
                    }
                  `}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{location.icon}</span>
                      <span className="text-white text-sm font-medium whitespace-nowrap">
                        {location.name}
                      </span>
                    </div>
                    
                    {/* Tooltip on hover */}
                    {hoveredLocation === location.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-space-dark border border-space-border text-xs text-metallic-silver whitespace-nowrap z-30">
                        {location.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Pulse indicator */}
                  {location.available && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-400 pulse-glow" />
                  )}
                </button>
              ))}
            </div>

            {/* Current Position Marker */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-space-panel/80 backdrop-blur-sm border border-space-border">
              <span className="text-galactic-cyan">📍</span>
              <span className="text-white text-sm">Dock Alpha</span>
            </div>
          </div>
        </div>

        {/* Location Info Panel */}
        <div className="lg:col-span-1">
          <div className="space-panel rounded-lg p-4 h-full">
            {selectedLocation ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-space-border flex items-center justify-center text-2xl">
                    {selectedLocation.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedLocation.name}</h3>
                    <p className="text-sm text-metallic-silver">{selectedLocation.description}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-space-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-metallic-silver">Status</span>
                    <span className="text-green-400">Available</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-metallic-silver">Travel Time</span>
                    <span className="text-white">Instant</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-metallic-silver">Energy Cost</span>
                    <span className="text-energy-gold">50 ENERGY</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <button className="w-full action-btn action-btn-primary">
                    🚀 Travel Here
                  </button>
                  <button className="w-full space-btn px-4 py-2 rounded-lg text-metallic-silver">
                    🔍 View Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="text-4xl mb-3">🌌</div>
                <h3 className="text-white font-medium mb-1">Space Command</h3>
                <p className="text-metallic-silver text-sm">
                  Select a location on the map to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character/Agent Selection Row - Matching gameart bottom panel */}
      <div className="space-panel rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white flex items-center gap-2">
            <span className="text-galactic-cyan">🤖</span>
            Available Agents
          </h3>
          <button className="text-sm text-galactic-cyan hover:text-galactic-light transition-colors">
            View All →
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'Hacker', icon: '💻', class: 'text-cyan-400' },
            { name: 'Pilot', icon: '🎮', class: 'text-blue-400' },
            { name: 'Mech Operator', icon: '🦾', class: 'text-orange-400' },
            { name: 'Psionic', icon: '🔮', class: 'text-purple-400' },
          ].map((agent, i) => (
            <div 
              key={i}
              className="space-btn p-3 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-space-border flex items-center justify-center">
                  <span className="text-xl">{agent.icon}</span>
                </div>
                <div>
                  <span className={`text-sm font-medium ${agent.class}`}>{agent.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons Row - Matching gameart Deploy/Trade/Craft/Stake buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button className="action-btn action-btn-primary flex items-center justify-center gap-2">
          <span>🚀</span>
          <span>Deploy</span>
        </button>
        <button className="space-btn px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 border border-galactic-cyan/30">
          <span>💱</span>
          <span>Trade</span>
        </button>
        <button className="space-btn px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 border border-energy-gold/30">
          <span>⚒️</span>
          <span>Craft</span>
        </button>
        <button className="space-btn px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 border border-green-500/30">
          <span>📥</span>
          <span>Stake</span>
        </button>
      </div>
    </div>
  );
};

export default SpaceCommandView;
