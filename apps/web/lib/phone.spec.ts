import { describe, expect, it } from "vitest";

import { toPhoneInputValue, toSupportedCountry } from "./phone";

describe("toSupportedCountry", () => {
  it("normalizes supported ISO country codes", () => {
    expect(toSupportedCountry("bd")).toBe("BD");
    expect(toSupportedCountry(" US ")).toBe("US");
  });

  it("rejects missing and unsupported values", () => {
    expect(toSupportedCountry(null)).toBeUndefined();
    expect(toSupportedCountry("")).toBeUndefined();
    expect(toSupportedCountry("XX")).toBeUndefined();
  });
});

describe("toPhoneInputValue", () => {
  it("compacts international numbers", () => {
    expect(toPhoneInputValue("+880 (17) 1234-5678")).toBe("+8801712345678");
    expect(toPhoneInputValue("008801712345678")).toBe("+8801712345678");
  });

  it("interprets local numbers with the default country", () => {
    expect(toPhoneInputValue("01712345678", "BD")).toBe("+8801712345678");
    expect(toPhoneInputValue("2025550193", "US")).toBe("+12025550193");
  });

  it("preserves significant leading zeros", () => {
    expect(toPhoneInputValue("0212345678", "IT")).toBe("+390212345678");
  });

  it("leaves local numbers untouched when no country is known", () => {
    expect(toPhoneInputValue("01712345678")).toBeUndefined();
    expect(toPhoneInputValue("01712345678", "XX")).toBeUndefined();
  });

  it("treats empty values as an empty input", () => {
    expect(toPhoneInputValue(null)).toBeUndefined();
    expect(toPhoneInputValue("")).toBeUndefined();
    expect(toPhoneInputValue("   ")).toBeUndefined();
  });
});
