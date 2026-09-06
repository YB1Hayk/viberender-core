# Grant Applications Tracker

> Журнал работы с грантами. Факты ниже — из официальных источников (URL указан),
> проверены 2026-09. Неподтверждённое помечено явно.

## Сводная таблица

| Программа | Сумма | Тип | Статус | Наш шаг |
|---|---|---|---|---|
| **Base Builder Grants** | 1–5 ETH | Ретроактивный (пост-фактум за shipped) | 🟢 строим видимость | Шипить + попадать в поле зрения Base-комьюнити (номинации, активность) |
| **Base Ecosystem Fund** | pre-seed/seed (equity) | Инвестиции Coinbase Ventures | ⚪ рано | После traction (пользователи, объёмы эскроу) |
| **Arbitrum DAO Grants** | по доменам | Заявки через Questbook | 🟡 изучаем домены | Проверить fit домена Infrastructure & Tools |
| **Arbitrum Audit Program** | $10M ARB пул | Субсидия на аудит | 🟡 условный fit | Требует деплоя на Arbitrum — оценить мультичейн-план |
| **Gitcoin Grants Stack** | matching pool раунда | Краудфандинг с матчингом | ⚪ ждём раунд | Следить за раундами; нужен Gitcoin Passport |

---

## Проверенные факты (с источниками)

### 1. Base Builder Grants — 🔗 https://gitcoin.co/apps/base-builder-grants

Цитата: *"Retroactive grant program by Base awarding ETH to builders for shipped apps,
tools, and contributions… Grants typically range from **1 to 5 ETH** per recipient and
are distributed in **publicly announced cohorts on X and Farcaster**."*

Цитата: *"Rather than requiring proposals or formal applications, Builder Grants identify
recipients through **ecosystem activity, community nominations, and direct discovery**…
Funding is awarded **after work is live**."*

Цитата: *"Since launching in **March 2024**, the program has distributed grants across
more than **20 cohorts**."*

**Вывод для нас:** заявки не подаются — программа ретроактивная. Что работает: живой
продукт в экосистеме Base (есть: контракты на Base Mainnet, dApp), публичная активность
(есть: канал, changelog, регулярные коммиты), комьюнити-номинации. Наша задача —
быть заметными, шипя реальное.

### 2. Arbitrum Foundation — 🔗 https://arbitrum.foundation/grants

Цитата: *"**Arbitrum Audit Program** offers **$10M in ARB over 12 months** to subsidise
third-party smart contract audits… supporting early-stage Arbitrum projects with strong
product-market fit."* — **Active**

Цитата: *"**ArbiFuel** is a Gas Fee Sponsorship Program to help early-stage teams ship
faster…"* — **Active**

Цитата: *"Currently accepting applications for: **Decentralized Applications ("dApps"),
Infrastructure & Tools**."*

**Вывод для нас:** прямого fit сейчас нет — контракты VibeRender живут на Base, а
арбитрум-программы ориентированы на проекты в экосистеме Arbitrum. **Но**: если
мультичейн-экспансия (Arbitrum-деплой эскроу) попадёт в роадмап — Audit Program
закрывает нашу боль №1 (аудит) почти бесплатно. Держим как стратегическую опцию.

### 3. Gitcoin Grants Stack — 🔗 https://gitcoin.co/apps/gitcoin-grants-stack

Цитата: *"**Gitcoin Passport Integration**: Aggregates verifiable identity signals to
support Sybil resistance. Rounds can require **minimum scores** for eligibility."*

Цитата (GG21): *"Each round defined its own **project eligibility criteria** based on
domain scope and round goals."*

Цитата (gov.gitcoin.co, бета-раунд): *"Projects must be **at least 3 months old**."*

**Вывод для нас:** matching-раунды объявляются волнами; требования — на усмотрение
каждого раунда (возраст проекта, Passport-скор, домен). Подготовка: оформить
проект на Gitcoin, набрать Passport-скор заранее, следить за анонсами раундов.

---

## Что просим финансировать (сквозное для всех заявок)

1. **Аудит смарт-контрактов** — приоритет №1 (proof-gate и cancel window ждут формальной проверки)
2. **Operator CLI** — инструмент для GPU-поставщиков (DePIN-инфраструктура)
3. **ERC-20 (USDC) escrow path** — текущий эскроу native ETH
4. **On-chain индексинг** — событийный слой JobRegistry → UI

## KPI (честные)

| Метрика | Сейчас | Цель 3 мес | Цель 6 мес |
|---|---|---|---|
| Hardened контракты в mainnet | ⏳ код готов, ждёт газа | ✅ | ✅ |
| Эскроу-заданий выполнено | 0 | 25 | 150 |
| GPU-операторов в сети | 0 | 10 | 40 |
| Аудит | не начат | пройден | + фикс-раунд |

## Черновики заявок

- `pitch.md` — общий питч
- `base-builder-grants.md` — под ретроактивную модель Base (как «уже сделали»)
- `faq-answers.md` — ответы на типовые вопросы ревьюеров
