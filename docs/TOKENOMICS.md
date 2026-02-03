# 💎 Tokenomics & Galactic Economy

## Overview

The Sui-In-Space economy is designed around the **GALACTIC** token, with multiple sinks and sources creating a sustainable in-game economy that rewards active participation and strategic gameplay.

## GALACTIC Token

### Token Specifications

| Property | Value |
|----------|-------|
| **Name** | Galactic Credits |
| **Symbol** | GALACTIC |
| **Decimals** | 9 |
| **Max Supply** | 1,000,000,000 (1 Billion) |
| **Initial Circulating** | 100,000,000 (10%) |

### Token Distribution

```
┌────────────────────────────────────────────────────────────────┐
│                    GALACTIC TOKEN ALLOCATION                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ███████████████████████░░░░░░░░░░░░  40% - Play-to-Earn Pool  │
│  ████████████████░░░░░░░░░░░░░░░░░░░  20% - Liquidity & DEX    │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░  15% - Development Fund   │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  10% - Early Supporters   │
│  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   8% - Team (4yr vesting) │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5% - DAO Treasury       │
│  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   2% - Advisors           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Vesting Schedule

| Allocation | TGE Unlock | Vesting |
|------------|------------|---------|
| Play-to-Earn | 0% | Released via gameplay over 5 years |
| Liquidity | 100% | Immediate |
| Development | 10% | 24 months linear |
| Early Supporters | 15% | 12 months linear, 3 month cliff |
| Team | 0% | 48 months linear, 12 month cliff |
| DAO Treasury | 0% | Governance controlled |
| Advisors | 0% | 24 months linear, 6 month cliff |

## Galactic Economy Flow

```
                              ┌─────────────────┐
                              │   NEW PLAYERS   │
                              └────────┬────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TOKEN SOURCES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │  Mission    │    │   Staking   │    │  Resource   │    │   Trading   │ │
│   │  Rewards    │    │   Yields    │    │ Extraction  │    │   Profits   │ │
│   │             │    │             │    │             │    │             │ │
│   │  PvE drops  │    │  LP rewards │    │  Planet     │    │  Black      │ │
│   │  Quest $    │    │  Station $  │    │  mining     │    │  market     │ │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘ │
│          │                  │                  │                  │        │
│          └──────────────────┴──────────────────┴──────────────────┘        │
│                                       │                                     │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │     PLAYER      │
                              │     WALLET      │
                              │   (GALACTIC)    │
                              └────────┬────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                              TOKEN SINKS                                     │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   Agent     │    │    Ship     │    │   Station   │    │  Protocol   │ │
│   │  Upgrades   │    │  Building   │    │   Fees      │    │    Fees     │ │
│   │             │    │             │    │             │    │             │ │
│   │ Augments    │    │ Modules     │    │ Operations  │    │ Tx fees     │ │
│   │ Leveling    │    │ Repairs     │    │ Docking     │    │ Governance  │ │
│   │ Training    │    │ Fuel        │    │ Research    │    │ Insurance   │ │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   Planet    │    │   Combat    │    │   Market    │    │  Seasonal   │ │
│   │  Control    │    │   Costs     │    │   Listings  │    │   Events    │ │
│   │             │    │             │    │             │    │             │ │
│   │ Colonizing  │    │ Fleet wars  │    │ Auction     │    │ Entry fees  │ │
│   │ Defense     │    │ Repairs     │    │ fees        │    │ Cosmetics   │ │
│   │ Population  │    │ Bounties    │    │ Escrow      │    │ Limited     │ │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Energy System

Energy is the secondary resource that gates high-frequency actions:

### Energy Sources

| Source | Energy/Day | Cost |
|--------|------------|------|
| Base Regeneration | 100 | Free |
| Agent Neural Bandwidth | +10/level | Agent stat |
| Ship AI Core | +20/level | Ship module |
| Station Power | +50/level | Station ownership |
| Energy Cells (consumable) | +100 | 10 GALACTIC |

### Energy Costs

| Action | Energy Cost | GALACTIC Cost |
|--------|-------------|---------------|
| Basic Mission | 10 | 0 |
| Advanced Mission | 25 | 5 |
| Elite Mission | 50 | 20 |
| PvP Battle | 30 | 10 |
| Fleet Battle | 100 | 50 |
| Research | 20/hour | Variable |
| Warp Travel | 15/system | 5 |

## DeFi Yield Rates

### Staking APY

```
Base APY: 12%

Modifiers:
├── Agent Processing stat: +0.1% per point (max +10%)
├── Ship docked at station: +2% per ship
├── Station level: +1% per level (max +10%)
├── Planet resource bonus: +3% for rare resources
├── Lock duration: 
│   ├── 7 days:  +0%
│   ├── 30 days: +5%
│   ├── 90 days: +15%
│   └── 365 days: +30%
└── Galactic Events: Variable (+10% to +50% during events)

Maximum Possible APY: ~80%
```

### Liquidity Provision

