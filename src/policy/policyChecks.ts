import type { CheckResult, PreflightRequest, ResolvedPolicy } from '../core/types.js';

function normalizeActionType(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAssetSymbol(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeAmount(value: string): { integer: string; fraction: string } {
  const [rawInteger = '0', rawFraction = ''] = value.split('.');
  const integer = rawInteger.replace(/^0+(?=\d)/, '') || '0';
  const fraction = rawFraction.replace(/0+$/, '');

  return { integer, fraction };
}

export function compareAmountStrings(left: string, right: string): -1 | 0 | 1 {
  const normalizedLeft = normalizeAmount(left);
  const normalizedRight = normalizeAmount(right);

  if (normalizedLeft.integer.length !== normalizedRight.integer.length) {
    return normalizedLeft.integer.length > normalizedRight.integer.length ? 1 : -1;
  }

  if (normalizedLeft.integer !== normalizedRight.integer) {
    return normalizedLeft.integer > normalizedRight.integer ? 1 : -1;
  }

  const maxFractionLength = Math.max(normalizedLeft.fraction.length, normalizedRight.fraction.length);
  const leftFraction = normalizedLeft.fraction.padEnd(maxFractionLength, '0');
  const rightFraction = normalizedRight.fraction.padEnd(maxFractionLength, '0');

  if (leftFraction === rightFraction) {
    return 0;
  }

  return leftFraction > rightFraction ? 1 : -1;
}

function buildCheck(
  id: string,
  status: CheckResult['status'],
  message: string,
  severity: NonNullable<CheckResult['severity']>,
): CheckResult {
  return { id, status, message, severity };
}

function isAllowedValue(value: string, allowedValues?: string[], normalizer?: (value: string) => string): boolean {
  if (!allowedValues || allowedValues.length === 0) {
    return true;
  }

  const normalize = normalizer ?? ((input: string) => input);
  const allowed = new Set(allowedValues.map(normalize));
  return allowed.has(normalize(value));
}

export function runPolicyChecks(request: PreflightRequest, policy: ResolvedPolicy): CheckResult[] {
  const checks: CheckResult[] = [];
  const { userIntent, proposedAction } = request;

  const actionTypeMatches = normalizeActionType(userIntent.actionType) === normalizeActionType(proposedAction.actionType);
  checks.push(
    buildCheck(
      'action_type_match',
      actionTypeMatches ? 'PASS' : 'FAIL',
      actionTypeMatches
        ? 'Action type matches the user intent.'
        : 'Action type does not match the user intent.',
      'high',
    ),
  );

  if (policy.requireAmountMatch) {
    const amountMatches = compareAmountStrings(userIntent.amount, proposedAction.amount) === 0;
    checks.push(
      buildCheck(
        'amount_match',
        amountMatches ? 'PASS' : 'FAIL',
        amountMatches ? 'Amount matches the user intent.' : 'Amount does not match the user intent.',
        'high',
      ),
    );
  } else {
    checks.push(buildCheck('amount_match', 'PASS', 'Amount match check skipped by policy.', 'low'));
  }

  if (policy.requireRecipientMatch) {
    const recipientMatches = userIntent.recipient.trim() === proposedAction.recipient.trim();
    checks.push(
      buildCheck(
        'recipient_match',
        recipientMatches ? 'PASS' : 'FAIL',
        recipientMatches ? 'Recipient matches the user intent.' : 'Recipient does not match the user intent.',
        'high',
      ),
    );
  } else {
    checks.push(buildCheck('recipient_match', 'PASS', 'Recipient match check skipped by policy.', 'low'));
  }

  if (policy.requireAssetMatch) {
    const assetMatches = normalizeAssetSymbol(userIntent.assetSymbol) === normalizeAssetSymbol(proposedAction.assetSymbol);
    checks.push(
      buildCheck(
        'asset_match',
        assetMatches ? 'PASS' : 'FAIL',
        assetMatches ? 'Asset symbol matches the user intent.' : 'Asset symbol does not match the user intent.',
        'medium',
      ),
    );
  } else {
    checks.push(buildCheck('asset_match', 'PASS', 'Asset match check skipped by policy.', 'low'));
  }

  const actionAllowed = isAllowedValue(proposedAction.actionType, policy.allowedActions, normalizeActionType);
  checks.push(
    buildCheck(
      'action_allowed',
      actionAllowed ? 'PASS' : 'FAIL',
      actionAllowed ? 'Action type is allowed by policy.' : 'Action type is not allowed by policy.',
      'high',
    ),
  );

  const assetAllowed = isAllowedValue(proposedAction.assetSymbol, policy.allowedAssets, normalizeAssetSymbol);
  checks.push(
    buildCheck(
      'asset_allowed',
      assetAllowed ? 'PASS' : 'FAIL',
      assetAllowed ? 'Asset is allowed by policy.' : 'Asset is not allowed by policy.',
      'medium',
    ),
  );

  if (policy.maxAmount) {
    const withinLimit = compareAmountStrings(proposedAction.amount, policy.maxAmount) <= 0;
    checks.push(
      buildCheck(
        'amount_within_policy_limit',
        withinLimit ? 'PASS' : 'FAIL',
        withinLimit ? 'Amount is within the configured policy limit.' : 'Amount exceeds the configured policy limit.',
        'high',
      ),
    );
  }

  return checks;
}
