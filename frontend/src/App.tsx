import React from 'react';
import Layout from './components/Layout';
import { AgentCard } from './components/AgentCard';
import { ShipCard } from './components/ShipCard';
import { AgentType, AgentClass, ShipClass } from './types';
import type { Agent, Ship } from './types';

/**
 * Main Application Component
 */
function App() {
  // Demo data for display
  const demoAgent: Agent = {
    id: '0x1234567890abcdef',
    name: 'Nova-7',
    agentType: AgentType.Cyborg,
    class: AgentClass.Hacker,
    stats: {
      processing: 48,
      mobility: 35,
      power: 22,
      resilience: 30,
      luck: 15,
      neuralBandwidth: 55,
    },
    level: 15,
    experience: 12450,
    firmwareVersion: 2,
    aiModelLineage: 'Prometheus-V3',
    augmentSlots: ['0xaug1', '0xaug2'],
    maxAugmentSlots: 3,
    missionsCompleted: 47,
    battlesWon: 12,
    totalEarnings: BigInt(125000000000000),
    isStaked: false,
    stakedAt: null,
    currentMission: null,
  };

  const demoShip: Ship = {
    id: '0xship1234567890',
    name: 'Shadow Runner',
    shipClass: ShipClass.Cruiser,
    modules: {
      hull: '0xhull1',
      engine: '0xengine1',
      aiCore: null,
      weapon: '0xweapon1',
      utility: null,
    },
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
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to the Galactic Frontier
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Build your empire across the stars. Command agents, pilot ships, conquer planets, 
            and shape the fate of the galaxy through DeFi-powered gameplay.
          </p>
        </section>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Value Locked" value="$12.4M" icon="💎" color="cyan" />
          <StatCard label="Active Players" value="24,847" icon="👥" color="blue" />
          <StatCard label="Planets Claimed" value="1,247" icon="🌍" color="green" />
          <StatCard label="Battles Today" value="3,891" icon="⚔️" color="orange" />
        </section>

        {/* Demo Components */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-400">▸</span>
            Your Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AgentCard agent={demoAgent} />
            <ShipCard ship={demoShip} />
          </div>
        </section>

        {/* Getting Started */}
        <section className="border border-slate-700 rounded-lg p-6 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard 
              step={1} 
              title="Connect Wallet" 
              description="Link your Sui wallet to access the galactic economy"
              icon="🔗"
            />
            <StepCard 
              step={2} 
              title="Mint Your Agent" 
              description="Create your first agent to begin your journey"
              icon="🤖"
            />
            <StepCard 
              step={3} 
              title="Start Earning" 
              description="Complete missions and stake for GALACTIC rewards"
              icon="💰"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton icon="🤖" label="Mint Agent" />
          <ActionButton icon="🚀" label="Build Ship" />
          <ActionButton icon="📜" label="View Missions" />
          <ActionButton icon="⚡" label="Stake Tokens" />
        </section>
      </div>
    </Layout>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: 'cyan' | 'blue' | 'green' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    cyan: 'border-cyan-500/30 bg-cyan-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    orange: 'border-orange-500/30 bg-orange-500/10',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
};

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  icon: string;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description, icon }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold">
      {step}
    </div>
    <div>
      <h4 className="font-bold text-white flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h4>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  </div>
);

interface ActionButtonProps {
  icon: string;
  label: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label }) => (
  <button className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-2">
    <span className="text-2xl">{icon}</span>
    <span className="text-sm text-white">{label}</span>
  </button>
);

export default App;
