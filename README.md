# viberender-core

**Decentralized GPU rendering infrastructure for 3D creators.**  
Alpha MVP on Base + Arbitrum. Open source. Built in public.

[![CI](https://github.com/YB1Hayk/viberender-core/actions/workflows/ci.yml/badge.svg)](https://github.com/YB1Hayk/viberender-core/actions/workflows/ci.yml)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha%20Live-brightgreen)]()
[![Deployed: Base Mainnet](https://img.shields.io/badge/Deployed-Base%20Mainnet-0052FF)](https://basescan.org/address/0x2b46B53b7A604Ea9Fc8E00222De50d1421274b87)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Live

| Environment | URL | Status |
|---|---|---|
| Landing | [viberender-web.vercel.app](https://viberender-web.vercel.app) | Live |
| App Dashboard | [vibe-render.vercel.app](https://vibe-render.vercel.app) | Alpha · Live |

### On-chain (Base Mainnet)

| Contract | Address | Source |
|---|---|---|
| RenderEscrow | [`0x2b46…4b87`](https://basescan.org/address/0x2b46B53b7A604Ea9Fc8E00222De50d1421274b87) | [verified ✓](https://base.blockscout.com/address/0x2b46B53b7A604Ea9Fc8E00222De50d1421274b87#code) |
| JobRegistry | [`0xeA79…dAdB`](https://basescan.org/address/0xeA795aF3A07A859cF97c52f5a8EE89494BB4dAdB) | [verified ✓](https://base.blockscout.com/address/0xeA795aF3A07A859cF97c52f5a8EE89494BB4dAdB#code) |

> **Alpha Transparency:** Escrow and job-registry contracts are **live on Base Mainnet**. Job metadata and file state are indexed off-chain via Supabase for speed while the full on-chain indexing layer is built out. Escrow amounts during alpha are intentionally symbolic (~$0.05/job). Contracts are unaudited — a formal audit is planned before scaling escrow values.

---

## What It Is

VibeRender is a DePIN (Decentralized Physical Infrastructure Network) for 3D rendering.

It connects 3D artists who need GPU compute with independent operators who have idle hardware — without a centralized intermediary setting prices or holding funds.

**The problem:** Cloud render farms charge 30–60% margin on top of hardware cost. They control pricing, hold your files on their servers, and are single points of failure.

**The solution:** A direct-matching protocol where payment moves through non-custodial smart contracts on Base and Arbitrum. Trust is enforced by code, not vendor agreements.

---

## Architecture

```
  ┌──────────────┐         ┌─────────────────────────────────────┐
  │   Designer   │         │           VibeRender Protocol        │
  │  (3D Artist) │         │                                     │
  └──────┬───────┘         │   ┌─────────────┐  ┌─────────────┐ │
         │ Upload .blend    │   │  Dashboard  │  │  Supabase   │ │
         │ + Lock Escrow   ─┼──▶│  (React +   │──│  (Off-chain │ │
         │                  │   │   Wagmi)    │  │   indexing) │ │
         │                  │   └──────┬──────┘  └─────────────┘ │
         │                  │          │ createJob()              │
         │                  │   ┌──────▼──────────────────────┐  │
         │                  │   │    RenderEscrow.sol          │  │
         │                  │   │    Base / Arbitrum L2        │  │
         │                  │   │                              │  │
         │                  │   │  ETH/USDC locked in escrow   │  │
         │                  │   └──────┬──────────────────────┘  │
         │                  │          │ job claimed              │
         │                  └──────────┼──────────────────────── ┘
         │                             │
  ┌──────▼──────────────────────────── ▼──────┐
  │              GPU Operator                  │
  │  Downloads encrypted archive               │
  │  Renders locally on own hardware           │
  │  Submits frames → completeJob() called     │
  │  USDC/ETH released atomically to wallet    │
  └────────────────────────────────────────────┘
```

**Current state:** Job lifecycle (create → claim → render → payout) is functional end-to-end in the dashboard. On-chain escrow contract (`RenderEscrow.sol`) is in active development — currently off-chain state is mirrored in Supabase for alpha testing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Web3 Client | Wagmi v2, Viem, RainbowKit, WalletConnect |
| Auth | Supabase Auth (OAuth + Magic Link) |
| Storage | Supabase Storage (encrypted per-job archives) |
| Off-chain Index | PostgreSQL via Supabase (RLS-enforced, transitional) |
| L2 Networks | Base Mainnet, Arbitrum One |
| Tokens | Native ETH + ERC-20 (USDC, USDT) |
| Smart Contracts | Solidity ^0.8.20 — RenderEscrow, JobRegistry |
| Contract Tooling | Hardhat, ethers.js |
| 3D Integration | Blender 4.x, Cinema 4D, Unreal Engine 5 |
| Deployment | Vercel (frontend) |

---

## Smart Contracts

```
contracts/
└── RenderEscrow.sol    # Non-custodial escrow for render jobs
```

### RenderEscrow.sol

Holds native ETH (or ERC-20) between job creation and verified delivery. Three principals:

- **Designer** — creates and funds the job
- **Operator** — claims and completes the job
- **Validator** — protocol-owned address that authorizes escrow release after frame verification

Functions: `createJob` · `completeJob` · `refundJob`

Deployment target: Base Sepolia (testnet) → Base Mainnet (Q4 2026 post-audit)

---

## Roadmap

### Q2 2026 — Alpha MVP ✅
- [x] End-to-end job lifecycle: upload → lock → claim → render → payout
- [x] Base + Arbitrum network support
- [x] USDC + USDT payment paths
- [x] Encrypted per-job file vault (client-side encryption)
- [x] Operator job board with real-time status
- [x] Live alpha dashboard deployed to production

### Q3 2026 — On-chain Migration + Operator Tooling
- [ ] `RenderEscrow.sol` deployed to Base Sepolia
- [ ] Supabase off-chain state replaced by on-chain job registry
- [ ] CLI client for operators (Docker-based, GPU auto-detection)
- [ ] Operator reputation scoring (on-chain, per completed job)
- [ ] Automated frame hash verification before escrow release
- [ ] Batch job support (1 escrow → multiple frame ranges → N operators)

### Q4 2026 — Security Audits + Mainnet
- [ ] External smart contract security audit (targeting Zellic / Spearbit)
- [ ] Base Mainnet deployment
- [ ] Arbitrum One deployment
- [ ] Public REST API for programmatic job submission
- [ ] Blender plugin for one-click project upload
- [ ] Dispute resolution mechanism (time-locked re-queue)

---

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/YB1Hayk/viberender-core.git
cd viberender-core
npm install
```

### Compile contracts

```bash
npm run compile
```

### Run tests

```bash
npm test
```

---

## Contributing

Alpha stage — core protocol loop is functional. We're hardening contracts, building operator tooling, and moving job state fully on-chain.

- Report bugs via [GitHub Issues](../../issues)
- Protocol improvements via [Discussions](../../discussions)
- Smart contract review welcome — formal audit planned Q4 2026

---

## Grant Applications

VibeRender is applying for:
- **Base Ecosystem Fund** — native Base deployment, USDC settlement
- **Arbitrum LTIPP** — Arbitrum One deployment, cross-chain job routing

If you're a grant committee reviewer: the live alpha is at [vibe-render.vercel.app](https://vibe-render.vercel.app). End-to-end job flow works today on testnet.

---

## License

MIT
