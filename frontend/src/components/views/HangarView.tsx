import React, { useState, useRef, useEffect } from 'react';
import anime from 'animejs';
import { ShipCard } from '../ShipCard';
import type { Ship } from '../../types';
import { ShipClass } from '../../types';
import { useMockActions } from '../../hooks/useMockActions';

/**
 * Hangar View Component
 * Ship management, module installation, docking
 * Enhanced with anime.js animations
 */

// Demo ships for display
const DEMO_SHIPS: Ship[] = [
  {
    id: '0xship1',
    name: 'Shadow Runner',
    shipClass: ShipClass.Cruiser,
    modules: { hull: '0xhull1', engine: '0xengine1', aiCore: null, weapon: '0xweapon1', utility: null },
    maxHealth: 350,
    currentHealth: 280,
    speed: 60,
    firepower: 45,
    cargoCapacity: 150,
    fuelEfficiency: 120,
    pilot: '0xpilot1',
    crew: ['0xcrew1', '0xcrew2'],
    maxCrew: 5,
    isDocked: false,
    dockedAt: null,
    inCombat: false,
    fuel: 85,
    maxFuel: 150,
  },
  {
    id: '0xship2',
    name: 'Stellar Phoenix',
    shipClass: ShipClass.Fighter,
    modules: { hull: '0xhull2', engine: '0xengine2', aiCore: '0xai1', weapon: '0xweapon2', utility: null },
    maxHealth: 180,
    currentHealth: 180,
    speed: 95,
    firepower: 65,
    cargoCapacity: 30,
    fuelEfficiency: 85,
    pilot: '0xpilot2',
    crew: [],
    maxCrew: 2,
    isDocked: true,
    dockedAt: '0xstation1',
    inCombat: false,
    fuel: 120,
    maxFuel: 120,
  },
  {
    id: '0xship3',
    name: 'Cargo Whale',
    shipClass: ShipClass.Freighter,
    modules: { hull: '0xhull3', engine: '0xengine3', aiCore: null, weapon: null, utility: '0xutil1' },
    maxHealth: 500,
    currentHealth: 450,
    speed: 35,
    firepower: 10,
    cargoCapacity: 500,
    fuelEfficiency: 60,
    pilot: null,
    crew: [],
    maxCrew: 8,
    isDocked: true,
    dockedAt: '0xstation2',
    inCombat: false,
    fuel: 200,
    maxFuel: 300,
  },
];

const SHIP_CLASS_BLUEPRINTS = [
  { class: ShipClass.Scout, name: 'Scout', cost: 5000, icon: '🔍' },
  { class: ShipClass.Fighter, name: 'Fighter', cost: 15000, icon: '⚔️' },
  { class: ShipClass.Freighter, name: 'Freighter', cost: 25000, icon: '📦' },
  { class: ShipClass.Cruiser, name: 'Cruiser', cost: 50000, icon: '🚀' },
  { class: ShipClass.Battleship, name: 'Battleship', cost: 100000, icon: '💥' },
  { class: ShipClass.Carrier, name: 'Carrier', cost: 150000, icon: '🛸' },
  { class: ShipClass.Dreadnought, name: 'Dreadnought', cost: 300000, icon: '☠️' },
];

