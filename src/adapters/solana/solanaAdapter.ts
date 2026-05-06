import type { CheckResult, EngineOptions, PreflightRequest, ResolvedPolicy } from '../../core/types.js';
import { createRecipientCheck } from './addressChecks.js';
import { createProgramAllowlistCheck, createProgramIdValidityCheck, createUnknownProgramCheck } from './programChecks.js';
import { createBalanceCheckStub, createRpcHealthCheck } from './rpcChecks.js';
import { createTokenMintCheck } from './tokenChecks.js';

export async function runSolanaAdapterChecks(
  request: PreflightRequest,
  policy: ResolvedPolicy,
  options: EngineOptions = {},
): Promise<CheckResult[]> {
  const checks: CheckResult[] = [createRecipientCheck(request.proposedAction.recipient)];

  const tokenMintCheck = createTokenMintCheck(request.proposedAction.tokenMint);
  if (tokenMintCheck) {
    checks.push(tokenMintCheck);
  }

  const programIdValidityCheck = createProgramIdValidityCheck(request.proposedAction.programIds);
  if (programIdValidityCheck) {
    checks.push(programIdValidityCheck);
  }

  const programAllowlistCheck = createProgramAllowlistCheck(request.proposedAction.programIds, policy);
  if (programAllowlistCheck) {
    checks.push(programAllowlistCheck);
  }

  const unknownProgramCheck = createUnknownProgramCheck(request.proposedAction.programIds, policy);
  if (unknownProgramCheck) {
    checks.push(unknownProgramCheck);
  }

  const rpcHealthCheck = await createRpcHealthCheck(
    request.solana,
    options.defaultRpcUrl,
    options.rpcHealthChecker,
  );
  if (rpcHealthCheck) {
    checks.push(rpcHealthCheck);
  }

  const balanceCheck = createBalanceCheckStub(request.solana);
  if (balanceCheck) {
    checks.push(balanceCheck);
  }

  return checks;
}
