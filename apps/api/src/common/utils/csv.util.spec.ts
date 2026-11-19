import { describe, expect, it } from 'vitest';
import {
  buildCsvFileName,
  escapeCsvCell,
  toCsv,
} from './csv.util.js';

describe('csv util', () => {
  it('quotes cells that contain separators, quotes or newlines', () => {
    expect(escapeCsvCell('Dhaka, Bangladesh')).toBe('"Dhaka, Bangladesh"');
    expect(escapeCsvCell('He said "hello"')).toBe('"He said ""hello"""');
    expect(escapeCsvCell('line one\nline two')).toBe(
      '"line one\nline two"',
    );
  });

  it('neutralizes spreadsheet formulas', () => {
    expect(escapeCsvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell('+8801712345678')).toBe("'+8801712345678");
    expect(escapeCsvCell('-5')).toBe("'-5");
  });

  it('renders null values as empty cells and joins rows with CRLF', () => {
    expect(toCsv([['Name', null, undefined, 0]])).toBe('Name,,,0\r\n');
  });

  it('builds a dated file name', () => {
    expect(
      buildCsvFileName('orders', new Date('2026-11-18T12:00:00.000Z')),
    ).toBe('orders-2026-11-18.csv');
  });
});
