/**
 * CSV output formatter
 */

import { ModelCheckResult } from '../types/index.js';

/**
 * Escape CSV field
 */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate CSV output
 */
export function generateCsvOutput(results: ModelCheckResult[]): string {
  const headers = ['provider', 'model', 'status', 'latencyMs', 'error'];
  const lines: string[] = [headers.join(',')];

  for (const result of results) {
    const row = [
      escapeCsvField(result.provider),
      escapeCsvField(result.id),
      escapeCsvField(result.status),
      result.latencyMs.toString(),
      escapeCsvField(result.error || ''),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Output CSV to stdout
 */
export function outputCsv(results: ModelCheckResult[]): void {
  console.log(generateCsvOutput(results));
}
