import { ZodError } from 'zod';

import { runSolanaAdapterChecks } from '../adapters/solana/solanaAdapter.js';
import { resolvePolicy } from '../policy/defaultPolicy.js';
import { runPolicyChecks } from '../policy/policyChecks.js';
import { buildReport } from './report.js';
import { preflightRequestSchema } from './schemas.js';
import type { CheckResult, EngineOptions, PreflightReport, PreflightRequest } from './types.js';

function formatSchemaError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `- ${path}: ${issue.message}`;
  });

  return ['Invalid preflight input:', ...issues].join('\n');
}

export function parsePreflightInput(input: unknown): PreflightRequest {
  const parsed = preflightRequestSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(formatSchemaError(parsed.error));
  }

  return parsed.data;
}

export async function evaluatePreflight(input: unknown, options: EngineOptions = {}): Promise<PreflightReport> {
  const request = parsePreflightInput(input);
  const policy = resolvePolicy(request.policy);

  const chain = request.proposedAction.chain.trim().toLowerCase();
  const checks: CheckResult[] = [
    {
      id: 'chain_is_solana',
      status: chain === 'solana' ? 'PASS' : 'FAIL',
      severity: 'high',
      message:
        chain === 'solana'
          ? 'Proposed chain is Solana.'
          : `Proposed chain must be "solana", received "${request.proposedAction.chain}".`,
    },
    ...runPolicyChecks(request, policy),
  ];

  if (chain === 'solana') {
    checks.push(...(await runSolanaAdapterChecks(request, policy, options)));
  }

  return buildReport(request, checks);
}
