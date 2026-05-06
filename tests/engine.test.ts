import { Keypair, SystemProgram } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { evaluatePreflight } from '../src/core/engine.js';
import type { PreflightRequest } from '../src/core/types.js';

function makePublicKey(): string {
  return Keypair.generate().publicKey.toBase58();
}

function buildRequest(): PreflightRequest {
  const recipient = makePublicKey();
  const tokenMint = makePublicKey();

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
      amount: '10',
      recipient,
      tokenMint,
      programIds: [SystemProgram.programId.toBase58()],
    },
    policy: {
      maxAmount: '100',
      allowedActions: ['transfer'],
      allowedAssets: ['USDC'],
      allowedProgramIds: [SystemProgram.programId.toBase58()],
      requireKnownPrograms: true,
      requireRecipientMatch: true,
      requireAmountMatch: true,
      requireAssetMatch: true,
    },
    solana: {
      checkRpcHealth: false,
      checkBalance: false,
    },
  };
}

describe('evaluatePreflight', () => {
  it('returns PASS for a safe transfer', async () => {
    const report = await evaluatePreflight(buildRequest());

    expect(report.status).toBe('PASS');
    expect(report.decision).toBe('ALLOW');
    expect(report.riskScore).toBe(0);
  });

  it('returns FAIL when the proposed recipient does not match the user intent', async () => {
    const request = buildRequest();
    request.proposedAction.recipient = makePublicKey();

    const report = await evaluatePreflight(request);

    expect(report.status).toBe('FAIL');
    expect(report.decision).toBe('BLOCK');
    expect(report.checks.find((check) => check.id === 'recipient_match')?.status).toBe('FAIL');
  });

  it('returns readable schema errors for malformed input', async () => {
    await expect(evaluatePreflight({ proposedAction: {} })).rejects.toThrow('Invalid preflight input:');
  });
});
