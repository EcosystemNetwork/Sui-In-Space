import React, { useState, useRef, useEffect } from 'react';
import anime from 'animejs';

/**
 * Space Base Map View Component
 * Uses the Star Kingdoms pixel art as background with interactive overlay
 */

// ============ Types ============

interface SidebarItem {
  id: string;
  name: string;
  icon: string;
  label: string;
}

interface Location {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============ Constants ============


// Clickable regions overlaid on the background (approximate positions matching the image)
const LOCATIONS: Location[] = [
  { id: 'sector-alpha', name: 'Sector Alpha', x: 42, y: 8, width: 16, height: 30 },
  { id: 'dockan', name: 'Dockan', x: 42, y: 62, width: 16, height: 15 },
  { id: 'galaxy-left', name: 'Nebula Prime', x: 8, y: 25, width: 12, height: 20 },
  { id: 'galaxy-right', name: 'Void Spiral', x: 80, y: 25, width: 12, height: 20 },
  { id: 'galaxy-bl', name: 'Crimson Core', x: 15, y: 65, width: 12, height: 18 },
  { id: 'galaxy-br', name: 'Azure Vortex', x: 73, y: 65, width: 12, height: 18 },
];

// ============ Component ============

export const SpaceBaseMapView: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initial animations
  useEffect(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current,
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutCubic',
      });

      const sidebarItems = containerRef.current.querySelectorAll('.sidebar-item');
      anime({
        targets: sidebarItems,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 400,
        delay: anime.stagger(80, { start: 300 }),
        easing: 'easeOutCubic',
      });
    }
  }, []);

  // Slow down video to 20% speed (500% slower)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.2;
    }
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] min-h-[600px] bg-slate-500 p-2 rounded-lg">
      {/* Gray Ornate Frame Border */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-slate-400 to-slate-500" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-slate-400 to-slate-500" />
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-slate-400 to-slate-500" />
        <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-slate-400 to-slate-500" />
      </div>

      {/* Main Map with Background Image */}
      <div
        ref={containerRef}
        className="relative w-full h-full rounded overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Video Background - Fill entire space and loop */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
        >
          <source src="/backg.mp4" type="video/mp4" />
        </video>

        {/* Clickable Location Overlays (invisible, for interaction) */}
        {LOCATIONS.map(location => (
          <button
            key={location.id}
            onClick={() => setSelectedLocation(selectedLocation?.id === location.id ? null : location)}
            onMouseEnter={() => setHoveredLocation(location)}
            onMouseLeave={() => setHoveredLocation(null)}
            className={`absolute transition-all duration-200 rounded-lg ${hoveredLocation?.id === location.id || selectedLocation?.id === location.id
              ? 'bg-cyan-400/20 border-2 border-cyan-400/60'
              : 'bg-transparent border-2 border-transparent hover:border-cyan-400/30'
              }`}
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
              width: `${location.width}%`,
              height: `${location.height}%`,
            }}
          />
        ))}



        {/* Right Side Controls */}
        <div className="absolute right-3 top-4 flex flex-col gap-2 z-30">
          <button className="w-9 h-9 rounded bg-gradient-to-b from-amber-700/90 to-amber-900/90 border border-amber-600/60 flex items-center justify-center text-slate-200 hover:scale-105 transition-transform shadow-lg backdrop-blur-sm">
            <span className="text-sm">👥</span>
          </button>
          <button className="w-9 h-9 rounded bg-gradient-to-b from-slate-700/90 to-slate-900/90 border border-slate-600/60 flex items-center justify-center text-slate-200 hover:scale-105 transition-transform shadow-lg backdrop-blur-sm">
            <span className="text-sm">☰</span>
          </button>
        </div>

        {/* Bottom Left Controls */}
        <div className="absolute left-3 bottom-3 flex items-center gap-2 z-30">
          <button className="w-7 h-7 rounded bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors backdrop-blur-sm">
            <span className="text-xs">🔊</span>
          </button>
          <button className="px-2 py-1 rounded bg-slate-800/90 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors backdrop-blur-sm font-medium">
            EN
          </button>
          <div className="px-2 py-1 rounded bg-cyan-900/90 border border-cyan-600/50 text-[10px] text-cyan-300 font-bold flex items-center gap-1 backdrop-blur-sm">
            <span>GRSTOR Gamma</span>
            <span className="text-[8px]">▼</span>
          </div>
        </div>

        {/* Bottom Right Settings */}
        <div className="absolute right-3 bottom-3 z-30">
          <button className="w-9 h-9 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-all backdrop-blur-sm">
            <span className="text-sm">⚙️</span>
          </button>
        </div>

        {/* Hovered Location Tooltip */}
        {hoveredLocation && (
          <div
            className="absolute z-40 px-3 py-1.5 bg-slate-900/95 border border-cyan-500/50 rounded-lg shadow-xl pointer-events-none backdrop-blur-sm"
            style={{
              left: `${hoveredLocation.x + hoveredLocation.width / 2}%`,
              top: `${hoveredLocation.y - 5}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="text-sm text-white font-bold">{hoveredLocation.name}</span>
          </div>
        )}

        {/* Selected Location Panel */}
        {selectedLocation && (
          <div className="absolute top-4 right-14 w-56 bg-slate-900/95 border border-cyan-500/50 rounded-lg shadow-2xl z-40 overflow-hidden backdrop-blur-sm">
            <div className="p-3 bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">{selectedLocation.name}</h3>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-slate-400 hover:text-white transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <button className="w-full px-3 py-2 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-xs font-bold">
                Enter Zone
              </button>
              <button className="w-full px-3 py-2 rounded bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors text-xs">
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceBaseMapView;
