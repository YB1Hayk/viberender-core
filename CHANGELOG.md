# VibeRender — Development Changelog

> Публичный журнал разработки. Ведётся с сентября 2026.
> Для грантовых ревьюеров: здесь видно, что работа идёт непрерывно.

---

## 2026-09 — Security Hardening Sprint

### Contracts (viberender-core)

- [x] **Proof-gate для RenderEscrow**: `completeJob()` теперь требует предварительный `submitProof()` — нельзя оплатить невыполненную работу (proofRequired=true по умолчанию)
- [x] **Cancel window (3 дня)**: дизайнер не может отозвать эскроу у работающего оператора — защита оператора
- [x] **`cancelJob()`** — отдельный путь для заданий, где оператор так и не сдал работу
- [x] **JobRegistry ↔ RenderEscrow link**: `setEscrow()` + `isProofValid()` для on-chain проверки пруфа
- [x] **Deploy script v2**: автолинковка контрактов + запись `deployments/<network>.json`
- [x] **Тесты: 65 passing** (расширенное покрытие: proof-gate, cancel window, роли, повторные вызовы)
- [ ] Редеплой hardened-контрактов на Base Mainnet (ожидает пополнения газа на деплойере)
- [ ] Мультисиг-миграция validator/prover

### dApp (vibe-render)

- [x] **Network consistency fix**: UI больше не отправляет юзеров на Sepolia — контракты живут на Base Mainnet
- [x] **Реальный баланс оператора** из БД вместо хардкода 0.00
- [x] **Удалены мок-данные**: фейковые задания VR-100x и «2410 GPU-нод» вычищены из i18n
- [x] **`supabase/schema.sql`**: полная схема БД + RLS-политики + storage-бакеты (воспроизводимость)
- [x] **env-only конфиг**: supabase.ts без зашитых URL, fail-fast с понятной ошибкой
- [x] **Type-фиксы**: Database-типы (type-алиасы + Relationships) — insert'ы больше не `never`
- [x] **CI workflow**: typecheck + build на каждый push
- [x] **Рекомендованная цена**: калькулятор pricing.quote() подключён к форме дизайнера

### Documentation

- [x] README переписан: честный статус альфы (mainnet, символический эскроу до аудита, native ETH)
- [x] SECURITY.md: обновлённый список known limitations
- [x] Грантовый пак: pitch, Base Builder Grants, Arbitrum Questbook, FAQ

---

## Следующие шаги (roadmap)

1. Редеплой hardened контрактов на Base Mainnet
2. ERC-20 (USDC/USDT) escrow path
3. Operator CLI (Docker, GPU auto-detection)
4. Формальный аудит перед масштабированием сумм эскроу
5. Интеграция JobRegistry в фронтенд (registerJob/submitProof из UI)

---

## Commit discipline

- Все изменения проходят: compile → 65 Hardhat tests → tsc --noEmit → vite build
- Секреты в репо отсутствуют (Push Protection включена; .env и .claude/ в gitignore)
