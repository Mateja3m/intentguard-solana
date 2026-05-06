# IntentGuard Solana 

Minimal TypeScript proof of concept for deterministic pre-signing validation of Solana transaction preparation data.

## What this PoC proves

This project demonstrates the core idea behind an IntentGuard Solana Adapter:

- A local JSON payload can describe user intent, a proposed Solana action, optional policy rules, and optional Solana context.
- A deterministic validation engine can compare the proposed action against the user intent and policy before any signing step.
- The output can be reduced to a clean `PASS`/`WARN`/`FAIL` report with a decision (`ALLOW`, `REVIEW_REQUIRED`, or `BLOCK`) and a risk score.

This PoC is intentionally small. It focuses on pre-signing validation logic rather than end-to-end transaction execution.


## Scope

Implemented checks:

- Chain must be `solana`
- Action type must match user intent
- Amount must match user intent when required by policy
- Recipient must match user intent when required by policy
- Asset symbol must match user intent when required by policy
- Action type must be allowed by policy
- Asset must be allowed by policy
- Amount must not exceed `maxAmount`
- Recipient must be a valid Solana public key
- Token mint must be a valid Solana public key when provided
- All program IDs must be valid Solana public keys
- Program IDs can be checked against an allowlist
- Unknown program IDs can return `FAIL` or `WARN` depending on policy
- Optional RPC health checks can return `PASS` or `WARN`
- Optional balance check is included as a stub for future extension

## Install

```bash
npm install
```

## Run

```bash
npm run preflight -- examples/safe-transfer.json
```

Or directly with Node's `--import tsx` loader:

```bash
node --import tsx src/cli.ts examples/safe-transfer.json
```

If you prefer the `tsx` binary on a normal local shell, this also works:

```bash
npx tsx src/cli.ts examples/safe-transfer.json
```

To print the internal JSON report as well:

```bash
npm run preflight -- examples/safe-transfer.json --json
```

Optional RPC configuration:

- Set `SOLANA_RPC_URL` in your environment, or
- Provide `solana.rpcUrl` in the input JSON

RPC checks are opt-in. The examples keep them disabled so local runs stay deterministic.

There is no baked-in onchain allowlist in the source code. Program recognition comes from the input policy, so the PoC stays deterministic and avoids shipping hardcoded addresses in the adapter.

## Example files

- `examples/safe-transfer.json`
- `examples/intent-mismatch.json`
- `examples/policy-violation.json`
- `examples/invalid-address.json`
- `examples/unknown-program.json`

## Example output

```text
IntentGuard Solana PoC

Status: PASS
Decision: ALLOW
Risk Score: 0/100

Checks:
PASS  chain_is_solana             Proposed chain is Solana.
PASS  action_type_match           Action type matches the user intent.
PASS  amount_match                Amount matches the user intent.
PASS  recipient_match             Recipient matches the user intent.
PASS  asset_match                 Asset symbol matches the user intent.
PASS  action_allowed              Action type is allowed by policy.
PASS  asset_allowed               Asset is allowed by policy.
PASS  amount_within_policy_limit  Amount is within the configured policy limit.
PASS  solana_recipient_valid      Recipient is a valid Solana public key.
PASS  solana_token_mint_valid     Token mint is a valid Solana public key.
PASS  solana_program_ids_valid    All program IDs are valid Solana public keys.
PASS  program_ids_allowed         All program IDs are allowed by policy.
PASS  unknown_programs            All program IDs are known to the configured policy.

Recommendation:
Proceed. No blocking issues were found.
```

## Development commands

```bash
npm run typecheck
npm run test
npm run build
```

## Library usage

```ts
import { evaluatePreflight } from 'intentguard-solana-poc';

const report = await evaluatePreflight(inputJson, {
  defaultRpcUrl: process.env.SOLANA_RPC_URL,
});
```

The returned report is a plain JSON object with the shape:

```json
{
  "status": "FAIL",
  "decision": "BLOCK",
  "riskScore": 85,
  "summary": "The proposed Solana action does not match the user intent.",
  "checks": [
    {
      "id": "recipient_match",
      "status": "FAIL",
      "message": "Recipient does not match the user intent."
    }
  ],
  "metadata": {
    "chain": "solana",
    "actionType": "transfer",
    "assetSymbol": "USDC"
  }
}
```
