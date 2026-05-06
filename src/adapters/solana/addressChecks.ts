import { PublicKey } from '@solana/web3.js';

import type { CheckResult } from '../../core/types.js';

export function isValidSolanaPublicKey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export function createRecipientCheck(recipient: string): CheckResult {
  const isValid = isValidSolanaPublicKey(recipient);

  return {
    id: 'solana_recipient_valid',
    status: isValid ? 'PASS' : 'FAIL',
    severity: 'high',
    message: isValid ? 'Recipient is a valid Solana public key.' : 'Recipient is not a valid Solana public key.',
  };
}
