import React, { useState, useRef, useEffect, useCallback } from 'react';
import { animate, stagger } from 'animejs';

/**
 * Character Minter View Component
 * D&D × Warhammer 40K Fusion Character Minting Interface
 * Gothic cathedral meets starship control deck aesthetic
 */

// ============ Data Constants ============

interface Archetype {
  id: string;
  name: string;
  icon: string;
  description: string;
  statBias: Partial<Record<StatKey, number>>;
}

interface Race {
  id: string;
  name: string;
  icon: string;
  trait: string;
}

interface WeaponOption {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface ArmorTier {
  id: string;
  name: string;
  color: string;
  textColor: string;
  description: string;
}

type StatKey = 'strength' | 'faith' | 'psyPower' | 'machineAffinity' | 'corruption' | 'luck';

interface CharacterStats {
  strength: number;
  faith: number;
  psyPower: number;
  machineAffinity: number;
  corruption: number;
  luck: number;
}

type MintPhase = 'configure' | 'minting' | 'complete';

const GENE_SEQUENCE_LENGTH = 32;

const ARCHETYPES: Archetype[] = [
  { id: 'void-paladin', name: 'Void Paladin', icon: '🛡️', description: 'Holy warrior in powered exoskeleton, wielding faith and ceramite', statBias: { strength: 15, faith: 20 } },
  { id: 'techno-cleric', name: 'Techno-Cleric', icon: '⚙️', description: 'Machine-priest channeling the divine through neural implants', statBias: { faith: 15, machineAffinity: 20 } },
  { id: 'psyker-sorcerer', name: 'Psyker Sorcerer', icon: '🔮', description: 'Warp-touched mage wielding devastating psychic powers', statBias: { psyPower: 25, corruption: 10 } },
  { id: 'gene-barbarian', name: 'Gene-Enhanced Barbarian', icon: '💪', description: 'Bio-engineered berserker with unmatched physical prowess', statBias: { strength: 25, luck: 10 } },
  { id: 'cyber-necromancer', name: 'Cyber-Necromancer', icon: '💀', description: 'Master of machine-bound undead and forbidden techno-sorcery', statBias: { machineAffinity: 15, corruption: 20 } },
  { id: 'warp-assassin', name: 'Warp Assassin', icon: '🗡️', description: 'Shadow operative who phases through reality itself', statBias: { psyPower: 10, luck: 20, corruption: 5 } },
];

const RACES: Race[] = [
  { id: 'augmented-human', name: 'Augmented Human', icon: '🧑‍🚀', trait: '+5 Machine Affinity' },
  { id: 'void-elf', name: 'Void Elf', icon: '🧝', trait: '+5 Psy Power' },
  { id: 'chaos-mutant', name: 'Chaos-Touched Mutant', icon: '👹', trait: '+8 Corruption, +3 Strength' },
  { id: 'bio-knight', name: 'Bio-Engineered Knight', icon: '🤖', trait: '+5 Strength, +3 Faith' },
  { id: 'machine-undead', name: 'Machine-Bound Undead', icon: '⚰️', trait: '+5 Machine Affinity, +5 Corruption' },
];

const WEAPONS: WeaponOption[] = [
  { id: 'chainsword', name: 'Chain-Sword of Glyphs', icon: '⚔️', type: 'Melee' },
  { id: 'plasma-staff', name: 'Plasma Staff', icon: '🔱', type: 'Ranged' },
  { id: 'bolt-rifle', name: 'Mana-Core Bolt Rifle', icon: '🔫', type: 'Ranged' },
  { id: 'warp-hammer', name: 'Warp-Forged Hammer', icon: '🔨', type: 'Melee' },
];

const ARMOR_TIERS: ArmorTier[] = [
  { id: 'relic', name: 'Relic', color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10', textColor: 'text-yellow-400', description: 'Ancient and holy' },
  { id: 'sanctified', name: 'Sanctified', color: 'text-blue-400 border-blue-500/50 bg-blue-500/10', textColor: 'text-blue-400', description: 'Blessed by clerics' },
  { id: 'corrupted', name: 'Corrupted', color: 'text-purple-400 border-purple-500/50 bg-purple-500/10', textColor: 'text-purple-400', description: 'Tainted by the warp' },
  { id: 'heretical', name: 'Heretical', color: 'text-red-400 border-red-500/50 bg-red-500/10', textColor: 'text-red-400', description: 'Forbidden power' },
];

const STAT_CONFIG: { key: StatKey; label: string; icon: string; color: string }[] = [
  { key: 'strength', label: 'Strength', icon: '💪', color: 'bg-red-500' },
  { key: 'faith', label: 'Faith', icon: '✝️', color: 'bg-yellow-500' },
  { key: 'psyPower', label: 'Psy Power', icon: '🔮', color: 'bg-purple-500' },
  { key: 'machineAffinity', label: 'Machine Affinity', icon: '⚙️', color: 'bg-cyan-500' },
  { key: 'corruption', label: 'Corruption', icon: '☠️', color: 'bg-red-700' },
  { key: 'luck', label: 'Luck', icon: '🍀', color: 'bg-green-500' },
];

const ALLEGIANCES = [
  { id: 'order', name: 'Order', icon: '⚜️', color: 'text-yellow-400' },
  { id: 'neutral', name: 'Neutral', icon: '⚖️', color: 'text-slate-400' },
  { id: 'chaos', name: 'Chaos', icon: '🌀', color: 'text-red-400' },
];

// ============ Utility Functions ============

const generateRandomStats = (archetype: Archetype | null): CharacterStats => {
  const base: CharacterStats = {
    strength: 10 + Math.floor(Math.random() * 30),
    faith: 10 + Math.floor(Math.random() * 30),
    psyPower: 10 + Math.floor(Math.random() * 30),
    machineAffinity: 10 + Math.floor(Math.random() * 30),
    corruption: Math.floor(Math.random() * 25),
    luck: 10 + Math.floor(Math.random() * 30),
  };
  if (archetype) {
    for (const [key, bonus] of Object.entries(archetype.statBias)) {
      base[key as StatKey] = Math.min(100, base[key as StatKey] + bonus);
    }
  }
  return base;
};

const generateOriginStory = (archetype: Archetype | null, race: Race | null): string => {
  const origins = [
    'Born in the void between stars, forged in the fires of a dying sun.',
    'Salvaged from a derelict cathedral-ship drifting through the warp.',
    'Created in a forbidden gene-lab beneath the ruined spires of a hive world.',
    'Awakened from millennia of stasis in an ancient reliquary vault.',
    'Emerged from the warp storms that consumed the Seventh Crusade.',
    'Discovered in the depths of a machine-temple by wandering tech-priests.',
  ];
  const archetypeFlavor = archetype ? ` As a ${archetype.name}, their destiny was sealed.` : '';
  const raceFlavor = race ? ` The blood of the ${race.name} runs through their veins.` : '';
  return origins[Math.floor(Math.random() * origins.length)] + archetypeFlavor + raceFlavor;
};

// ============ Sub-Components ============

const RuneCircle: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`rune-circle absolute inset-0 pointer-events-none transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
    <svg viewBox="0 0 200 200" className="w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="8 4" />
      <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="1" strokeDasharray="4 8" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <text
          key={deg}
          x="100"
          y="18"
          textAnchor="middle"
          fill="rgba(139,92,246,0.6)"
          fontSize="8"
          transform={`rotate(${deg} 100 100)`}
        >
          ᛟ
        </text>
      ))}
    </svg>
  </div>
);

const DNAHelix: React.FC = () => (
  <div className="dna-helix flex justify-center my-4">
    <div className="relative w-16 h-32">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="absolute w-full flex justify-between items-center"
          style={{ top: `${i * 12.5}%`, animation: `dna-twist 2s ease-in-out ${i * 0.25}s infinite alternate` }}
        >
          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500 via-red-500 to-purple-500 mx-1 opacity-50" />
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
        </div>
      ))}
    </div>
  </div>
);

const StatBar: React.FC<{ stat: typeof STAT_CONFIG[0]; value: number; animated: boolean }> = ({ stat, value, animated }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm w-5 text-center">{stat.icon}</span>
    <span className="text-xs text-slate-400 w-28 truncate">{stat.label}</span>
    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${stat.color}`}
        style={{ width: animated ? `${value}%` : '0%' }}
      />
    </div>
    <span className="text-xs text-slate-300 w-8 text-right font-mono">{value}</span>
  </div>
);

