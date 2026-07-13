# Arbitrum Questbook — готовый текст заявки

> Куда подавать: https://questbook.app → Arbitrum → домен "New Protocols and Ideas" (или актуальный DDA-домен).
> Questbook просит milestones с суммами — они ниже. Валюта обычно USD в ARB-эквиваленте.

---

## Project name

VibeRender — Decentralized GPU Rendering on Arbitrum

## tl;dr (EN)

DePIN protocol matching 3D artists with idle GPU owners; payments settle through non-custodial escrow. Contracts are already live and verified on an EVM L2 (Base) with a working alpha dApp — this proposal funds the Arbitrum One deployment and operator payout rails on Arbitrum.

## Problem & Solution (EN)

Cloud render farms take 30–60% margin, hold artists' files, and are single points of failure. VibeRender replaces the intermediary with a smart-contract escrow: artists lock funds, GPU operators render locally and get paid atomically after verification. Rendering becomes 3–5× cheaper and censorship-resistant.

## Why Arbitrum (EN)

- Multi-chain settlement is core to the roadmap: the artist picks the settlement chain at job creation.
- Arbitrum support is scaffolded today (wagmi config, deploy scripts targeting Arbitrum One and Arbitrum Sepolia) — this grant turns it into a live deployment.
- Deep USDC/USDT liquidity on Arbitrum fits operator payouts, which are stablecoin-denominated.

## What exists today (proof)

- RenderEscrow (verified source): https://base.blockscout.com/address/0x2b46B53b7A604Ea9Fc8E00222De50d1421274b87#code
- JobRegistry (verified source): https://base.blockscout.com/address/0xeA795aF3A07A859cF97c52f5a8EE89494BB4dAdB#code
- Live alpha: https://vibe-render.vercel.app
- Open source, 30+ tests, CI: https://github.com/YB1Hayk/viberender-core

## Milestones (шаблон — суммы подстрой под правила домена)

| # | Milestone | Deliverable | Est. |
|---|---|---|---|
| 1 | Arbitrum One deployment | RenderEscrow + JobRegistry live & verified on Arbitrum One; frontend chain-picker | $3,000 |
| 2 | USDC/USDT escrow path | ERC-20 escrow variant + tests + audit-prep docs | $5,000 |
| 3 | Operator CLI (Docker) | Node client with GPU auto-detect claiming jobs from Arbitrum | $7,000 |
| 4 | Proof-of-Render v1 | Frame-hash verification wired to JobRegistry before release | $5,000 |

Total ask: **$20,000** (пример — уточни лимиты домена, часто 10–25k).

## Team

Solo technical founder, building in public; full commit history demonstrates shipped contracts, tests, CI, mainnet deployment and frontend integration. Code MIT-licensed.

## Funding address

> ⚠️ Кошелёк на Arbitrum — можешь указать тот же:
> 0xd12aa4c35cad77a6a222ea4eccdeb247dda09627
