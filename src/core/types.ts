export type CheckStatus = 'PASS' | 'WARN' | 'FAIL';
export type Decision = 'ALLOW' | 'REVIEW_REQUIRED' | 'BLOCK';
export type CheckSeverity = 'low' | 'medium' | 'high';

export interface UserIntent {
  actionType: string;
  assetSymbol: string;
  amount: string;
  recipient: string;
}

export interface ProposedAction {
  chain: string;
  actionType: string;
  assetSymbol: string;
  amount: string;
  recipient: string;
  tokenMint?: string | undefined;
  programIds: string[];
}

export interface PolicyConfig {
  maxAmount?: string | undefined;
  allowedActions?: string[] | undefined;
  allowedAssets?: string[] | undefined;
  allowedProgramIds?: string[] | undefined;
  requireKnownPrograms?: boolean | undefined;
  requireRecipientMatch?: boolean | undefined;
  requireAmountMatch?: boolean | undefined;
  requireAssetMatch?: boolean | undefined;
}

export interface ResolvedPolicy {
  maxAmount?: string | undefined;
  allowedActions?: string[] | undefined;
  allowedAssets?: string[] | undefined;
  allowedProgramIds?: string[] | undefined;
  requireKnownPrograms: boolean;
  requireRecipientMatch: boolean;
  requireAmountMatch: boolean;
  requireAssetMatch: boolean;
}

export interface SolanaContext {
  rpcUrl?: string | undefined;
  checkRpcHealth?: boolean | undefined;
  checkBalance?: boolean | undefined;
  balanceAddress?: string | undefined;
}

export interface PreflightRequest {
  userIntent: UserIntent;
  proposedAction: ProposedAction;
  policy?: PolicyConfig | undefined;
  solana?: SolanaContext | undefined;
}

export interface CheckResult {
  id: string;
  status: CheckStatus;
  message: string;
  severity?: CheckSeverity | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface ReportMetadata {
  chain: string;
  actionType: string;
  assetSymbol?: string | undefined;
}

export interface PreflightReport {
  status: CheckStatus;
  decision: Decision;
  riskScore: number;
  summary: string;
  checks: CheckResult[];
  metadata: ReportMetadata;
}

export interface RpcHealthResult {
  ok: boolean;
  message: string;
}

export type RpcHealthChecker = (rpcUrl: string) => Promise<RpcHealthResult>;

export interface EngineOptions {
  defaultRpcUrl?: string | undefined;
  rpcHealthChecker?: RpcHealthChecker | undefined;
}
