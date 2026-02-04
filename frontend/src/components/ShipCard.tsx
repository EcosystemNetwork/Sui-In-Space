import React, { useRef, useEffect } from 'react';
import anime from 'animejs';
import type { Ship, ShipClass } from '../types';

/**
 * Ship Card Component
 * Displays ship information with holographic UI styling
 * Enhanced with anime.js animations and futuristic sci-fi HUD design
 */

interface ShipCardProps {
  ship: Ship;
  isSelected?: boolean;
  onClick?: () => void;
}

const CLASS_NAMES: Record<ShipClass, string> = {
  0: 'Scout',
  1: 'Fighter',
  2: 'Freighter',
  3: 'Cruiser',
  4: 'Battleship',
  5: 'Carrier',
  6: 'Dreadnought',
};

const CLASS_ICONS: Record<ShipClass, string> = {
  0: '🔍',
  1: '⚔️',
  2: '📦',
  3: '🚀',
  4: '💥',
  5: '🛸',
  6: '☠️',
};

export const ShipCard: React.FC<ShipCardProps> = ({ ship, isSelected, onClick }) => {
  const healthPercentage = (ship.currentHealth / ship.maxHealth) * 100;
  const fuelPercentage = (ship.fuel / ship.maxFuel) * 100;
  const combatRating = Math.floor((ship.maxHealth / 10) + (ship.firepower * 2) + (ship.speed / 5));
  
  const cardRef = useRef<HTMLDivElement>(null);
  const healthBarRef = useRef<HTMLDivElement>(null);
  const fuelBarRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<HTMLDivElement[]>([]);
  
  // Animate progress bars on mount
  useEffect(() => {
    if (healthBarRef.current) {
      anime({
        targets: healthBarRef.current,
        width: [`0%`, `${healthPercentage}%`],
        duration: 800,
        easing: 'easeOutCubic',
        delay: 200,
      });
    }
    if (fuelBarRef.current) {
      anime({
        targets: fuelBarRef.current,
        width: [`0%`, `${fuelPercentage}%`],
        duration: 800,
        easing: 'easeOutCubic',
        delay: 300,
      });
    }
  }, [healthPercentage, fuelPercentage]);
  
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
        // Animate corners glow
        anime({
          targets: cornersRef.current,
          borderColor: ['rgba(0, 128, 255, 0.5)', 'rgba(0, 128, 255, 1)'],
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
          ? 'border-[#0080ff] shadow-[0_0_20px_rgba(0,128,255,0.3)]' 
          : 'border-[#0080ff]/30 hover:border-[#0080ff]/60'
        }
        transition-all duration-300
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* HUD corner accents */}
      <div ref={el => { if (el) cornersRef.current[0] = el; }} className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#0080ff]/60 rounded-tl" />
      <div ref={el => { if (el) cornersRef.current[1] = el; }} className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#0080ff]/60 rounded-tr" />
      <div ref={el => { if (el) cornersRef.current[2] = el; }} className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#0080ff]/60 rounded-bl" />
      <div ref={el => { if (el) cornersRef.current[3] = el; }} className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#0080ff]/60 rounded-br" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CLASS_ICONS[ship.shipClass]}</span>
          <div>
            <h3 className="text-lg font-display font-bold text-[#e0f7ff]">{ship.name}</h3>
            <p className="text-sm text-[#0080ff] font-semibold">{CLASS_NAMES[ship.shipClass]}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-display font-bold text-[#ff9500]">
            ⚔️ {combatRating}
          </div>
          <div className="text-xs text-[#00f0ff]/50 font-mono">COMBAT RATING</div>
        </div>
      </div>

      {/* Health & Fuel Bars */}
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#00f0ff]/50 font-mono">HULL INTEGRITY</span>
            <span className={`font-display font-bold ${healthPercentage < 30 ? 'text-[#ff2d55]' : 'text-[#00ff9d]'}`}>
              {ship.currentHealth}/{ship.maxHealth}
            </span>
          </div>
          <div className="h-1.5 bg-[#001a30] rounded-full overflow-hidden border border-[#00f0ff]/20">
            <div 
              ref={healthBarRef}
              className={`h-full rounded-full ${
                healthPercentage < 30 ? 'bg-[#ff2d55]' : healthPercentage < 60 ? 'bg-[#ffd60a]' : 'bg-[#00ff9d]'
              }`}
              style={{ width: '0%' }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#00f0ff]/50 font-mono">FUEL</span>
            <span className={`font-display font-bold ${fuelPercentage < 20 ? 'text-[#ff2d55]' : 'text-[#00f0ff]'}`}>
              {ship.fuel}/{ship.maxFuel}
            </span>
          </div>
          <div className="h-1.5 bg-[#001a30] rounded-full overflow-hidden border border-[#00f0ff]/20">
            <div 
              ref={fuelBarRef}
              className={`h-full rounded-full ${
                fuelPercentage < 20 ? 'bg-[#ff2d55]' : 'bg-[#00f0ff]'
              }`}
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-[#00f0ff]/50 font-mono text-xs">SPEED</span>
          <span className="text-[#e0f7ff] font-display font-bold">{ship.speed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#00f0ff]/50 font-mono text-xs">FIREPOWER</span>
          <span className="text-[#ff9500] font-display font-bold">{ship.firepower}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#00f0ff]/50 font-mono text-xs">CARGO</span>
          <span className="text-[#e0f7ff] font-display font-bold">{ship.cargoCapacity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#00f0ff]/50 font-mono text-xs">EFFICIENCY</span>
          <span className="text-[#00ff9d] font-display font-bold">{ship.fuelEfficiency}%</span>
        </div>
      </div>

      {/* Module Slots */}
      <div className="border-t border-[#00f0ff]/20 pt-2 mb-2">
        <div className="text-xs text-[#00f0ff]/50 mb-1 font-mono">MODULES</div>
        <div className="flex gap-1">
          <ModuleSlot label="H" filled={!!ship.modules.hull} />
          <ModuleSlot label="E" filled={!!ship.modules.engine} />
          <ModuleSlot label="AI" filled={!!ship.modules.aiCore} />
          <ModuleSlot label="W" filled={!!ship.modules.weapon} />
          <ModuleSlot label="U" filled={!!ship.modules.utility} />
        </div>
      </div>

      {/* Crew & Status */}
      <div className="flex justify-between items-center pt-2 border-t border-[#00f0ff]/20">
        <div className="text-xs font-mono">
          <span className="text-[#00f0ff]/50">CREW: </span>
          <span className="text-[#e0f7ff]">{ship.crew.length}/{ship.maxCrew}</span>
          {ship.pilot && <span className="text-[#00ff9d] ml-2">● PILOTED</span>}
        </div>
        <div className="flex gap-2">
          {ship.isDocked && (
            <span className="px-2 py-0.5 text-xs rounded bg-[#0080ff]/10 text-[#0080ff] border border-[#0080ff]/50 font-mono">
              DOCKED
            </span>
          )}
          {ship.inCombat && (
            <span className="px-2 py-0.5 text-xs rounded bg-[#ff2d55]/10 text-[#ff2d55] border border-[#ff2d55]/50 animate-pulse font-mono">
              COMBAT
            </span>
          )}
          {ship.currentHealth === 0 && (
            <span className="px-2 py-0.5 text-xs rounded bg-[#ff2d55]/10 text-[#ff2d55] border border-[#ff2d55]/50 font-mono">
              DESTROYED
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface ModuleSlotProps {
  label: string;
  filled: boolean;
}

const ModuleSlot: React.FC<ModuleSlotProps> = ({ label, filled }) => (
  <div 
    className={`
      w-8 h-8 flex items-center justify-center rounded text-xs font-mono font-bold
      ${filled 
        ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/50' 
        : 'bg-[#001a30]/50 text-[#00f0ff]/30 border border-[#00f0ff]/20'
      }
    `}
  >
    {label}
  </div>
);

export default ShipCard;
