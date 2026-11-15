import { describe, expect, it } from "vitest";

import type { WhatsAppOrder } from "./whatsapp.types";
import {
  buildWhatsAppUrl,
  canMessageOrderOnWhatsApp,
  getOrderSavedRecipients,
  parseWhatsAppPhone,
  sanitizePhoneInput,
} from "./whatsapp.utils";

const baseOrder: WhatsAppOrder = {
  orderNumber: "ORD-1001",
  customer: {
    id: "customer-1",
    name: "Ayesha Rahman",
    phone: "01712-345678",
    email: null,
  },
  status: "PENDING",
  currency: "BDT",
  totalAmount: "1250.00",
  amountPaid: "0.00",
  shippingName: null,
  shippingPhone: null,
};

describe("sanitizePhoneInput", () => {
  it("removes spaces, brackets, hyphens, and dots", () => {
    expect(sanitizePhoneInput("+880 (1712) 345-678")).toBe("+8801712345678");
  });

  it("converts the 00 international prefix to +", () => {
    expect(sanitizePhoneInput("00 880 1712 345678")).toBe("+8801712345678");
  });
});

describe("parseWhatsAppPhone", () => {
  it("parses a local number using the default country", () => {
    const result = parseWhatsAppPhone("01712-345678", "BD");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.phone.e164).toBe("+8801712345678");
      expect(result.phone.whatsappNumber).toBe("8801712345678");
      expect(result.phone.formatted).toBe("+880 1712 345678");
    }
  });

  it("parses an international number with a plus", () => {
    const result = parseWhatsAppPhone("+1 (202) 555-0123", "BD");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.phone.e164).toBe("+12025550123");
      expect(result.phone.country).toBe("US");
    }
  });

  it("does not duplicate a country calling code already present", () => {
    const result = parseWhatsAppPhone("8801712345678", "BD");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.phone.e164).toBe("+8801712345678");
    }
  });

  it("parses a number using a country selected by the seller", () => {
    const result = parseWhatsAppPhone("2025550123", "US");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.phone.e164).toBe("+12025550123");
    }
  });

  it("requires a country for local-format numbers", () => {
    expect(parseWhatsAppPhone("01712345678", "")).toEqual({
      ok: false,
      error: "missing-country",
    });
  });

  it("rejects invalid numbers", () => {
    expect(parseWhatsAppPhone("123", "BD")).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("treats an empty value as empty", () => {
    expect(parseWhatsAppPhone("   ", "BD")).toEqual({
      ok: false,
      error: "empty",
    });
  });
});

describe("buildWhatsAppUrl", () => {
  it("uses digits only in the path and URL-encodes the message", () => {
    const parsed = parseWhatsAppPhone("01712-345678", "BD");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const url = buildWhatsAppUrl(
      parsed.phone,
      "Hello & welcome!\nOrder #ORD-1001",
    );

    expect(url).toBe(
      "https://wa.me/8801712345678?text=Hello%20%26%20welcome!%0AOrder%20%23ORD-1001",
    );
    expect(url.split("?")[0]).not.toContain("+");
  });

  it("accepts a raw phone string and strips formatting", () => {
    expect(buildWhatsAppUrl("+880 1712 345678", "Hi")).toBe(
      "https://wa.me/8801712345678?text=Hi",
    );
  });
});

describe("saved recipients", () => {
  it("deduplicates the customer and shipping numbers when identical", () => {
    const recipients = getOrderSavedRecipients(
      { ...baseOrder, shippingPhone: "+880 1712 345678" },
      "BD",
    );

    expect(recipients).toHaveLength(1);
    expect(recipients[0]?.id).toBe("customer");
    expect(recipients[0]?.result.ok).toBe(true);
  });

  it("offers a distinct order contact number", () => {
    const recipients = getOrderSavedRecipients(
      { ...baseOrder, shippingPhone: "+8801812345678", shippingName: "Rafi" },
      "BD",
    );

    expect(recipients).toHaveLength(2);
    expect(recipients[1]?.id).toBe("shipping");
    expect(recipients[1]?.name).toBe("Rafi");
  });

  it("detects whether any saved number can open WhatsApp", () => {
    expect(canMessageOrderOnWhatsApp(baseOrder, "BD")).toBe(true);
    expect(
      canMessageOrderOnWhatsApp(
        { ...baseOrder, customer: { ...baseOrder.customer!, phone: "123" } },
        "BD",
      ),
    ).toBe(false);
  });
});
