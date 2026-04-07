# Escrow Environment Parity Spec

## Context

The escrow flow should behave consistently across Base mainnet and Base Sepolia, except where a difference is explicitly intended. Production should expose only Base mainnet to users, while Base Sepolia should remain available only for development and contract testing. The parity problem is therefore not chain visibility itself, but whether the same escrow actions produce the same behavior across the two deployments.

Assumption: hiding `baseSepolia` in production is correct and should remain unchanged.

## Phase 1: Requirements

### User Story

As the escrow product owner, I want the escrow contract actions to behave the same on Base mainnet and Base Sepolia, so that development testing is a reliable predictor of production behavior.

### Acceptance Criteria

1. WHEN the same escrow action is executed on Base mainnet and Base Sepolia THEN the system SHALL expect the same state transition, event evidence, and sync result.
2. WHEN production hides `baseSepolia` from users THEN the system SHALL still preserve parity checks that compare Sepolia behavior against Base mainnet behavior during development and testing.
3. WHEN a contract is deployed from the app on either chain THEN the frontend SHALL verify the same function signature, argument order, and emitted event structure.
4. WHEN an action receipt is verified on either chain THEN the frontend SHALL use the same action-to-event and action-to-state expectations.
5. WHEN the deployed contracts differ by version, constructor wiring, or emitted events between Base mainnet and Base Sepolia THEN the system SHALL surface that mismatch as a deployment parity issue.
6. WHEN a chain-specific dependency such as token address, data feed, or admin address differs THEN the system SHALL treat that as a configuration difference and not as a contract behavior difference.
7. WHEN automation is disabled in one environment THEN the system SHALL document which escrow state transitions still require manual sync or reconciliation.
8. IF WalletConnect or Turnstile are enabled in production THEN the CSP and public env configuration SHALL permit the required origins.
9. WHEN environment configuration is incomplete or inconsistent THEN the system SHALL surface one actionable error instead of failing later in the flow.
10. WHEN deployment parity changes THEN automated tests or documented verification steps SHALL detect drift in contract behavior assumptions.

### Edge Cases

1. Base mainnet and Base Sepolia factory contracts were deployed from different contract commits.
2. The escrow contract emits different events or state values on one chain even though the ABI in the frontend is the same.
3. A chain-specific dependency such as USDC token address or data feed changes the effective behavior of the contract.
4. Automation is enabled only in one environment, causing refunds or reconciliations to appear inconsistent across environments.
5. Production CSP blocks WalletConnect or Turnstile even though the same flow works locally.

## Phase 2: Design

## Overview

Create a single parity audit layer for escrow features. That layer should answer three questions:

1. Which differences between Base mainnet and Base Sepolia are intentional?
2. Which escrow behaviors must remain identical across both deployments?
3. Which config inputs can legitimately differ by chain?

The frontend should keep production-only Base access, but the parity audit should validate that the mainnet and Sepolia deployments still satisfy the same behavioral contract.

## Current Differences Found

1. [deployment.ts](/Users/lucas/Documents/GitHub/EscrowFreelanceFrontend/escrow-frontend/src/features/escrows/config/deployment.ts) correctly exposes only `base` in production, but still defines different factory, data feed, and token addresses per chain.
2. [wagmi.ts](/Users/lucas/Documents/GitHub/EscrowFreelanceFrontend/escrow-frontend/src/lib/web3/wagmi.ts) correctly limits production wallet connectivity to Base mainnet.
3. [escrowContract.ts](/Users/lucas/Documents/GitHub/EscrowFreelanceFrontend/escrow-frontend/src/features/escrows/services/escrowContract.ts) assumes the same function names, argument structure, events, and state mapping on both chains.
4. [escrowDeployment.ts](/Users/lucas/Documents/GitHub/EscrowFreelanceFrontend/escrow-frontend/src/features/escrows/services/escrowDeployment.ts) assumes both factory deployments produce the same `EscrowCreated` log behavior.
5. [public.ts](/Users/lucas/Documents/GitHub/EscrowFreelanceFrontend/escrow-frontend/src/lib/env/public.ts) enforces stricter public env rules in production, which can affect wallet and third-party flows without changing contract semantics.
6. [escrowAutomationMonitor.ts](/Users/lucas/Documents/GitHub/EscrowFreelanceFrontend/escrow-frontend/src/features/escrows/server/escrowAutomationMonitor.ts) and [instrumentation.ts](/Users/lucas/Documents/GitHub/EscrowFreelanceFrontend/escrow-frontend/src/instrumentation.ts) depend on an env flag for refund polling and reconciliation, so observed state may differ even if onchain contract behavior is identical.

## Architecture

