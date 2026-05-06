import type { CheckResult, ResolvedPolicy } from '../../core/types.js';
import { isValidSolanaPublicKey } from './addressChecks.js';

function validProgramIds(programIds: string[]): string[] {
  return programIds.filter((programId) => isValidSolanaPublicKey(programId));
}

export function createProgramIdValidityCheck(programIds: string[]): CheckResult | null {
  if (programIds.length === 0) {
    return null;
  }

  const invalidProgramIds = programIds.filter((programId) => !isValidSolanaPublicKey(programId));

  return {
    id: 'solana_program_ids_valid',
    status: invalidProgramIds.length === 0 ? 'PASS' : 'FAIL',
    severity: 'high',
    message:
      invalidProgramIds.length === 0
        ? 'All program IDs are valid Solana public keys.'
        : `One or more program IDs are not valid Solana public keys: ${invalidProgramIds.join(', ')}`,
  };
}

export function createProgramAllowlistCheck(programIds: string[], policy: ResolvedPolicy): CheckResult | null {
  if (!policy.allowedProgramIds || policy.allowedProgramIds.length === 0 || programIds.length === 0) {
    return null;
  }

  const allowedProgramIds = new Set(policy.allowedProgramIds);
  const disallowedProgramIds = validProgramIds(programIds).filter((programId) => !allowedProgramIds.has(programId));

  return {
    id: 'program_ids_allowed',
    status: disallowedProgramIds.length === 0 ? 'PASS' : 'FAIL',
    severity: 'high',
    message:
      disallowedProgramIds.length === 0
        ? 'All program IDs are allowed by policy.'
        : `One or more program IDs are not allowed by policy: ${disallowedProgramIds.join(', ')}`,
  };
}

export function createUnknownProgramCheck(programIds: string[], policy: ResolvedPolicy): CheckResult | null {
  if (programIds.length === 0) {
    return null;
  }

  const knownProgramIds = new Set<string>(policy.allowedProgramIds ?? []);

  if (!policy.requireKnownPrograms && knownProgramIds.size === 0) {
    return null;
  }

  const unknownProgramIds = validProgramIds(programIds).filter((programId) => !knownProgramIds.has(programId));

  if (unknownProgramIds.length === 0) {
    return {
      id: 'unknown_programs',
      status: 'PASS',
      severity: 'low',
      message: 'All program IDs are known to the configured policy.',
    };
  }

  return {
    id: 'unknown_programs',
    status: policy.requireKnownPrograms ? 'FAIL' : 'WARN',
    severity: policy.requireKnownPrograms ? 'medium' : 'low',
    message: `One or more program IDs are unknown to the configured policy: ${unknownProgramIds.join(', ')}`,
  };
}
