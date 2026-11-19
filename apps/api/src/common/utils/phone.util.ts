export const PHONE_PATTERN = /^\+?\d{6,15}$/;

export const PHONE_INVALID_MESSAGE =
  'phone must contain between 6 and 15 digits, optionally prefixed with +';

const PHONE_SEPARATORS = /[\s\-().]/g;
const NON_DIGITS = /\D/g;
const INTERNATIONAL_PREFIX = /^00/;
const PHONE_LIKE = /^\+?[\d\s\-().]+$/;

export function isPhoneLike(value: string): boolean {
  return PHONE_LIKE.test(value);
}

export function normalizePhone(value: string): string {
  const compact = value.replace(PHONE_SEPARATORS, '');
  const withInternationalPrefix = INTERNATIONAL_PREFIX.test(compact)
    ? `+${compact.slice(2)}`
    : compact;
  const hasCountryCode = withInternationalPrefix.startsWith('+');
  const digits = withInternationalPrefix.replace(NON_DIGITS, '');

  return `${hasCountryCode ? '+' : ''}${digits}`;
}

/**
 * Digits-only comparison key used to detect duplicate customer phone
 * numbers even when one entry includes formatting or a leading plus.
 * Matches the `Customer.phoneNormalized` column.
 */
export function phoneDuplicateKey(value: string): string {
  return normalizePhone(value).replace(NON_DIGITS, '').slice(0, 20);
}
