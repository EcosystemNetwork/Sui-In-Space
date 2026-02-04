# 🌌 Sui-In-Space: DeFi Empires in the Galaxy

A DeFi Kingdoms–style on-chain RPG reimagined as a **sci-fi galactic civilization simulator**, built natively on the **Sui blockchain**. Leveraging object-centric assets, instant finality, and composable on-chain gameplay.

![Sui-In-Space Banner](https://via.placeholder.com/1200x400/0a0a1a/00ff88?text=SUI+IN+SPACE+-+Galactic+DeFi+Empire)

## 🚀 Overview

Sui-In-Space is a far-future galactic empire simulation spanning star systems, megastructures, and AI-governed zones. Every ship, planet, station, module, and relic exists as a Sui object with mutable state that evolves based on player actions.

### Key Features

- **Object-Centric NFTs**: Ships, Agents, Planets, and Stations as composable Sui objects
- **DeFi Mechanics**: Liquidity Pools as Energy Reactors, Staking as Power Routing
- **PvE & PvP**: Fleet battles, data heists, espionage, and economic warfare
- **DAO Governance**: Vote on emissions, war declarations, and galactic expansion
- **AI-Driven Factions**: Dynamic NPC behaviors based on on-chain data

## 🎮 Factions

| Faction | Description | Specialty |
|---------|-------------|-----------|
| **Corporations** | Mega-corps controlling trade routes | Economic dominance |
| **Cyber Guilds** | Hacker collectives and data brokers | Information warfare |
| **AI Collectives** | Self-aware machine civilizations | Computational power |
| **Nomad Fleets** | Spacefaring traders and mercenaries | Mobility & exploration |
| **Synthetic Empires** | Post-biological civilizations | Psionic abilities |

## 🏗️ Architecture

```
sui-in-space/
├── contracts/           # Move smart contracts
│   ├── sources/         # Core modules
│   │   ├── galactic_token.move
│   │   ├── agent.move
│   │   ├── ship.move
│   │   ├── planet.move
│   │   ├── station.move
│   │   ├── defi.move
│   │   ├── missions.move
│   │   └── governance.move
│   └── tests/           # Move tests
├── frontend/            # React + Three.js UI
│   ├── src/
│   │   ├── components/  # Holographic UI components
│   │   ├── types/       # TypeScript interfaces
│   │   └── hooks/       # Sui wallet hooks
│   └── public/
└── docs/                # Documentation
    ├── ARCHITECTURE.md
    ├── TOKENOMICS.md
    ├── GAME_DESIGN.md
    └── ROADMAP.md
```

## 💎 Core Systems

### NFT Assets (Sui Objects)

1. **Agents** - Playable characters (humans, cyborgs, androids, alien synthetics)
2. **Ships** - Modular vessels with upgradeable slots
3. **Planets** - Resource extraction and population centers
4. **Stations** - Yield farms, research labs, warp gates

### DeFi Mechanics

- **GALACTIC Token**: Native currency for energy, upgrades, governance
- **Energy Reactors**: Liquidity pools generating protocol revenue
- **Power Routing**: Staking mechanisms for yield generation
- **Resource Generation**: Yield from planet and station ownership

### Gameplay Loops

- **Missions**: Data heists, espionage, smuggling, AI training runs
- **PvE Combat**: Rogue AIs, alien swarms, black hole anomalies
- **PvP Battles**: Fleet warfare, economic attacks, protocol takeovers

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Sui Network |
| Smart Contracts | Move Language |
| Frontend | React + Three.js / Babylon.js |
| Wallet | Sui Wallet, zkLogin |
| Indexing | Real-time object state |

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Tokenomics & Economy](docs/TOKENOMICS.md)
- [Game Design Document](docs/GAME_DESIGN.md)
- [Development Roadmap](docs/ROADMAP.md)

## 🚀 Quick Start

### Prerequisites

- [Sui CLI](https://docs.sui.io/build/install)
- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Build Contracts

```bash
cd contracts
sui move build
sui move test
```

### Run Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

## 🚀 Deployment on Vercel

The project is configured for deployment on Vercel. The `vercel.json` file is set up to:
- Build the frontend from the `frontend/` directory
- Output to `frontend/dist` (Vite's default output)
- Handle SPA routing with rewrites

### Deployment TODO Checklist

To get everything working on Vercel:

- [ ] **Connect Repository**: Link your GitHub repository to Vercel
- [ ] **Environment Variables**: Set up any required environment variables:
  - `VITE_SUI_NETWORK` - The Sui network to connect to (e.g., `mainnet`, `testnet`, `devnet`)
  - `VITE_PACKAGE_ID` - The deployed Move package ID (once contracts are deployed)
- [ ] **Deploy Contracts**: Deploy Move smart contracts to Sui network
  - Run `cd contracts && sui move build` to build contracts
  - Deploy using `sui client publish --gas-budget <BUDGET>` (adjust gas budget based on contract size; see [Sui Gas Docs](https://docs.sui.io/concepts/tokenomics/gas-in-sui))
  - Update frontend with the deployed package IDs
- [ ] **Configure Wallet Integration**: Set up Sui wallet connection
- [ ] **Set Up Indexing**: Configure real-time object state indexing for game data
- [ ] **Test Deployment**: Verify all features work on the deployed site
- [ ] **Custom Domain** (optional): Configure a custom domain in Vercel settings

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs to the `develop` branch.

---

**Built with 💜 on Sui**