# 🏗️ System Architecture

## Overview

Sui-In-Space is designed as a composable on-chain gaming protocol leveraging Sui's object-centric model. Every game asset is a Sui object with mutable state, enabling complex interactions and upgrades without requiring new contract deployments.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   React UI   │  │   Three.js   │  │  Sui Wallet  │  │   zkLogin    │    │
│  │ (Holographic)│  │  (3D Space)  │  │  Integration │  │   Social     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INDEXER LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Real-time Object State Indexing • Event-Driven Updates • GraphQL   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUI BLOCKCHAIN LAYER                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                        MOVE SMART CONTRACTS                            ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ││
│  │  │  GALACTIC   │  │    NFT      │  │    DeFi     │  │  GAMEPLAY   │  ││
│  │  │   TOKEN     │  │   ASSETS    │  │   SYSTEMS   │  │   SYSTEMS   │  ││
│  │  │             │  │             │  │             │  │             │  ││
│  │  │ • Minting   │  │ • Agents    │  │ • Staking   │  │ • Missions  │  ││
│  │  │ • Transfer  │  │ • Ships     │  │ • Liquidity │  │ • Combat    │  ││
│  │  │ • Burn      │  │ • Planets   │  │ • Yield     │  │ • Rewards   │  ││
│  │  │ • Governance│  │ • Stations  │  │ • Reactors  │  │ • Events    │  ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Move Module Architecture

### Core Modules

```
contracts/sources/
├── galactic_token.move    # Native GALACTIC token (Coin<GALACTIC>)
├── agent.move             # Agent NFT with stats, class, augmentations
├── ship.move              # Modular ship NFT with equipment slots
├── planet.move            # Planet NFT for resource extraction
├── station.move           # Space station NFT for yield farming
├── defi.move              # DeFi mechanics (staking, pools, yield)
├── missions.move          # PvE mission system
├── combat.move            # PvP battle system
└── governance.move        # DAO voting and proposals
```

### Module Dependencies

```
                    ┌──────────────────┐
                    │  galactic_token  │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │  agent   │      │   ship   │      │  planet  │
    └────┬─────┘      └────┬─────┘      └────┬─────┘
         │                 │                 │
         │    ┌────────────┴────────────┐    │
         │    │                         │    │
         ▼    ▼                         ▼    ▼
    ┌──────────┐                   ┌──────────┐
    │ missions │                   │  defi    │
    └────┬─────┘                   └────┬─────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
                 ┌──────────┐
                 │ governance│
                 └──────────┘
```

## NFT Object Schemas

### Agent Schema

```move
struct Agent has key, store {
    id: UID,
    name: String,
    class: AgentClass,
    
    // Core Stats
    processing: u64,    // INT - affects hacking, research
    mobility: u64,      // DEX - affects piloting, evasion
    power: u64,         // STR - affects combat damage
    resilience: u64,    // VIT - affects health, resistance
    luck: u64,          // Affects critical hits, rare drops
    neural_bandwidth: u64, // Affects multi-tasking, AI control
    
    // Evolution
    level: u64,
    experience: u64,
    augmentations: vector<Augmentation>,
    firmware_version: u64,
    ai_model_lineage: String,
    
    // Activity
    current_mission: Option<ID>,
    staked_at: Option<ID>,
}

enum AgentClass {
    Hacker,
    Pilot,
    MechOperator,
    QuantumEngineer,
    Psionic,
    BountyAI,
}
```

### Ship Schema

```move
struct Ship has key, store {
    id: UID,
    name: String,
    ship_class: ShipClass,
    
    // Modular Slots
    hull: Option<Hull>,
    engine: Option<Engine>,
    ai_core: Option<AICore>,
    weapon: Option<Weapon>,
    utility: Option<Utility>,
    
    // Stats (computed from modules)
    max_health: u64,
    current_health: u64,
    speed: u64,
    firepower: u64,
    cargo_capacity: u64,
    
    // Crew
    pilot: Option<ID>,  // Agent ID
    crew: vector<ID>,   // Agent IDs
}
```

### Planet Schema

```move
struct Planet has key, store {
    id: UID,
    name: String,
    coordinates: Coordinates,
    planet_type: PlanetType,
    
    // Resources
    resource_type: ResourceType,
    extraction_rate: u64,
    total_reserves: u64,
    extracted: u64,
    
    // Population & Control
    population: u64,
    max_population: u64,
    faction_control: ID,
    
    // Infrastructure
    stations: vector<ID>,
    defense_level: u64,
}
```

### Station Schema

```move
struct Station has key, store {
    id: UID,
    name: String,
    station_type: StationType,
    planet_id: Option<ID>,
    
    // DeFi Function
    staking_pool: Balance<GALACTIC>,
    total_staked: u64,
    yield_rate: u64,
    
    // Operations
    operators: vector<ID>,  // Agent IDs
    efficiency: u64,
    level: u64,
}

enum StationType {
    YieldFarm,
    ResearchLab,
    BlackMarket,
    WarpGate,
    DefensePlatform,
}
```

