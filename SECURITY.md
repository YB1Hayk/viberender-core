# Security Policy

## Scope

This security policy covers the smart contracts in this repository:

- `contracts/RenderEscrow.sol`
- `contracts/JobRegistry.sol`

The frontend application (`vibe-render.vercel.app`) is out of scope for on-chain bug reports but critical frontend vulnerabilities affecting fund safety should be reported via the same channel.

## Supported Versions

| Version | Status |
|---|---|
| `main` branch | ✅ Active development — reports accepted |
| Tagged releases | ✅ Supported |
| Archived branches | ❌ No support |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately via email: **security@viberender.xyz**

Include:
- Description of the vulnerability
- Steps to reproduce (PoC code preferred)
- Potential impact (funds at risk, access control bypass, etc.)
- Your suggested fix, if any

We will acknowledge within **48 hours** and aim to resolve critical issues within **7 days**.

## Bug Bounty

VibeRender is in Alpha. A formal bug bounty program will launch alongside the mainnet deployment (Q4 2026). High-severity pre-launch reports will be rewarded retroactively at our discretion.

## Known Limitations (Alpha)

The following are **known design decisions**, not vulnerabilities:

1. **Validator is a single EOA** — The `validator` role in `RenderEscrow.sol` is currently a single externally owned address. Before mainnet, this will be replaced by a multi-sig or ZK verifier contract.

2. **No ERC-20 support yet** — `RenderEscrow.sol` accepts only native ETH. USDC/USDT payment paths are in development.

3. **No formal audit** — The contracts have not been professionally audited. A security audit is planned for Q3 2026 before any mainnet deployment. **Do not use with real funds on mainnet.**

4. **Proof-of-Render is centralized** — The `prover` in `JobRegistry.sol` is protocol-controlled. Decentralized verification via ZK proofs is a Q4 2026 goal.

## Audit Status

| Date | Auditor | Scope | Report |
|---|---|---|---|
| — | — | Pending Q3 2026 | — |

## Disclosure Policy

We follow **responsible disclosure**. We ask that you:
- Give us reasonable time to fix before public disclosure
- Do not exploit vulnerabilities beyond the minimum needed to demonstrate the issue
- Do not disrupt services or access user data

We commit to:
- Acknowledge reports promptly
- Keep you informed of progress
- Credit you in the fix (unless you prefer anonymity)
