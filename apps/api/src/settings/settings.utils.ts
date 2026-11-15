import { Prisma } from '@repo/database';

interface InvoiceNumberFormatConfig {
  numberPrefix: string;
  numberFormat: string;
  yearBasedNumbering: boolean;
}

export function formatInvoiceNumber(
  config: InvoiceNumberFormatConfig,
  sequence: number,
  issuedAt: Date = new Date(),
): string {
  const year = issuedAt.getUTCFullYear().toString();
  const month = (issuedAt.getUTCMonth() + 1).toString().padStart(2, '0');
  const sequenceText = sequence.toString();

  return config.numberFormat
    .replaceAll('{prefix}', config.numberPrefix)
    .replaceAll('{year}', config.yearBasedNumbering ? year : '')
    .replaceAll('{month}', month)
    .replaceAll('{sequence}', sequenceText);
}

export function isInvoiceNumberFormatCompatible(
  numberFormat: string,
  yearBasedNumbering: boolean,
): boolean {
  return yearBasedNumbering || !numberFormat.includes('{year}');
}

export function areValidSeparators(
  decimalSeparator: string,
  thousandSeparator: string,
): boolean {
  if (decimalSeparator === thousandSeparator) {
    return false;
  }

  return [decimalSeparator, thousandSeparator].every(
    (separator) => separator === '' || !/[\dA-Za-z]/.test(separator),
  );
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function calculateShippingCharge(input: {
  requestedCharge: Prisma.Decimal | undefined;
  enabled: boolean;
  defaultCharge: Prisma.Decimal;
  freeShippingThreshold: Prisma.Decimal | null;
  subtotal: Prisma.Decimal;
}): Prisma.Decimal {
  if (input.requestedCharge !== undefined) {
    return input.requestedCharge;
  }

  if (!input.enabled) {
    return new Prisma.Decimal(0);
  }

  if (
    input.freeShippingThreshold !== null &&
    input.subtotal.gte(input.freeShippingThreshold)
  ) {
    return new Prisma.Decimal(0);
  }

  return input.defaultCharge;
}
