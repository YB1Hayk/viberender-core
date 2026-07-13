# Типовые вопросы грантовых форм — готовые ответы (EN)

> Почти каждая форма спрашивает одно и то же. Копируй отсюда.

---

**Q: What stage is your project at?**

Live alpha on mainnet. Escrow and registry contracts are deployed and source-verified on Base Mainnet; the dApp supports the full job lifecycle (upload → escrow → claim → render → payout). Escrow values are intentionally symbolic until we complete a security audit.

**Q: Is your code open source?**

Yes, MIT license. Contracts: github.com/YB1Hayk/viberender-core (30+ Hardhat tests, GitHub Actions CI). Frontend: github.com/YB1Hayk/vibe-render.

**Q: How many users do you have?**

Early alpha — first registered designers and GPU operators onboarding through the live dashboard. Our growth metric for the grant period is completed render jobs settled on-chain.

**Q: What is your business model?**

A 3% protocol fee on each render job. Operators keep the rest — versus 30–60% margin taken by centralized farms.

**Q: Who are your competitors and how are you different?**

Render Network (RNDR) targets studio-grade OctaneRender workloads with token-centric economics. VibeRender targets the long tail: individual Blender/C4D artists and consumer GPU owners, with plain USDC/ETH escrow instead of a proprietary token, and per-job micro-escrow that is only viable on low-fee L2s.

**Q: What are the main risks?**

1) Contract risk — mitigated by keeping escrow symbolic until audit (grant-funded). 2) Render verification fraud — mitigated by Proof-of-Render frame hashing (milestone). 3) Liquidity of operators — mitigated by targeting gaming-GPU communities where hardware already exists.

**Q: Token?**

No token and no token plans. Settlement in ETH/USDC.

**Q: Team / KYC**

Solo technical founder (укажи имя/страну как в документах — KYC проходишь сам). Building in public since Q1 2026.

**Q: How did you hear about this grant?**

Base/Arbitrum ecosystem channels (укажи фактический источник).

---

## Чек-лист перед отправкой любой заявки

- [ ] Кошелёк для получения гранта — ТВОЙ (0xd12a…9627), не деплойер
- [ ] Прочитал текст и заменил все места с «⚠️» и «укажи»
- [ ] Профиль GitHub публичный, README открывается
- [ ] Ссылки на Blockscout открываются в инкогнито
- [ ] Скриншоты dApp приложены (если форма позволяет)
