import React, { useRef, useEffect } from 'react';
import anime from 'animejs';
import type { Ship, ShipClass } from '../types';

/**
 * Ship Card Component
 * Displays ship information with holographic UI styling
 * Enhanced with anime.js animations
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
          borderColor: ['rgba(96, 165, 250, 0.5)', 'rgba(96, 165, 250, 1)'],
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
        bg-gradient-to-br from-slate-900/90 to-slate-800/90
        ${isSelected 
          ? 'border-blue-400 shadow-lg shadow-blue-400/20' 
          : 'border-slate-700 hover:border-blue-400/50'
        }
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Holographic corner accents */}
      <div ref={el => { if (el) cornersRef.current[0] = el; }} className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl" />
      <div ref={el => { if (el) cornersRef.current[1] = el; }} className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr" />
      <div ref={el => { if (el) cornersRef.current[2] = el; }} className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl" />
      <div ref={el => { if (el) cornersRef.current[3] = el; }} className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CLASS_ICONS[ship.shipClass]}</span>
          <div>
            <h3 className="text-lg font-bold text-white">{ship.name}</h3>
            <p className="text-sm text-blue-400">{CLASS_NAMES[ship.shipClass]}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-orange-400">
            ⚔️ {combatRating}
          </div>
          <div className="text-xs text-slate-400">Combat Rating</div>
        </div>
      </div>

      {/* Health & Fuel Bars */}
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Hull Integrity</span>
            <span className={healthPercentage < 30 ? 'text-red-400' : 'text-green-400'}>
              {ship.currentHealth}/{ship.maxHealth}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              ref={healthBarRef}
              className={`h-full rounded-full ${
                healthPercentage < 30 ? 'bg-red-500' : healthPercentage < 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: '0%' }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Fuel</span>
            <span className={fuelPercentage < 20 ? 'text-red-400' : 'text-cyan-400'}>
              {ship.fuel}/{ship.maxFuel}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              ref={fuelBarRef}
              className={`h-full rounded-full ${
                fuelPercentage < 20 ? 'bg-red-500' : 'bg-cyan-500'
              }`}
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-slate-400">Speed</span>
          <span className="text-white">{ship.speed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Firepower</span>
          <span className="text-orange-400">{ship.firepower}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Cargo</span>
          <span className="text-white">{ship.cargoCapacity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Efficiency</span>
          <span className="text-green-400">{ship.fuelEfficiency}%</span>
        </div>
      </div>

      {/* Module Slots */}
      <div className="border-t border-slate-700 pt-2 mb-2">
        <div className="text-xs text-slate-400 mb-1">Modules</div>
        <div className="flex gap-1">
          <ModuleSlot label="H" filled={!!ship.modules.hull} />
          <ModuleSlot label="E" filled={!!ship.modules.engine} />
          <ModuleSlot label="AI" filled={!!ship.modules.aiCore} />
          <ModuleSlot label="W" filled={!!ship.modules.weapon} />
          <ModuleSlot label="U" filled={!!ship.modules.utility} />
        </div>
      </div>

      {/* Crew & Status */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-700">
        <div className="text-xs">
          <span className="text-slate-400">Crew: </span>
          <span className="text-white">{ship.crew.length}/{ship.maxCrew}</span>
          {ship.pilot && <span className="text-green-400 ml-2">● Piloted</span>}
        </div>
        <div className="flex gap-2">
          {ship.isDocked && (
            <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/50">
              DOCKED
            </span>
          )}
          {ship.inCombat && (
            <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse">
              COMBAT
            </span>
          )}
          {ship.currentHealth === 0 && (
            <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/50">
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
      w-8 h-8 flex items-center justify-center rounded text-xs font-bold
      ${filled 
        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
        : 'bg-slate-700/50 text-slate-500 border border-slate-600'
      }
    `}
  >
    {label}
  </div>
);

export default ShipCard;
