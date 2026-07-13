# VibeRender — Grant Pitch (universal)

> Один документ со всеми фактами. Копируй блоки отсюда в любую грантовую форму.

---

## One-liner (EN)

**VibeRender is a DePIN protocol that connects 3D artists with idle GPU owners for rendering, settled through non-custodial escrow contracts live on Base Mainnet.**

## One-liner (RU)

VibeRender — DePIN-протокол, соединяющий 3D-художников с владельцами простаивающих GPU; оплата проходит через некастодиальные эскроу-контракты, задеплоенные в Base Mainnet.

---

## Problem (EN)

Cloud render farms charge a 30–60% margin on top of raw hardware cost. They control pricing, store artists' files on their servers, and act as single points of failure. Meanwhile, millions of consumer GPUs (RTX 3070+) sit idle every day.

## Solution (EN)

A direct-matching protocol: artists lock payment in a smart-contract escrow, GPU operators claim jobs and render locally, funds are released atomically after the render is verified. Trust is enforced by code, not vendor agreements. The result is 3–5× lower rendering cost and censorship-resistant infrastructure.

---

## Live proof / Traction

| Что | Ссылка |
|---|---|
| Live dApp (alpha) | https://vibe-render.vercel.app |
| Landing | https://viberender-web.vercel.app |
| RenderEscrow — **verified on Base Mainnet** | https://base.blockscout.com/address/0x2b46B53b7A604Ea9Fc8E00222De50d1421274b87#code |
| JobRegistry — **verified on Base Mainnet** | https://base.blockscout.com/address/0xeA795aF3A07A859cF97c52f5a8EE89494BB4dAdB#code |
| Contracts repo (30+ tests, CI) | https://github.com/YB1Hayk/viberender-core |
| dApp repo | https://github.com/YB1Hayk/vibe-render |

Status: working end-to-end job lifecycle (upload → escrow → claim → render → payout) in production alpha. Escrow amounts are intentionally symbolic (~$0.05/job) until a formal audit.

---

## Why Base (для Base-форм)

- Contracts are **already live on Base Mainnet** — not a promise, a fact.
- Sub-cent transaction fees make micro-escrow per render job economically viable — impossible on L1.
- Target users are individual artists and gamers with idle GPUs: Coinbase onramp + Base Account lower onboarding friction for a non-crypto-native audience.
- USDC on Base is the planned settlement currency for job payments.

## Why Arbitrum (для Questbook-форм)

- Multi-chain settlement is on the roadmap: artists pick the chain at job creation.
- Arbitrum One support is scaffolded in the wagmi config and contracts deploy scripts today; deployment is a milestone in this proposal.
- Arbitrum's mature DeFi liquidity (USDT/USDC) suits operator payouts.

---

## Team

Solo founder (technical), building in public. All code open-source (MIT). AI-assisted development workflow — full commit history on GitHub demonstrates velocity: contracts, tests, CI, deployment and frontend integration shipped within weeks.

> Если есть co-founders / коммьюнити — допиши сюда.

---

## The ask (шаблон)

Funding to take VibeRender from working alpha to audited public beta:
1. Smart-contract security audit (top priority before scaling escrow values)
2. Operator CLI client (Docker, GPU auto-detection)
3. Automated Proof-of-Render verification (frame hashing)
4. Multi-sig migration of validator/prover roles
