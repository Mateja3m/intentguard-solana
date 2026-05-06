import type { CheckResult } from '../../core/types.js';
import { isValidSolanaPublicKey } from './addressChecks.js';

export function createTokenMintCheck(tokenMint?: string): CheckResult | null {
  if (!tokenMint) {
    return null;
  }

  const isValid = isValidSolanaPublicKey(tokenMint);

  return {
    id: 'solana_token_mint_valid',
    status: isValid ? 'PASS' : 'FAIL',
    severity: 'medium',
    message: isValid ? 'Token mint is a valid Solana public key.' : 'Token mint is not a valid Solana public key.',
  };
}
