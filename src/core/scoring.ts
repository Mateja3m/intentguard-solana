import type { CheckResult, CheckSeverity } from './types.js';

const riskWeights: Record<'WARN' | 'FAIL', Record<CheckSeverity, number>> = {
  WARN: {
    low: 10,
    medium: 15,
    high: 20,
  },
  FAIL: {
    low: 30,
    medium: 35,
    high: 40,
  },
};

export function calculateRiskScore(checks: CheckResult[]): number {
  const total = checks.reduce((score, check) => {
    if (check.status === 'PASS') {
      return score;
    }

    const severity = check.severity ?? 'medium';
    return score + riskWeights[check.status][severity];
  }, 0);

  return Math.min(total, 100);
}
