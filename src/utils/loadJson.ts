import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.';
}

export async function loadJsonFile(filePath: string): Promise<{ data: unknown; resolvedPath: string }> {
  const resolvedPath = resolve(process.cwd(), filePath);

  let rawFile: string;
  try {
    rawFile = await readFile(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read JSON file at ${resolvedPath}: ${getErrorMessage(error)}`);
  }

  try {
    return {
      data: JSON.parse(rawFile),
      resolvedPath,
    };
  } catch (error) {
    throw new Error(`Invalid JSON in ${resolvedPath}: ${getErrorMessage(error)}`);
  }
}
