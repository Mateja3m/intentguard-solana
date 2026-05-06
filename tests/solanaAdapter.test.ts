import { Keypair, SystemProgram } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { runSolanaAdapterChecks } from '../src/adapters/solana/solanaAdapter.js';
import { resolvePolicy } from '../src/policy/defaultPolicy.js';
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
      amount: '10',
      recipient,
      tokenMint: makePublicKey(),
      programIds: [SystemProgram.programId.toBase58()],
    },
    solana: {
      checkRpcHealth: false,
      checkBalance: false,
    },
  };
}

describe('runSolanaAdapterChecks', () => {
  it('fails on invalid Solana addresses and program IDs', async () => {
    const request = buildRequest();
    request.proposedAction.recipient = 'invalid-public-key';
    request.proposedAction.programIds = ['not-a-program-id'];

    const checks = await runSolanaAdapterChecks(request, resolvePolicy());

    expect(checks.find((check) => check.id === 'solana_recipient_valid')?.status).toBe('FAIL');
    expect(checks.find((check) => check.id === 'solana_program_ids_valid')?.status).toBe('FAIL');
  });

  it('warns when a program is unknown and known programs are not required', async () => {
    const request = buildRequest();
    request.proposedAction.programIds = [makePublicKey()];

    const checks = await runSolanaAdapterChecks(
      request,
      resolvePolicy({
        allowedProgramIds: [SystemProgram.programId.toBase58()],
        requireKnownPrograms: false,
      }),
    );

    expect(checks.find((check) => check.id === 'unknown_programs')?.status).toBe('WARN');
  });

  it('fails allowlist checks for disallowed program IDs', async () => {
    const request = buildRequest();
    request.proposedAction.programIds = [makePublicKey()];

    const checks = await runSolanaAdapterChecks(
      request,
      resolvePolicy({
        allowedProgramIds: [SystemProgram.programId.toBase58()],
        requireKnownPrograms: true,
      }),
    );

    expect(checks.find((check) => check.id === 'program_ids_allowed')?.status).toBe('FAIL');
  });

  it('uses injected RPC health checks instead of a live network call', async () => {
    const request = buildRequest();
    request.solana = {
      rpcUrl: 'https://rpc.invalid',
      checkRpcHealth: true,
      checkBalance: false,
    };

    const rpcHealthChecker = vi.fn().mockResolvedValue({
      ok: false,
      message: 'RPC health check failed for https://rpc.invalid: timeout',
    });

    const checks = await runSolanaAdapterChecks(request, resolvePolicy(), { rpcHealthChecker });

    expect(rpcHealthChecker).toHaveBeenCalledWith('https://rpc.invalid');
    expect(checks.find((check) => check.id === 'solana_rpc_health')?.status).toBe('WARN');
  });
});
