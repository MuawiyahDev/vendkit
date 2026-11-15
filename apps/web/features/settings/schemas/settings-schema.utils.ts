import { z } from "zod";

export function hasAtMostDecimalPlaces(
  value: number,
  maxDecimalPlaces: number,
): boolean {
  const text = String(value);
  if (text.includes("e") || text.includes("E")) {
    return false;
  }
  const decimals = text.split(".")[1] ?? "";
  return decimals.length <= maxDecimalPlaces;
}

export function requiredText(max: number, tooLongMessage: string) {
  return z
    .string()
    .trim()
    .min(1, "This field is required")
    .max(max, tooLongMessage);
}

export function optionalText(max: number, tooLongMessage: string) {
  return z
    .string()
    .trim()
    .max(max, tooLongMessage)
    .transform((value) => (value === "" ? null : value));
}

export function optionalEmail() {
  return z
    .string()
    .trim()
    .max(254, "Email must be at most 254 characters")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter a valid email address",
    )
    .transform((value) => (value === "" ? null : value));
}

export function optionalPhone() {
  return z
    .string()
    .trim()
    .max(30, "Phone must be at most 30 characters")
    .refine(
      (value) =>
        value === "" || /^\+?[\d\s\-().]{6,30}$/.test(value),
      "Enter a valid phone number",
    )
    .transform((value) => (value === "" ? null : value));
}

export function optionalWebsite() {
  return z
    .string()
    .trim()
    .max(500, "Website must be at most 500 characters")
    .refine((value) => {
      if (value === "") {
        return true;
      }
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid URL starting with http:// or https://")
    .transform((value) => (value === "" ? null : value));
}

export function decimalNumber(options: {
  min?: number;
  max: number;
  maxDecimalPlaces?: number;
  requiredMessage?: string;
}) {
  const {
    min = 0,
    max,
    maxDecimalPlaces = 2,
    requiredMessage = "Enter a valid number",
  } = options;

  return z
    .number(requiredMessage)
    .min(min, `Must be ${min} or more`)
    .max(max, `Must be ${max} or less`)
    .refine(
      (value) => hasAtMostDecimalPlaces(value, maxDecimalPlaces),
      `Use at most ${maxDecimalPlaces} decimal places`,
    );
}

export function nullableDecimalNumber(options: {
  min?: number;
  max: number;
  maxDecimalPlaces?: number;
  requiredMessage?: string;
}) {
  return decimalNumber(options).nullable();
}

export function integerNumber(options: {
  min: number;
  max: number;
  requiredMessage?: string;
}) {
  return z
    .number(options.requiredMessage ?? "Enter a valid number")
    .int("Must be a whole number")
    .min(options.min, `Must be ${options.min} or more`)
    .max(options.max, `Must be ${options.max} or less`);
}

export function nullableIntegerNumber(options: {
  min: number;
  max: number;
  requiredMessage?: string;
}) {
  return integerNumber(options).nullable();
}
