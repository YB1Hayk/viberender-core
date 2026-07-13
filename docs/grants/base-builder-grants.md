# Base Builder Grants — готовый текст заявки

> Куда подавать: https://paragraph.xyz/@grants.base.eth (Base Builder Grants, retroactive 1–5 ETH).
> Также заполни профиль на https://talentprotocol.com — Base часто смотрит Builder Score.
> Форма обычно короткая: описание, ссылки, что уже сделано. Всё ниже — копипаст.

---

## Project name

VibeRender

## Describe your project (150–300 words, EN)

VibeRender is a DePIN protocol for decentralized GPU rendering, live on Base Mainnet.

3D artists overpay cloud render farms 30–60% margin while millions of consumer GPUs sit idle. VibeRender connects the two sides directly: an artist uploads a project and locks payment in a non-custodial escrow contract on Base; an independent GPU operator claims the job, renders it locally, and receives the funds atomically once the output is verified. No intermediary holds money or files.

What is already live:
- RenderEscrow and JobRegistry contracts deployed and source-verified on Base Mainnet (links below)
- Working alpha dApp with the full job lifecycle: upload → escrow lock → claim → render → payout
- Encrypted per-job file vault, operator job board, wallet-native auth (wagmi + RainbowKit)
- Open-source monorepo with 30+ contract tests and CI

Base is our home chain: sub-cent fees make per-job micro-escrow viable, and Coinbase onramps lower friction for artists who have never used crypto. Escrow amounts are intentionally symbolic during alpha until we complete a formal audit — that is the next milestone this grant accelerates.

## Links

- Live app: https://vibe-render.vercel.app
- RenderEscrow (verified): https://base.blockscout.com/address/0x2b46B53b7A604Ea9Fc8E00222De50d1421274b87#code
- JobRegistry (verified): https://base.blockscout.com/address/0xeA795aF3A07A859cF97c52f5a8EE89494BB4dAdB#code
- Contracts: https://github.com/YB1Hayk/viberender-core
- Frontend: https://github.com/YB1Hayk/vibe-render

## What will you use the grant for? (EN)

1. **Security audit** of RenderEscrow before scaling real escrow values (top priority)
2. **Operator CLI client** — Dockerized node software with GPU auto-detection so operators can join without using the web UI
3. **Automated Proof-of-Render** — frame-hash verification wired into JobRegistry before escrow release
4. **Multi-sig migration** of the validator role (currently a deployer hot key, transparently documented)

## Wallet address (Base)

> ⚠️ Укажи СВОЙ кошелёк, куда хочешь получить грант — например твой MetaMask:
> 0xd12aa4c35cad77a6a222ea4eccdeb247dda09627
