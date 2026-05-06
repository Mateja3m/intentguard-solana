import { calculateRiskScore } from './scoring.js';
import type { CheckResult, CheckStatus, Decision, PreflightReport, PreflightRequest } from './types.js';

function resolveStatus(checks: CheckResult[]): CheckStatus {
  if (checks.some((check) => check.status === 'FAIL')) {
    return 'FAIL';
  }

  if (checks.some((check) => check.status === 'WARN')) {
    return 'WARN';
  }

  return 'PASS';
}

function resolveDecision(status: CheckStatus): Decision {
  if (status === 'FAIL') {
    return 'BLOCK';
  }

  if (status === 'WARN') {
    return 'REVIEW_REQUIRED';
  }

  return 'ALLOW';
}

function buildSummary(status: CheckStatus, checks: CheckResult[]): string {
  const failedIds = new Set(checks.filter((check) => check.status === 'FAIL').map((check) => check.id));

  if (failedIds.has('action_type_match') || failedIds.has('amount_match') || failedIds.has('recipient_match') || failedIds.has('asset_match')) {
    return 'The proposed Solana action does not match the user intent.';
  }

  if (failedIds.has('action_allowed') || failedIds.has('asset_allowed') || failedIds.has('amount_within_policy_limit') || failedIds.has('program_ids_allowed')) {
    return 'The proposed Solana action violates the configured policy.';
  }

  if (failedIds.has('solana_recipient_valid') || failedIds.has('solana_token_mint_valid') || failedIds.has('solana_program_ids_valid')) {
    return 'The proposed Solana action contains invalid Solana account metadata.';
  }

  if (failedIds.has('unknown_programs')) {
    return 'The proposed Solana action references an unknown program.';
  }

  if (status === 'WARN' && checks.some((check) => check.id === 'solana_rpc_health' && check.status === 'WARN')) {
    return 'The action passed deterministic checks, but the RPC health check needs review.';
  }

  if (status === 'WARN') {
    return 'The action passed core validation but requires manual review.';
  }

  return 'The proposed Solana action passed all configured pre-signing checks.';
}

function buildRecommendation(report: PreflightReport): string {
  if (report.status === 'FAIL') {
    return `Do not sign. ${report.summary}`;
  }

  if (report.status === 'WARN') {
    return 'Review the warnings before preparing a transaction for signing.';
  }

  return 'Proceed. No blocking issues were found.';
}

export function buildReport(request: PreflightRequest, checks: CheckResult[]): PreflightReport {
  const status = resolveStatus(checks);

  return {
    status,
    decision: resolveDecision(status),
    riskScore: calculateRiskScore(checks),
    summary: buildSummary(status, checks),
    checks,
    metadata: {
      chain: request.proposedAction.chain,
      actionType: request.proposedAction.actionType,
      assetSymbol: request.proposedAction.assetSymbol,
    },
  };
}

export function formatConsoleReport(report: PreflightReport): string {
  const checkLines = report.checks.map((check) => {
    const id = check.id.padEnd(28, ' ');
    return `${check.status.padEnd(5, ' ')} ${id} ${check.message}`;
  });

  return [
    'IntentGuard Solana PoC',
    '',
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    `Risk Score: ${report.riskScore}/100`,
    '',
    'Checks:',
    ...checkLines,
    '',
    'Recommendation:',
    buildRecommendation(report),
  ].join('\n');
}
