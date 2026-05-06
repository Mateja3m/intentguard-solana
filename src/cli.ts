#!/usr/bin/env node

import { evaluatePreflight, formatConsoleReport } from './index.js';
import { loadJsonFile } from './utils/loadJson.js';
import { logger } from './utils/logger.js';

function getUsage(): string {
  return ['Usage:', '  npm run preflight -- <path-to-json> [--json]', '  npx tsx src/cli.ts <path-to-json> [--json]'].join('\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const showJson = args.includes('--json');
  const inputPath = args.find((arg) => !arg.startsWith('--'));

  if (!inputPath) {
    logger.error(getUsage());
    process.exitCode = 1;
    return;
  }

  try {
    const { data } = await loadJsonFile(inputPath);
    const report = await evaluatePreflight(
      data,
      process.env.SOLANA_RPC_URL ? { defaultRpcUrl: process.env.SOLANA_RPC_URL } : {},
    );

    logger.info(formatConsoleReport(report));

    if (showJson) {
      logger.info(`\nJSON Report:\n${JSON.stringify(report, null, 2)}`);
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Unknown error.');
    process.exitCode = 1;
  }
}

void main();
