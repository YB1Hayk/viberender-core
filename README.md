# viberender-core

**Decentralized rendering infrastructure for 3D creators.**  
Built on Base and Arbitrum. Powered by idle GPUs. Settled on-chain.

[![Status: Active Development](https://img.shields.io/badge/Status-Active%20Development-blue)]()
[![Network: Base + Arbitrum](https://img.shields.io/badge/Network-Base%20%2B%20Arbitrum-8B5CF6)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Mission

VibeRender is a DePIN (Decentralized Physical Infrastructure Network) for 3D rendering.

It connects independent artists and studios who need GPU compute with operators who have idle hardware — without a centralized intermediary setting prices or holding funds.

**The problem:** Cloud render farms charge 30–60% margin on top of hardware cost. They own your files while processing them, control pricing, and are single points of failure.

**The solution:** A protocol that matches render jobs directly to GPU operators, with payment settled in USDC/USDT via non-custodial smart contracts on Base and Arbitrum. Trust is enforced by code, not vendor agreements.

**Who it's for:**
- 3D artists using Blender, Cinema 4D, Unreal Engine, or Houdini who find cloud rendering too expensive
- GPU owners (gaming rigs, workstations) who want to monetize idle compute with on-chain, non-custodial payouts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Web3 | Wagmi v2, Viem, RainbowKit, WalletConnect |
| Auth | Supabase Auth (OAuth + Magic Link) |
| Storage | Supabase Storage (encrypted per-job archives) |
| Database | PostgreSQL via Supabase (RLS-enforced) |
| L2 Networks | **Base Mainnet**, **Arbitrum One** |
| Tokens | USDC, USDT (ERC-20, permit-based transfer) |
| Smart Contracts | Solidity — RenderEscrow, JobRegistry, ProofVerifier |
| 3D Integration | Blender 4.x, Cinema 4D, Unreal Engine 5, Houdini |
| Deployment | Vercel (frontend), Supabase (backend) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   VibeRender Protocol                   │
├───────────────────────┬─────────────────────────────────┤
│   Frontend (React)    │   Smart Contracts (Solidity)    │
│   Vite + TypeScript   │   RenderEscrow.sol              │
│   RainbowKit + Wagmi  │   JobRegistry.sol               │
│   Supabase Auth       │   ProofVerifier.sol             │
├───────────────────────┴─────────────────────────────────┤
│              L2 Settlement Layer                        │
│              Base Mainnet + Arbitrum One                │
│              USDC / USDT stablecoin payments            │
├─────────────────────────────────────────────────────────┤
│              Proof-of-Render                            │
│   Frame hash verification before escrow release.       │
│   Output submitted by operator → verified on-chain →   │
│   escrow released atomically upon designer approval.   │
└─────────────────────────────────────────────────────────┘
```

**Core contracts:**

| Contract | Purpose |
|---|---|
| `RenderEscrow.sol` | Holds funds between job creation and verified delivery |
| `JobRegistry.sol` | On-chain registry of render jobs, statuses, and parties |
| `ProofVerifier.sol` | Validates frame submission hashes before escrow release |

---

## Roadmap

### Q2 2026 — Foundation ✅
- [x] Core job lifecycle: upload → escrow → claim → render → payout
- [x] Base + Arbitrum escrow support
- [x] USDC + USDT payments
- [x] Encrypted file vault (per-job access keys)
- [x] Operator job board
- [x] End-to-end alpha with real renders

### Q3 2026 — Reliability + Operator Growth
- [ ] Operator reputation system (on-chain score per completed job)
- [ ] Batch job support (1 escrow → multiple frame ranges → N operators)
- [ ] Dispute resolution (time-locked re-queue)
- [ ] Automated frame verification (hash + visual diff)
- [ ] Blender plugin for one-click job submission

### Q4 2026 — Scale + Ecosystem
- [ ] Native cross-chain settlement
- [ ] Unreal Engine 5 and Cinema 4D job support
- [ ] Operator node software (Docker-based, GPU auto-detection)
- [ ] Public API for render job submission
- [ ] Grant applications: Base Ecosystem Fund, Arbitrum LTIPP

---

## Live App

[vibe-render.vercel.app](https://vibe-render.vercel.app) — alpha, testnet only

---

## Contributing

**Status: Active Development — alpha stage.**

The core protocol loop is functional. We're actively working on operator tooling, verification, and contract hardening.

- Report bugs via [GitHub Issues](../../issues)
- Propose protocol improvements via [Discussions](../../discussions)
- Audit the escrow contract logic (formal audit planned Q3 2026)

---

## License

MIT
