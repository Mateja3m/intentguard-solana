import type { PolicyConfig, ResolvedPolicy } from '../core/types.js';

export const defaultPolicy: ResolvedPolicy = {
  requireKnownPrograms: false,
  requireRecipientMatch: true,
  requireAmountMatch: true,
  requireAssetMatch: true,
};

export function resolvePolicy(policy?: PolicyConfig): ResolvedPolicy {
  return {
    maxAmount: policy?.maxAmount,
    allowedActions: policy?.allowedActions,
    allowedAssets: policy?.allowedAssets,
    allowedProgramIds: policy?.allowedProgramIds,
    requireKnownPrograms: policy?.requireKnownPrograms ?? defaultPolicy.requireKnownPrograms,
    requireRecipientMatch: policy?.requireRecipientMatch ?? defaultPolicy.requireRecipientMatch,
    requireAmountMatch: policy?.requireAmountMatch ?? defaultPolicy.requireAmountMatch,
    requireAssetMatch: policy?.requireAssetMatch ?? defaultPolicy.requireAssetMatch,
  };
}
