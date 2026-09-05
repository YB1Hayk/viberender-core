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

1. **Validator is a single EOA** — The `validator` role in `RenderEscrow.sol` and the `prover` role in `JobRegistry.sol` are currently the deployer's externally owned address. Before scaling escrow values, these roles must be transferred to a multi-sig (`setValidator` / `setProver`) or replaced by a ZK verifier contract.

2. **No ERC-20 support yet** — `RenderEscrow.sol` accepts only native ETH. USDC/USDT payment paths are on the roadmap (Q3 2026).

3. **No formal audit** — The contracts have not been professionally audited. **Do not use with real funds.** The proof-gate (`submitProof` required before `completeJob`) and the 3-day cancel window are the first hardening steps; an external audit precedes any escrow-value scaling.

4. **Proof verification is centralized** — The validator submits proof hashes trusted off-chain verification. Fully on-chain or ZK-based render verification is a Q4 2026 goal. `JobRegistry.isProofValid` exposes the on-chain check the escrow consults.

5. **Cancel window, not dispute resolution** — A designer can reclaim a locked job's funds after `cancelWindow` (3 days default). A full dispute-resolution mechanism (time-locked re-queue, arbitration) is planned.

## Audit Status

| Date | Auditor | Scope | Report |
|---|---|---|---|
| — | — | Pending (pre-redeployment) | — |

## Disclosure Policy

We follow **responsible disclosure**. We ask that you:
- Give us reasonable time to fix before public disclosure
- Do not exploit vulnerabilities beyond the minimum needed to demonstrate the issue
- Do not disrupt services or access user data

We commit to:
- Acknowledge reports promptly
- Keep you informed of progress
- Credit you in the fix (unless you prefer anonymity)