Introduce a deployment parity checklist and, if needed, a small parity helper module that exposes:

1. Expected factory address per chain.
2. Expected dependency addresses per chain.
3. Expected function and event contract for create and management actions.
4. Whether automation should run.
5. Human-readable diagnostics for parity mismatches.

Consumers:

1. Escrow deployment verification.
2. Escrow action verification and sync helpers.
3. Development testing notes.
4. Automation startup.

## Components and Interfaces

### Decision: Treat production-only Base access as intentional and audit deployment parity separately
Context: Sepolia is a test-only chain, but it must still predict Base mainnet behavior.

Options Considered:
1. Force both chains to be available in production.
   Pros: easier parity testing in the live UI.
   Cons: wrong product behavior.
2. Keep production-only Base access and audit parity through code, tests, and deployment checks.
   Pros: preserves product intent and isolates the real problem.
   Cons: requires clearer parity verification.

Decision: keep production-only Base access and audit parity separately.

Rationale: Sepolia visibility is not the bug. The real risk is contract or deployment drift between mainnet and testnet.

### Proposed Module Shape

```ts
type EscrowEnvironmentPolicy = {
  expectedFactoryAddress: string;
  expectedDataFeedAddress: string;
  expectedUsdcAddress: string;
  isAutomationEnabled: boolean;
  expectedActionEvents: Record<string, readonly string[]>;
};
```

### Proposed Consumers

1. `verifyCreateEscrowTransaction()` asserts chain-specific config but chain-independent action semantics.
2. `verifyEscrowActionTransaction()` asserts the same action evidence on both chains.
3. Parity tests compare expected event/state outcomes across both deployments or mocked receipts.
4. Deployment notes record which contract commit was used for each chain.

## Data Models

No database schema change is required for the audit itself.

Potential follow-up rule:
Persist the deployed contract version or deployment commit per chain so parity issues can be traced to a specific release.

## Error Handling

1. Deployment mismatch: fail parity validation with a message naming the chain and mismatched expectation.
2. Missing env variable: fail at startup or test time with a specific missing key.
3. Unsupported production chain access: keep the current early failure behavior.
4. Automation disabled: document manual reconciliation expectations in ops notes.

## Testing Strategy

1. Unit tests for create and action verification assumptions in `escrowContract.ts`.
2. Tests that assert the same action-to-event and action-to-state mapping for Base and Base Sepolia inputs.
3. A deployment checklist that verifies both chains were deployed from the same contract commit.
4. Integration tests for management flow against receipts that represent both chain deployments.
5. Startup tests for required public env values and CSP behavior when WalletConnect or Turnstile are enabled.

## Phase 3: Tasks

- [ ] 1. Define deployment parity expectations
- [ ] 1.1 Document the intended identical behaviors for create, fund, submit, confirm, modify, dispute, and refund
  - Separate chain-specific config from contract semantics.
  - _Requirements: 1, 2, 4, 6, 10_
- [ ] 1.2 Record the contract source commit or deployment version for Base and Base Sepolia
  - Make version drift visible.
  - _Requirements: 5, 10_

- [ ] 2. Audit verification assumptions in the frontend
- [ ] 2.1 Review `verifyCreateEscrowTransaction()` against both deployments
  - Confirm function arguments and `EscrowCreated` decoding match on both chains.
  - _Requirements: 3, 5, 6_
- [ ] 2.2 Review `verifyEscrowActionTransaction()` against both deployments
  - Confirm event evidence and state mapping are identical on both chains.
  - _Requirements: 1, 4, 5_
- [ ] 2.3 Remove stale or misleading chain-specific validation messaging
  - Keep config errors precise.
  - _Requirements: 6, 9_

- [ ] 3. Make operational differences explicit
- [ ] 3.1 Document automation behavior and required env flags
  - Clarify refund and reconciliation expectations by environment.
  - _Requirements: 7, 9_
- [ ] 3.2 Document public env and CSP requirements for production
  - Cover WalletConnect, Turnstile, and app URL constraints.
  - _Requirements: 8, 9_

- [ ] 4. Add parity-focused automated tests
- [ ] 4.1 Add tests for create verification assumptions across both chains
  - Catch deployment drift early.
  - _Requirements: 3, 5, 10_
- [ ] 4.2 Add tests for action receipt verification across both chains
  - Verify event and state expectations stay aligned.
  - _Requirements: 1, 4, 10_
- [ ] 4.3 Add tests or documented checks for deployment version parity
  - Ensure Sepolia remains a trustworthy production proxy.
  - _Requirements: 2, 5, 10_

## Recommended First Fix

Compare the Base mainnet and Base Sepolia deployments first. If they were not deployed from the same contract version, no frontend-only fix will make behavior identical.