```
Energy Reactor (LP) Rewards:

Trading Fees: 0.3% per swap
├── 0.25% to LP providers
└── 0.05% to DAO Treasury

LP Mining Rewards:
├── Daily emission: 100,000 GALACTIC (decreasing 10% annually)
├── Distributed proportionally to LP share
└── Boosted by NFT staking
```

## Inflation & Deflation Mechanics

### Inflationary Pressures

| Source | Annual Rate | Control Mechanism |
|--------|-------------|-------------------|
| Mission Rewards | 4% of supply | Difficulty scaling |
| Staking Emissions | 3% of supply | Governance vote |
| LP Mining | 2% of supply | Halving schedule |

### Deflationary Pressures

| Sink | Burn Rate | Mechanism |
|------|-----------|-----------|
| Upgrade Burns | Variable | 50% of upgrade cost burned |
| Battle Insurance | 1% of combat stakes | Lost side's insurance burned |
| Auction Fees | 2.5% of sales | 50% burned, 50% to treasury |
| Seasonal Reset | Variable | Unclaimed rewards burned |
| Protocol Fees | 0.1% of transactions | 100% burned |

### Target Equilibrium

```
Net Inflation Target: 2-5% annually
Controlled via:
├── Dynamic emission rates (governance)
├── Burn rate adjustments
└── Supply caps per activity
```

## PvP Risk & Reward Model

### Fleet Battle Economics

```
Battle Stake Formula:
Minimum Stake = Fleet Value × 0.05 (5%)
Maximum Stake = Fleet Value × 0.25 (25%)

Winner Rewards:
├── 90% of opponent's stake
├── Loot drops from destroyed ships
├── Territory control (if applicable)
└── Reputation points

Loser Penalties:
├── 100% of stake lost
├── Ship repair costs
├── Agent recovery time
└── Territory loss (if applicable)

Insurance System:
├── Optional 2% premium on stake
├── Recovers 50% of stake on loss
└── Cannot be used more than once per 24h
```

### Economic Warfare

```
Protocol Takeover Mechanics:

Hostile Acquisition:
├── Target: Rival faction's station
├── Cost: 10x station's daily yield
├── Duration: 48 hour voting period
├── Defense: Counter-stake mechanism

Successful Takeover:
├── Attacker gains station control
├── 7-day yield bonus
├── Reputation boost

Failed Takeover:
├── Attacker loses 50% of stake
├── 30-day cooldown
├── Reputation penalty
```

## Seasonal Economics

### Galaxy Reset Mechanics

```
Season Duration: 3 months

Season End:
├── Temporary assets reset
├── Leaderboard rewards distributed
├── New galaxy generated

Persistent Assets:
├── Legendary ships
├── Maxed agents
├── Genesis planets
├── Achievement badges

Season Rewards Pool:
├── 5% of all GALACTIC burned during season
├── Distributed to top performers
├── DAO treasury contribution
```

### Seasonal Achievements

| Achievement | Reward (GALACTIC) | Rarity |
|-------------|-------------------|--------|
| Galaxy Conqueror | 100,000 | 1/season |
| Fleet Admiral | 50,000 | 10/season |
| Economic Magnate | 30,000 | 25/season |
| Master Hacker | 20,000 | 50/season |
| Legendary Pilot | 10,000 | 100/season |

## Economic Balancing

### Circuit Breakers

```
Emergency Protocols:

Price Deviation > 50% in 24h:
├── Pause LP mining
├── Increase sink rates
└── Alert governance

Inflation > 10% in 30 days:
├── Reduce mission rewards 25%
├── Increase burn rates
└── Emergency governance vote

TVL Drop > 30% in 7 days:
├── Boost staking APY
├── Reduce unstaking cooldown
└── Enable emergency withdrawals
```

### Oracle Integration

```
Price Feeds (Pyth Network):
├── SUI/USD
├── GALACTIC/USD
├── GALACTIC/SUI

Used For:
├── Dynamic pricing of resources
├── Fair market value assessments
├── Collateralization ratios
└── Insurance calculations
```

## Governance Economics

### Voting Power

```
Voting Power Calculation:

Base Power = GALACTIC Holdings × 1
Staked Power = Staked GALACTIC × 1.5
Agent Power = Total Agent Levels × 10
Territory Power = Controlled Planets × 100

Total Voting Power = Base + Staked + Agent + Territory
```

### Proposal Costs

| Proposal Type | Cost (GALACTIC) | Quorum |
|---------------|-----------------|--------|
| Parameter Change | 1,000 | 10% |
| Emission Adjustment | 10,000 | 20% |
| New Feature | 50,000 | 30% |
| War Declaration | 100,000 | 40% |
| Protocol Upgrade | 500,000 | 50% |

## Summary

The GALACTIC token economy is designed for long-term sustainability:

1. **Balanced Sources & Sinks**: Multiple ways to earn and spend
2. **Active Participation Rewards**: Higher yields for engaged players
3. **Risk-Reward Alignment**: PvP stakes create meaningful decisions
4. **Governance Control**: Community can adjust parameters
5. **Deflationary Pressure**: Multiple burn mechanisms control inflation