## DeFi System Architecture

### Energy Reactor (Liquidity Pool)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ENERGY REACTOR                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Liquidity Pool                          │ │
│  │  ┌─────────────────┐       ┌─────────────────┐           │ │
│  │  │   GALACTIC      │◄─────►│     SUI         │           │ │
│  │  │   Token         │       │     Token       │           │ │
│  │  └─────────────────┘       └─────────────────┘           │ │
│  │              │                      │                     │ │
│  │              ▼                      ▼                     │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │              LP Token Minting                     │   │ │
│  │  │        (Energy Crystal NFT Receipt)               │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                 Yield Distribution                         │ │
│  │  • Base APY from swap fees                                │ │
│  │  • Boosted APY from Agent stats                          │ │
│  │  • Galactic Events multipliers                            │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Power Routing (Staking)

```
┌─────────────────────────────────────────────────────────────────┐
│                     POWER ROUTING SYSTEM                         │
│                                                                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │   Agent    │    │    Ship    │    │   Station  │            │
│  │  Staking   │    │  Docking   │    │  Operating │            │
│  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘            │
│        │                 │                 │                    │
│        ▼                 ▼                 ▼                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   POWER GRID                              │  │
│  │                                                           │  │
│  │  Total Staked Power → Emission Rate → Reward Pool        │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              REWARD DISTRIBUTION                          │  │
│  │                                                           │  │
│  │  Individual Reward = (User Power / Total Power) × Emissions│
│  │                                                           │  │
│  │  Modifiers:                                               │  │
│  │  • Agent Processing stat → +Yield%                        │  │
│  │  • Ship AI Core level → +Efficiency%                      │  │
│  │  • Station level → +Capacity%                             │  │
│  │  • Planet resource type → +Bonus%                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Event System

All state changes emit events for indexer consumption:

```move
// Agent Events
struct AgentMinted has copy, drop { agent_id: ID, owner: address }
struct AgentLevelUp has copy, drop { agent_id: ID, new_level: u64 }
struct AgentAugmented has copy, drop { agent_id: ID, augmentation: String }

// Ship Events  
struct ShipBuilt has copy, drop { ship_id: ID, owner: address }
struct ModuleEquipped has copy, drop { ship_id: ID, slot: String, module_id: ID }
struct ShipDamaged has copy, drop { ship_id: ID, damage: u64 }

// DeFi Events
struct Staked has copy, drop { user: address, amount: u64, station_id: ID }
struct Unstaked has copy, drop { user: address, amount: u64, station_id: ID }
struct RewardClaimed has copy, drop { user: address, amount: u64 }

// Combat Events
struct BattleStarted has copy, drop { attacker: ID, defender: ID }
struct BattleEnded has copy, drop { winner: ID, loser: ID, loot: u64 }

// Governance Events
struct ProposalCreated has copy, drop { proposal_id: ID, proposer: address }
struct VoteCast has copy, drop { proposal_id: ID, voter: address, support: bool }
```

## Security Model

### Access Control

```move
// Admin capability for protocol upgrades
struct AdminCap has key, store { id: UID }

// Faction leadership capability
struct FactionLeaderCap has key, store {
    id: UID,
    faction: ID,
}

// Station operator capability
struct OperatorCap has key, store {
    id: UID,
    station_id: ID,
}
```

### Risk Mitigation

1. **Slashing**: Staked assets at risk during raids/attacks
2. **Cooldowns**: Action rate limiting to prevent exploitation
3. **Circuit Breakers**: Emergency pause functionality
4. **Timelock**: Governance actions delayed for security review

## Scalability Considerations

### Parallel Transaction Execution

Sui's object model enables parallel processing:
- Different player actions on different objects execute concurrently
- Shared objects (global pools) use consensus ordering
- Owned objects (personal NFTs) use fast path

### Data Sharding

```
Galaxy 1 (Shared Object)    Galaxy 2 (Shared Object)    Galaxy 3 (Shared Object)
       │                           │                           │
       ▼                           ▼                           ▼
  Star System A               Star System D               Star System G
  Star System B               Star System E               Star System H
  Star System C               Star System F               Star System I
       │                           │                           │
       ▼                           ▼                           ▼
  [Player Objects]            [Player Objects]            [Player Objects]
  (Owned - Fast)              (Owned - Fast)              (Owned - Fast)
```

## Integration Points

### Wallet Integration

- **Sui Wallet**: Primary wallet for transactions
- **zkLogin**: Social login for Web2 onboarding
- **Multi-sig**: For guild treasuries and DAOs

### External Services

- **Pyth Network**: Price feeds for economic balancing
- **Switchboard**: VRF for randomness (loot drops, combat)
- **Wormhole**: Cross-chain asset bridges (future)