export const HangarView: React.FC = () => {
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [viewMode, setViewMode] = useState<'fleet' | 'build'>('fleet');
  const { buildShip, repairShip, refuelShip, deployShip, recallShip } = useMockActions();

  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

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

    if (statsRef.current) {
      const statCards = statsRef.current.querySelectorAll('.stat-card');
      anime({
        targets: statCards,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(80, { start: 200 }),
        easing: 'easeOutCubic',
      });
    }

    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.ship-card-wrapper');
      anime({
        targets: cards,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(100, { start: 400 }),
        easing: 'easeOutCubic',
      });
    }
  }, [viewMode]);

  // Animate actions panel when ship is selected
  useEffect(() => {
    if (actionsRef.current && selectedShip) {
      anime({
        targets: actionsRef.current,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutCubic',
      });
    }
  }, [selectedShip]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">🚀</span>
          Ship Hangar
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('fleet')}
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'fleet'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
          >
            My Fleet
          </button>
          <button
            onClick={() => setViewMode('build')}
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'build'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
          >
            Shipyard
          </button>
        </div>
      </div>

      {viewMode === 'fleet' ? (
        <>
          {/* Fleet Stats */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-card p-3 rounded-lg bg-blue-500/10 border border-blue-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-blue-400">{DEMO_SHIPS.length}</div>
              <div className="text-xs text-slate-400">Total Ships</div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-green-500/10 border border-green-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-green-400">{DEMO_SHIPS.filter(s => s.isDocked).length}</div>
              <div className="text-xs text-slate-400">Docked</div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-orange-500/10 border border-orange-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-orange-400">{DEMO_SHIPS.reduce((sum, s) => sum + s.firepower, 0)}</div>
              <div className="text-xs text-slate-400">Total Firepower</div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-purple-500/10 border border-purple-500/30" style={{ opacity: 0 }}>
              <div className="text-2xl font-bold text-purple-400">{DEMO_SHIPS.reduce((sum, s) => sum + s.cargoCapacity, 0)}</div>
              <div className="text-xs text-slate-400">Cargo Capacity</div>
            </div>
          </div>

          {/* Ship Grid */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_SHIPS.map((ship) => (
              <div key={ship.id} className="ship-card-wrapper" style={{ opacity: 0 }}>
                <ShipCard
                  ship={ship}
                  isSelected={selectedShip?.id === ship.id}
                  onClick={() => setSelectedShip(ship)}
                />
              </div>
            ))}
          </div>

          {/* Selected Ship Actions */}
          {selectedShip && (
            <div ref={actionsRef} className="p-4 rounded-lg bg-slate-900/80 border border-blue-500/30" style={{ opacity: 0 }}>
              <h3 className="text-lg font-bold text-white mb-3">Ship Actions: {selectedShip.name}</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => repairShip(selectedShip.id)} className="px-4 py-2 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm">
                  🔧 Repair Hull
                </button>
                <button onClick={() => refuelShip(selectedShip.id)} className="px-4 py-2 rounded bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm">
                  ⛽ Refuel
                </button>
                <button onClick={() => repairShip(selectedShip.id)} className="px-4 py-2 rounded bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm">
                  📦 Manage Modules
                </button>
                <button onClick={() => deployShip(selectedShip.id)} className="px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                  👥 Assign Crew
                </button>
                <button onClick={() => selectedShip.isDocked ? deployShip(selectedShip.id) : recallShip(selectedShip.id)} className="px-4 py-2 rounded bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
                  {selectedShip.isDocked ? '🚀 Launch' : '🏠 Dock'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Shipyard */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Build New Ship</h3>
              <div className="text-sm text-slate-400">
                Your Balance: <span className="text-cyan-400 font-bold">125,000</span> GALACTIC
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {SHIP_CLASS_BLUEPRINTS.map((blueprint) => (
                <div
                  key={blueprint.class}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{blueprint.icon}</span>
                    <div>
                      <h4 className="font-bold text-white">{blueprint.name}</h4>
                      <p className="text-xs text-slate-400">Class Blueprint</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <div className="text-sm">
                      <span className="text-slate-400">Cost: </span>
                      <span className="text-cyan-400 font-bold">{blueprint.cost.toLocaleString()}</span>
                    </div>
                    <button onClick={() => buildShip(blueprint.name)} className="px-3 py-1 rounded bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs">
                      Build
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Shop */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Module Shop</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { type: 'Hull', icon: '🛡️', className: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' },
                { type: 'Engine', icon: '⚡', className: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20' },
                { type: 'AI Core', icon: '🧠', className: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20' },
                { type: 'Weapon', icon: '🔫', className: 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' },
                { type: 'Utility', icon: '🔧', className: 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20' },
              ].map((module) => (
                <button
                  key={module.type}
                  className={`p-3 rounded-lg border transition-all ${module.className}`}
                >
                  <div className="text-2xl mb-1">{module.icon}</div>
                  <div className="text-sm text-white">{module.type}</div>
                  <div className="text-xs text-slate-400">Browse</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HangarView;
