import { Connection } from '@solana/web3.js';

import type { CheckResult, RpcHealthChecker, RpcHealthResult, SolanaContext } from '../../core/types.js';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown RPC error.';
}

export async function defaultRpcHealthChecker(rpcUrl: string): Promise<RpcHealthResult> {
  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    await connection.getVersion();
    await connection.getLatestBlockhash();

    return {
      ok: true,
      message: `RPC health check succeeded for ${rpcUrl}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: `RPC health check failed for ${rpcUrl}: ${getErrorMessage(error)}`,
    };
  }
}

export async function createRpcHealthCheck(
  context: SolanaContext | undefined,
  defaultRpcUrl: string | undefined,
  rpcHealthChecker: RpcHealthChecker = defaultRpcHealthChecker,
): Promise<CheckResult | null> {
  if (!(context?.checkRpcHealth ?? false)) {
    return null;
  }

  const rpcUrl = context?.rpcUrl ?? defaultRpcUrl;

  if (!rpcUrl) {
    return {
      id: 'solana_rpc_health',
      status: 'WARN',
      severity: 'low',
      message: 'RPC health check was requested but no RPC URL was provided.',
    };
  }

  const result = await rpcHealthChecker(rpcUrl);

  return {
    id: 'solana_rpc_health',
    status: result.ok ? 'PASS' : 'WARN',
    severity: result.ok ? 'low' : 'medium',
    message: result.message,
  };
}

export function createBalanceCheckStub(context?: SolanaContext): CheckResult | null {
  if (!(context?.checkBalance ?? false)) {
    return null;
  }

  return {
    id: 'solana_balance_check',
    status: 'WARN',
    severity: 'low',
    message: 'Balance check is a configurable stub in this PoC and was not executed.',
  };
}
