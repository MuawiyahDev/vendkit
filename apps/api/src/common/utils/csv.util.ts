const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;
const CSV_QUOTE_REQUIRED = /[",\n\r]/;

/**
 * Escapes a single CSV cell. Values that begin with a spreadsheet formula
 * character are prefixed with an apostrophe so exported seller data cannot
 * execute formulas when opened in Excel or Google Sheets.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let text = String(value);

  if (CSV_FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }

  if (CSV_QUOTE_REQUIRED.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  return `${rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\r\n')}\r\n`;
}

export function buildCsvFileName(prefix: string, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}

export const MAX_CSV_EXPORT_ROWS = 10_000;