// ============ Main Component ============

export const CharacterMinterView: React.FC = () => {
  // Selection state
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponOption | null>(null);
  const [selectedArmor, setSelectedArmor] = useState<ArmorTier | null>(null);
  const [purityLevel, setPurityLevel] = useState(50);
  const [allegiance, setAllegiance] = useState('neutral');

  // Minting state
  const [mintPhase, setMintPhase] = useState<MintPhase>('configure');
  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [originStory, setOriginStory] = useState('');
  const [statsAnimated, setStatsAnimated] = useState(false);

  // Refs for animations
  const headerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const mintingOverlayRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Initial entrance animations
  useEffect(() => {
    if (headerRef.current) {
      animate(headerRef.current, {
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        ease: 'outCubic',
      });
    }
    if (configRef.current) {
      const sections = configRef.current.querySelectorAll('.config-section');
      animate(sections, {
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 500,
        delay: stagger(100, { start: 200 }),
        ease: 'outCubic',
      });
    }
  }, []);

  // Animate preview when selections change
  useEffect(() => {
    if (previewRef.current) {
      animate(previewRef.current, {
        scale: [0.98, 1],
        opacity: [0.7, 1],
        duration: 300,
        ease: 'outCubic',
      });
    }
  }, [selectedArchetype, selectedRace, selectedWeapon, selectedArmor, purityLevel]);

  const handleRandomizeStats = useCallback(() => {
    const newStats = generateRandomStats(selectedArchetype);
    setStats(newStats);
    setStatsAnimated(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setStatsAnimated(true));
    });
  }, [selectedArchetype]);

  const handleMint = useCallback(() => {
    if (!selectedArchetype || !selectedRace) return;

    const finalStats = stats || generateRandomStats(selectedArchetype);
    setStats(finalStats);
    setOriginStory(generateOriginStory(selectedArchetype, selectedRace));
    setMintPhase('minting');

    // Minting ritual animation
    if (mintingOverlayRef.current) {
      animate(mintingOverlayRef.current, {
        opacity: [0, 1],
        duration: 500,
        ease: 'inOutQuad',
      });
    }

    // After minting animation, show result
    setTimeout(() => {
      setMintPhase('complete');
      setStatsAnimated(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setStatsAnimated(true));
      });
      if (resultRef.current) {
        animate(resultRef.current, {
          translateY: [40, 0],
          opacity: [0, 1],
          duration: 800,
          ease: 'outCubic',
        });
      }
    }, 3000);
  }, [selectedArchetype, selectedRace, stats]);

  const handleReset = useCallback(() => {
    setMintPhase('configure');
    setStats(null);
    setStatsAnimated(false);
    setSelectedArchetype(null);
    setSelectedRace(null);
    setSelectedWeapon(null);
    setSelectedArmor(null);
    setPurityLevel(50);
    setAllegiance('neutral');
    setOriginStory('');
  }, []);

  const canMint = selectedArchetype && selectedRace;

  // ============ Minting Overlay ============
  if (mintPhase === 'minting') {
    return (
      <div ref={mintingOverlayRef} className="relative flex flex-col items-center justify-center min-h-[60vh] text-center" style={{ opacity: 0 }}>
        {/* Rune circle background */}
        <div className="relative w-64 h-64 mb-8">
          <RuneCircle active={true} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl minting-icon-pulse">{selectedArchetype?.icon}</span>
          </div>
        </div>

        <DNAHelix />

        <h2 className="text-2xl font-bold text-purple-400 text-glow mb-2">
          ⛧ Initiating Forbidden Rite ⛧
        </h2>
        <p className="text-slate-400 text-sm max-w-md">
          The gene-forges ignite… arcane runes burn into ceramite plating…
          a new warrior is born from the union of faith and machine.
        </p>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 rounded-full minting-progress" />
        </div>
        <p className="text-xs text-slate-500 mt-2 font-mono">BINDING SOUL TO VESSEL...</p>
      </div>
    );
  }

  // ============ Minting Complete ============
  if (mintPhase === 'complete' && stats) {
    return (
      <div ref={resultRef} className="space-y-6" style={{ opacity: 0 }}>
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-yellow-400 text-glow mb-1">⚜️ Character Forged ⚜️</h2>
          <p className="text-slate-400 text-sm">The rite is complete. A new champion rises.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Character Card */}
          <div className="p-6 rounded-lg bg-slate-900/90 border border-yellow-500/30 relative overflow-hidden">
            <RuneCircle active={true} />
            <div className="relative z-10">
              <div className="text-center mb-4">
                <span className="text-6xl block mb-3">{selectedArchetype?.icon}</span>
                <h3 className="text-xl font-bold text-white">{selectedArchetype?.name}</h3>
                <p className="text-sm text-slate-400">{selectedRace?.name} • {selectedRace?.icon}</p>
                <div className="mt-2 flex justify-center gap-2">
                  {selectedWeapon && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 text-slate-300">
                      {selectedWeapon.icon} {selectedWeapon.name}
                    </span>
                  )}
                  {selectedArmor && (
                    <span className={`px-2 py-0.5 rounded text-xs border ${selectedArmor.color}`}>
                      {selectedArmor.name} Armor
                    </span>
                  )}
                </div>
              </div>

              {/* Allegiance */}
              <div className="text-center mb-4">
                <span className={`text-sm font-medium ${ALLEGIANCES.find(a => a.id === allegiance)?.color}`}>
                  {ALLEGIANCES.find(a => a.id === allegiance)?.icon} {ALLEGIANCES.find(a => a.id === allegiance)?.name}
                </span>
              </div>

              {/* Purity / Corruption meter */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-yellow-400">✦ Purity</span>
                  <span className="text-red-400">Corruption ☠️</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${purityLevel}%`,
                      background: `linear-gradient(to right, #eab308, ${purityLevel < 50 ? '#ef4444' : '#3b82f6'})`,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {STAT_CONFIG.map((stat) => (
                  <StatBar key={stat.key} stat={stat} value={stats[stat.key]} animated={statsAnimated} />
                ))}
              </div>
            </div>
          </div>

          {/* Origin & Lore */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700">
              <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                <span className="text-yellow-400">📜</span> Origin Story
              </h4>
              <p className="text-sm text-slate-400 italic leading-relaxed">"{originStory}"</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700">
              <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                <span className="text-purple-400">🧬</span> Gene-Sequence
              </h4>
              <p className="text-xs text-slate-500 font-mono break-all">
                {`0x${Array.from({ length: GENE_SEQUENCE_LENGTH }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700">
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <span className="text-cyan-400">📊</span> Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Archetype</span><span className="text-white">{selectedArchetype?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Race</span><span className="text-white">{selectedRace?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Weapon</span><span className="text-white">{selectedWeapon?.name || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Armor</span><span className="text-white">{selectedArmor?.name || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Allegiance</span><span className="text-white">{ALLEGIANCES.find(a => a.id === allegiance)?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Purity</span><span className="text-white">{purityLevel}%</span></div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-4 py-3 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm font-bold"
            >
              🧬 Forge Another Character
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ Configuration Phase ============
  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={headerRef} className="flex justify-between items-center" style={{ opacity: 0 }}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">🧬</span>
          Character Minter
          <span className="text-xs font-normal text-slate-500 ml-2">D&D × Warhammer 40K Fusion</span>
        </h2>
      </div>

      <div ref={configRef}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Selections */}
          <div className="lg:col-span-2 space-y-4">
            {/* Archetype Selection */}
            <div className="config-section p-4 rounded-lg bg-slate-900/80 border border-slate-700" style={{ opacity: 0 }}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">🎭</span> Choose Archetype
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ARCHETYPES.map((arch) => (
                  <button
                    key={arch.id}
                    onClick={() => setSelectedArchetype(arch)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      selectedArchetype?.id === arch.id
                        ? 'bg-purple-500/20 border-purple-500/60 shadow-lg shadow-purple-500/10'
                        : 'bg-slate-800/50 border-slate-700 hover:border-purple-500/30 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{arch.icon}</span>
                      <span className="text-sm font-bold text-white">{arch.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{arch.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Race Selection */}
            <div className="config-section p-4 rounded-lg bg-slate-900/80 border border-slate-700" style={{ opacity: 0 }}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-cyan-400">👤</span> Choose Race
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RACES.map((race) => (
                  <button
                    key={race.id}
                    onClick={() => setSelectedRace(race)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      selectedRace?.id === race.id
                        ? 'bg-cyan-500/20 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/30 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{race.icon}</span>
                      <span className="text-sm font-bold text-white">{race.name}</span>
                    </div>
                    <p className="text-xs text-green-400">{race.trait}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weapon Selection */}
              <div className="config-section p-4 rounded-lg bg-slate-900/80 border border-slate-700" style={{ opacity: 0 }}>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-red-400">⚔️</span> Weapon
                </h3>
                <div className="space-y-2">
                  {WEAPONS.map((weapon) => (
                    <button
                      key={weapon.id}
                      onClick={() => setSelectedWeapon(weapon)}
                      className={`w-full p-2 rounded text-left transition-all border flex items-center gap-2 ${
                        selectedWeapon?.id === weapon.id
                          ? 'bg-red-500/15 border-red-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-red-500/30'
                      }`}
                    >
                      <span className="text-lg">{weapon.icon}</span>
                      <div>
                        <span className="text-xs font-medium text-white">{weapon.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({weapon.type})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Armor Tier */}
              <div className="config-section p-4 rounded-lg bg-slate-900/80 border border-slate-700" style={{ opacity: 0 }}>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-yellow-400">🛡️</span> Armor Tier
                </h3>
                <div className="space-y-2">
                  {ARMOR_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedArmor(tier)}
                      className={`w-full p-2 rounded text-left transition-all border flex items-center gap-3 ${
                        selectedArmor?.id === tier.id
                          ? tier.color
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className={`text-sm font-bold ${tier.textColor}`}>{tier.name}</span>
                      <span className="text-xs text-slate-500">{tier.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Purity / Corruption Slider & Allegiance */}
            <div className="config-section p-4 rounded-lg bg-slate-900/80 border border-slate-700" style={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purity slider */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-yellow-400">⚖️</span> Purity vs Corruption
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-red-400">☠️</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={purityLevel}
                      onChange={(e) => setPurityLevel(Number(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-purple-500"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #eab308 ${purityLevel}%, #1e293b ${purityLevel}%)`,
                      }}
                    />
                    <span className="text-xs text-yellow-400">✦</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-red-400">Corrupt ({100 - purityLevel}%)</span>
                    <span className="text-xs text-yellow-400">Pure ({purityLevel}%)</span>
                  </div>
                </div>

                {/* Allegiance */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-cyan-400">⚜️</span> Allegiance
                  </h3>
                  <div className="flex gap-2">
                    {ALLEGIANCES.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAllegiance(a.id)}
                        className={`flex-1 p-2 rounded text-center transition-all border ${
                          allegiance === a.id
                            ? 'bg-slate-800 border-slate-500'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <span className="block text-lg">{a.icon}</span>
                        <span className={`text-xs font-medium ${a.color}`}>{a.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-4">
            <div ref={previewRef} className="p-4 rounded-lg bg-slate-900/90 border border-purple-500/30 relative overflow-hidden">
              <RuneCircle active={!!selectedArchetype} />

              <div className="relative z-10">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-purple-400">👁️</span> Preview
                </h3>

                {/* Character Preview */}
                <div className="text-center py-4">
                  {selectedArchetype ? (
                    <>
                      <span className="text-6xl block mb-3">{selectedArchetype.icon}</span>
                      <h4 className="text-lg font-bold text-white">{selectedArchetype.name}</h4>
                      {selectedRace && <p className="text-xs text-slate-400">{selectedRace.icon} {selectedRace.name}</p>}
                      {selectedWeapon && <p className="text-xs text-red-400 mt-1">{selectedWeapon.icon} {selectedWeapon.name}</p>}
                      {selectedArmor && <p className={`text-xs mt-1 ${selectedArmor.textColor}`}>{selectedArmor.name} Armor</p>}
                    </>
                  ) : (
                    <div className="py-8">
                      <span className="text-5xl block mb-3 opacity-30">❓</span>
                      <p className="text-sm text-slate-500">Select an archetype to begin</p>
                    </div>
                  )}
                </div>

                {/* Allegiance indicator */}
                <div className="text-center mb-3">
                  <span className={`text-xs ${ALLEGIANCES.find(a => a.id === allegiance)?.color}`}>
                    {ALLEGIANCES.find(a => a.id === allegiance)?.icon} {ALLEGIANCES.find(a => a.id === allegiance)?.name}
                  </span>
                </div>

                {/* Mini purity bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-yellow-400">✦ Purity</span>
                    <span className="text-red-400">Corruption ☠️</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${purityLevel}%`,
                        background: `linear-gradient(to right, #eab308, ${purityLevel < 50 ? '#ef4444' : '#3b82f6'})`,
                      }}
                    />
                  </div>
                </div>

                {/* Stats Preview */}
                {stats ? (
                  <div className="space-y-1.5">
                    {STAT_CONFIG.map((stat) => (
                      <StatBar key={stat.key} stat={stat} value={stats[stat.key]} animated={statsAnimated} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">Roll stats to preview</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRandomizeStats}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-sm font-medium"
            >
              🎲 Roll Stats
            </button>

            <button
              onClick={handleMint}
              disabled={!canMint}
              className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                canMint
                  ? 'bg-gradient-to-r from-purple-600/30 to-red-600/30 border border-purple-500/50 text-purple-300 hover:from-purple-600/50 hover:to-red-600/50 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
            >
              {canMint ? '⛧ Begin the Rite of Forging ⛧' : 'Select Archetype & Race to Mint'}
            </button>

            {canMint && (
              <p className="text-xs text-slate-500 text-center">
                Cost: <span className="text-cyan-400 font-bold">50,000</span> GALACTIC
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterMinterView;
