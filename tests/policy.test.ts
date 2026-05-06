import { Keypair } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { resolvePolicy } from '../src/policy/defaultPolicy.js';
import { compareAmountStrings, runPolicyChecks } from '../src/policy/policyChecks.js';
import type { PreflightRequest } from '../src/core/types.js';

function makePublicKey(): string {
  return Keypair.generate().publicKey.toBase58();
}

function buildRequest(): PreflightRequest {
  const recipient = makePublicKey();

  return {
    userIntent: {
      actionType: 'transfer',
      assetSymbol: 'USDC',
      amount: '10',
      recipient,
    },
    proposedAction: {
      chain: 'solana',
      actionType: 'transfer',
      assetSymbol: 'USDC',
      amount: '10.0',
      recipient,
      tokenMint: makePublicKey(),
      programIds: [],
    },
  };
}

describe('policyChecks', () => {
  it('treats equivalent numeric strings as equal', () => {
    expect(compareAmountStrings('10', '10.0')).toBe(0);
    expect(compareAmountStrings('9.99', '10')).toBe(-1);
    expect(compareAmountStrings('100.1', '100.01')).toBe(1);
  });

  it('fails when amount exceeds the configured maxAmount', () => {
    const checks = runPolicyChecks(buildRequest(), resolvePolicy({ maxAmount: '5' }));

    expect(checks.find((check) => check.id === 'amount_within_policy_limit')?.status).toBe('FAIL');
  });

  it('skips recipient matching when the policy disables it', () => {
    const request = buildRequest();
    request.proposedAction.recipient = makePublicKey();

    const checks = runPolicyChecks(request, resolvePolicy({ requireRecipientMatch: false }));

    expect(checks.find((check) => check.id === 'recipient_match')?.status).toBe('PASS');
    expect(checks.find((check) => check.id === 'recipient_match')?.message).toContain('skipped');
  });
});
