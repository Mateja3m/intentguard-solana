import { z } from 'zod';

const amountStringSchema = z
  .string()
  .trim()
  .regex(/^(0|[1-9]\d*)(\.\d+)?$/, 'Amount must be a non-negative numeric string.');

const nonEmptyString = z.string().trim().min(1, 'Value is required.');

export const userIntentSchema = z
  .object({
    actionType: nonEmptyString,
    assetSymbol: nonEmptyString,
    amount: amountStringSchema,
    recipient: nonEmptyString,
  })
  .strict();

export const proposedActionSchema = z
  .object({
    chain: nonEmptyString,
    actionType: nonEmptyString,
    assetSymbol: nonEmptyString,
    amount: amountStringSchema,
    recipient: nonEmptyString,
    tokenMint: nonEmptyString.optional(),
    programIds: z.array(nonEmptyString).default([]),
  })
  .strict();

export const policySchema = z
  .object({
    maxAmount: amountStringSchema.optional(),
    allowedActions: z.array(nonEmptyString).optional(),
    allowedAssets: z.array(nonEmptyString).optional(),
    allowedProgramIds: z.array(nonEmptyString).optional(),
    requireKnownPrograms: z.boolean().optional(),
    requireRecipientMatch: z.boolean().optional(),
    requireAmountMatch: z.boolean().optional(),
    requireAssetMatch: z.boolean().optional(),
  })
  .strict();

export const solanaContextSchema = z
  .object({
    rpcUrl: z.string().url('rpcUrl must be a valid URL.').optional(),
    checkRpcHealth: z.boolean().optional(),
    checkBalance: z.boolean().optional(),
    balanceAddress: nonEmptyString.optional(),
  })
  .strict();

export const preflightRequestSchema = z
  .object({
    userIntent: userIntentSchema,
    proposedAction: proposedActionSchema,
    policy: policySchema.optional(),
    solana: solanaContextSchema.optional(),
  })
  .strict();
