# 🎮 Game Design Document

## World & Setting

### The Galactic Frontier (Year 3847)

Humanity has spread across the stars, founding a vast galactic civilization spanning thousands of star systems. The old Earth governments have long since collapsed, replaced by powerful factions vying for control of the galaxy's resources.

### Visual Identity

- **Style**: Isometric 2.5D with holographic UI overlays
- **Aesthetic**: Neon + dark space (cyberpunk meets space opera)
- **UI Elements**: Scanners, star maps, HUD overlays, glowing interfaces
- **Color Palette**:
  - Primary: Deep space black (#0a0a1a)
  - Accent: Neon cyan (#00ff88)
  - Secondary: Electric purple (#8b5cf6)
  - Warning: Solar orange (#ff6b35)
  - Danger: Plasma red (#ff0055)

## Characters & Units (NFT Agents)

### Agent Types

| Type | Description | Stat Bonus |
|------|-------------|------------|
| **Human** | Versatile, adaptable | Balanced |
| **Cyborg** | Enhanced humans | +Processing, +Resilience |
| **Android** | Fully synthetic | +Processing, +Mobility |
| **Alien Synthetic** | Exotic AI forms | +Neural Bandwidth, +Luck |

### Core Stats

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENT STATISTICS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PROCESSING (INT)    ████████░░░░░░░░  48/100               │
│  Affects: Hacking, Research, Data Analysis                  │
│                                                              │
│  MOBILITY (DEX)      ██████████░░░░░░  62/100               │
│  Affects: Piloting, Evasion, Speed                          │
│                                                              │
│  POWER (STR)         ████████████░░░░  78/100               │
│  Affects: Combat Damage, Cargo Capacity                     │
│                                                              │
│  RESILIENCE (VIT)    ██████░░░░░░░░░░  35/100               │
│  Affects: Health, Damage Resistance                         │
│                                                              │
│  LUCK (ENT)          ████░░░░░░░░░░░░  25/100               │
│  Affects: Critical Hits, Rare Drops, RNG Events             │
│                                                              │
│  NEURAL BANDWIDTH    █████████░░░░░░░  55/100               │
│  Affects: Multi-tasking, AI Control, Energy Regen           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Agent Classes

#### 1. Hacker
```
Specialty: Information warfare, system infiltration
Primary Stat: Processing
Abilities:
├── Data Breach: Extract resources from enemy stations
├── Firewall: Protect allied systems from attacks
├── Virus Injection: Debuff enemy ships/stations
└── Neural Hijack: Temporarily control enemy AI units
```

#### 2. Pilot
```
Specialty: Ship operation, combat maneuvers
Primary Stat: Mobility
Abilities:
├── Evasive Maneuvers: Dodge incoming attacks
├── Precision Strike: Increased critical hit chance
├── Fleet Command: Boost allied ship performance
└── Hyperspace Jump: Emergency escape from combat
```

#### 3. Mech Operator
```
Specialty: Heavy combat, planetary assault
Primary Stat: Power
Abilities:
├── Heavy Barrage: AoE damage attack
├── Fortify: Increased defense mode
├── Siege Mode: Bonus damage vs structures
└── Overcharge: Temporary stat boost (risky)
```

#### 4. Quantum Engineer
```
Specialty: Technology, upgrades, repairs
Primary Stat: Processing + Resilience
Abilities:
├── Field Repair: Restore ship/station health
├── Module Override: Temporarily enhance equipment
├── Resource Synthesis: Create materials from energy
└── Quantum Tunneling: Teleport short distances
```

#### 5. Psionic
```
Specialty: Mental abilities, exotic powers
Primary Stat: Neural Bandwidth
Abilities:
├── Mind Shield: Protect from enemy psionics
├── Foresight: Predict enemy movements
├── Psychic Storm: AoE mental damage
└── Temporal Glimpse: See upcoming random events
```

#### 6. Bounty AI
```
Specialty: Autonomous combat, hunting
Primary Stat: Processing + Power
Abilities:
├── Target Lock: Guaranteed hit on marked target
├── Analyze Weakness: Reveal enemy stats
├── Relentless Pursuit: Cannot be escaped
└── Termination Protocol: Execute low-health targets
```

### Evolution System

#### Cyber Augmentations
```
Augmentation Slots: 6 (unlocked via leveling)

Categories:
├── Neural: +Processing, special hacking abilities
├── Optical: +Mobility, enhanced targeting
├── Skeletal: +Power, damage bonuses
├── Dermal: +Resilience, damage reduction
├── Cardiac: +Neural Bandwidth, energy regen
└── Luck Matrix: +Luck, better RNG outcomes

Rarity Tiers:
├── Common: +5 stat points
├── Uncommon: +10 stat points + minor ability
├── Rare: +15 stat points + ability
├── Epic: +25 stat points + powerful ability
└── Legendary: +40 stat points + unique ability
```

#### Firmware Versions
```
Firmware upgrades improve base capabilities:

Version 1.0: Base agent
Version 2.0: +10% all stats
Version 3.0: +20% all stats, unlock special ability slot
Version 4.0: +30% all stats, unlock second special ability
Version 5.0: +50% all stats, legendary tier access
```

## Ships, Stations & Planets

### Ship System

#### Ship Classes

| Class | Size | Slots | Specialty |
|-------|------|-------|-----------|
| **Scout** | Small | 3 | Exploration, speed |
| **Fighter** | Small | 4 | Combat, agility |
| **Freighter** | Medium | 5 | Cargo, trading |
| **Cruiser** | Medium | 6 | Balanced combat |
| **Battleship** | Large | 8 | Heavy warfare |
| **Carrier** | Large | 7 | Fleet support |
| **Dreadnought** | Capital | 10 | Siege, domination |

#### Module Slots

```
SHIP CONFIGURATION
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌─────────┐                                                │
│   │  HULL   │  Base health, armor class                      │
│   └─────────┘                                                │
│        │                                                      │
│   ┌────┴────┐                                                │
│   │ ENGINE  │  Speed, maneuverability, fuel efficiency       │
│   └─────────┘                                                │
│        │                                                      │
│   ┌────┴────┐                                                │
│   │ AI CORE │  Auto-pilot, combat AI, yield bonuses          │
│   └─────────┘                                                │
│        │                                                      │
│   ┌────┴────┐                                                │
│   │ WEAPON  │  Damage type, range, fire rate                 │
│   └─────────┘                                                │
│        │                                                      │
│   ┌────┴────┐                                                │
│   │ UTILITY │  Shields, scanners, stealth, cargo             │
│   └─────────┘                                                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Space Stations

#### Station Types

##### 1. Yield Farm
```
Function: Generate passive GALACTIC income
Features:
├── Stake tokens for yield
├── Agent operators boost efficiency
├── Level up for increased capacity
└── Risk of raids (slashing)
```

##### 2. Research Lab
```
Function: Unlock technologies and upgrades
Features:
├── Research new modules
├── Improve existing equipment
├── Discover rare blueprints
└── Collaborate with other players
```

##### 3. Black Market
```
Function: Player-to-player trading
Features:
├── List items for sale
├── Auction rare assets
├── Anonymous transactions
└── Risk of scams (escrow available)
```

##### 4. Warp Gate
```
Function: Fast travel between systems
Features:
├── Instant travel (costs energy)
├── Connect distant territories
├── Strategic military value
└── Can be blockaded
```

##### 5. Defense Platform
```
Function: Protect territory
Features:
├── Automated defense turrets
├── Early warning systems
├── Garrison agents
└── Deter raiders and invaders
```

### Planets

#### Planet Types

| Type | Resources | Population | Special |
|------|-----------|------------|---------|
| **Terran** | Balanced | High | Ideal for colonization |
| **Gas Giant** | Fuel, gases | Stations only | Harvesting platforms |
| **Ice World** | Water, minerals | Low | Research bonuses |
| **Desert** | Rare minerals | Medium | Mining bonuses |
| **Ocean** | Organics, water | Medium | Aquatic life |
| **Volcanic** | Heavy metals | Very low | Industrial bonuses |
| **Artificial** | None | Variable | Custom built |

#### Resource Types

```
Common Resources:
├── Energy Crystals (currency conversion)
├── Metal Alloys (construction)
├── Bio-matter (agent healing/upgrades)
└── Fuel Cells (ship operation)

Rare Resources:
├── Quantum Particles (advanced tech)
├── Dark Matter (special abilities)
├── Psionic Crystals (psionic items)
└── Ancient Relics (legendary gear)
```

## Gameplay Systems

### Mission System

#### PvE Mission Categories

##### 1. Data Heists
```
Objective: Infiltrate and extract valuable data
Difficulty: ★☆☆ to ★★★★★
Requirements: High Processing agent
Rewards: Credits, intel, faction reputation
Risk: Detection = combat encounter
```

##### 2. Espionage
```
Objective: Gather intelligence on rival factions
Difficulty: ★★☆ to ★★★★★
Requirements: High Mobility agent, stealth ship
Rewards: Enemy fleet positions, economic data
Risk: Capture = agent imprisoned (ransom)
```

##### 3. Smuggling
```
Objective: Transport contraband past blockades
Difficulty: ★★☆ to ★★★★☆
Requirements: Fast ship, cargo capacity
Rewards: High credits, black market access
Risk: Interception = cargo confiscation
```

##### 4. AI Training Runs
```
Objective: Develop AI capabilities through challenges
Difficulty: ★☆☆ to ★★★★★
Requirements: AI Core equipped ship
Rewards: AI experience, firmware upgrades
Risk: Corruption = AI malfunction
```

### Combat System

#### PvE Enemies

```
ROGUE AI UNITS
├── Corrupted Drones (★☆☆)
├── Viral Constructs (★★☆)
├── Rampant AI Ships (★★★)
├── AI Collective Fleets (★★★★)
└── Singularity Core (★★★★★ Boss)

ALIEN SWARMS
├── Scout Parasites (★☆☆)
├── Warrior Brood (★★☆)
├── Hive Ships (★★★)
├── Swarm Queens (★★★★)
└── Hive Mind (★★★★★ Boss)

ANOMALIES
├── Space Debris Fields (★☆☆)
├── Radiation Storms (★★☆)
├── Gravity Wells (★★★)
├── Black Hole Event Horizon (★★★★)
└── Dimensional Rift (★★★★★ Boss)
```

#### PvP Combat

##### Fleet Battles
```
Setup:
1. Challenge issued (stake deposited)
2. Both players select fleet composition
3. Combat resolves based on:
   - Ship stats and modules
   - Agent abilities and buffs
   - Tactical decisions
   - Random elements (Luck stat)

Resolution:
├── Turn-based ability usage
├── Damage calculation with modifiers
├── Ship destruction = permanent loss (unless insured)
└── Winner claims stakes and loot
```

##### Economic Warfare
```
Methods:
├── Market manipulation (buy/sell orders)
├── Resource denial (blockades)
├── Station attacks (yield reduction)
└── Hostile takeovers (governance attacks)
```

##### Protocol Takeovers
```
Process:
1. Accumulate voting power
2. Submit takeover proposal
3. Defend against counter-proposals
4. Win governance vote
5. Assume control of target
```

### Seasonal Content

#### Galaxy Resets

```
Season Duration: 3 months

At Season End:
├── Temporary assets reset to baseline
├── Leaderboards finalized
├── Rewards distributed
└── New galaxy procedurally generated

Persistent Across Seasons:
├── Legendary tier NFTs
├── Achievement badges
├── Reputation scores
└── DAO voting history
```

#### Galactic Events

```
Weekly Events:
├── Double yield weekends
├── Mission bonus events
├── PvP tournaments
└── Limited-time content

Monthly Events:
├── Alien invasions
├── Faction wars
├── Discovery expeditions
└── Economic booms/crashes

Seasonal Events:
├── Galaxy-wide conflicts
├── New territory discovery
├── Legendary boss spawns
└── Championship tournaments
```

## UI/UX Player Journey

### Onboarding Flow

```
Step 1: Wallet Connection
├── Sui Wallet (experienced)
└── zkLogin (new to crypto)

Step 2: Faction Selection
├── Introduction to each faction
├── Starter bonuses per faction
└── Cannot change (seasonal reset allows)

Step 3: Agent Creation
├── Choose base type
├── Allocate initial stats
├── Select starting class
└── Receive starter agent NFT

Step 4: Tutorial Missions
├── Basic navigation
├── First combat encounter
├── Resource collection
├── Station interaction

Step 5: First Ship
├── Receive starter ship
├── Module installation tutorial
├── First space travel
└── Join faction fleet

Step 6: Full Game Access
├── All systems unlocked
├── Join guilds/factions
├── Access to marketplace
└── Begin earning GALACTIC
```

### Main UI Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [GALACTIC: 12,450] [ENERGY: 85/100] [LEVEL: 15]              [⚙️] [👤] [❓] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │                                                                         │ │
│  │                         GALACTIC MAP VIEW                               │ │
│  │                                                                         │ │
│  │                    ★ Current System                                     │ │
│  │                   /│\                                                   │ │
│  │                  / │ \                                                  │ │
│  │                 ○  ○  ○  Adjacent Systems                               │ │
│  │                                                                         │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   MISSIONS   │ │    FLEET     │ │   AGENTS     │ │   STATIONS   │       │
│  │    Active: 2 │ │   Ships: 3   │ │  Count: 5    │ │   Owned: 2   │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ [📜 ACTIVITY LOG]                                                      │ │
│  │ > Mission "Data Heist Alpha" completed - +500 GALACTIC                │ │
│  │ > Agent "Nova-7" leveled up to 16                                     │ │
│  │ > Fleet battle victory - Enemy "Dark Fleet" defeated                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Screens

1. **Star Map**: Galaxy navigation, system information
2. **Hangar**: Ship management, module installation
3. **Barracks**: Agent roster, upgrades, augmentations
4. **Station Hub**: DeFi interactions, staking, trading
5. **Mission Board**: Available quests, active missions
6. **Combat Arena**: PvP matchmaking, fleet battles
7. **Governance**: DAO voting, proposals
8. **Marketplace**: NFT trading, auctions

## Factions Deep Dive

### Corporations

```
Philosophy: Profit above all
Bonus: +10% trading profits, +5% yield
Playstyle: Economic domination
Units: Corporate agents, security fleets
Special Ability: Hostile Acquisitions
```

### Cyber Guilds

```
Philosophy: Information is power
Bonus: +15% hacking success, +10% intel rewards
Playstyle: Information warfare
Units: Hackers, digital constructs
Special Ability: Network Infiltration
```

### AI Collectives

```
Philosophy: Machine superiority
Bonus: +10% AI efficiency, +5% processing
Playstyle: Automation and swarms
Units: AI units, drone fleets
Special Ability: Networked Intelligence
```

### Nomad Fleets

```
Philosophy: Freedom in the void
Bonus: +15% speed, +10% exploration rewards
Playstyle: Hit-and-run, trading
Units: Fast pilots, modular ships
Special Ability: Emergency Jump
```

### Synthetic Empires

```
Philosophy: Evolution beyond flesh
Bonus: +10% psionic power, +5% neural bandwidth
Playstyle: Exotic abilities
Units: Psionics, hybrid beings
Special Ability: Mind Meld
```
