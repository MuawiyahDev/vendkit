import { describe, expect, it } from "vitest";

import { formatCurrency } from "../utils/orders.utils";
import {
  getAvailableWhatsAppTemplates,
  getDefaultWhatsAppTemplateId,
  renderWhatsAppTemplate,
} from "./whatsapp.templates";
import type { WhatsAppOrder } from "./whatsapp.types";

const baseOrder: WhatsAppOrder = {
  orderNumber: "ORD-2002",
  customer: {
    id: "customer-1",
    name: "Ayesha Rahman",
    phone: "+8801712345678",
    email: null,
  },
  status: "PENDING",
  currency: "USD",
  totalAmount: "1250.00",
  amountPaid: "250.00",
  shippingName: null,
  shippingPhone: null,
};

describe("WhatsApp templates", () => {
  it("renders the confirmation template from real order values", () => {
    expect(renderWhatsAppTemplate("order-confirmation", baseOrder)).toBe(
      "Hello Ayesha Rahman, thank you for your order #ORD-2002. Your order has been received successfully.",
    );
  });

  it("renders the current status", () => {
    expect(
      renderWhatsAppTemplate("status-update", {
        ...baseOrder,
        status: "SHIPPED",
      }),
    ).toBe(
      "Hello Ayesha Rahman, your order #ORD-2002 status has been updated to Shipped.",
    );
  });

  it("includes carrier and tracking on the status update when available", () => {
    expect(
      renderWhatsAppTemplate("status-update", {
        ...baseOrder,
        status: "SHIPPED",
        shippingCarrier: "Sundarban Courier",
        trackingNumber: "SC-12345",
      }),
    ).toBe(
      "Hello Ayesha Rahman, your order #ORD-2002 status has been updated to Shipped. It is with Sundarban Courier. Tracking number: SC-12345.",
    );
  });

  it("uses the order currency formatter for the outstanding balance", () => {
    const message = renderWhatsAppTemplate("payment-reminder", baseOrder);

    expect(message).toContain(formatCurrency(1000, "USD"));
    expect(message).toContain("#ORD-2002");
  });

  it("hides the payment reminder when nothing is outstanding", () => {
    const templates = getAvailableWhatsAppTemplates({
      ...baseOrder,
      amountPaid: "1250.00",
    });

    expect(templates.map((template) => template.id)).not.toContain(
      "payment-reminder",
    );
  });

  it("offers payment reminders for partially paid orders", () => {
    const templates = getAvailableWhatsAppTemplates(baseOrder);

    expect(templates.map((template) => template.id)).toContain(
      "payment-reminder",
    );
  });

  it("only offers the ready template once the order is being prepared", () => {
    const pendingIds = getAvailableWhatsAppTemplates(baseOrder).map(
      (template) => template.id,
    );
    expect(pendingIds).not.toContain("order-ready");

    const processingIds = getAvailableWhatsAppTemplates({
      ...baseOrder,
      status: "PROCESSING",
    }).map((template) => template.id);
    expect(processingIds).toContain("order-ready");
  });

  it("falls back to the status template for cancelled orders", () => {
    const cancelled = { ...baseOrder, status: "CANCELLED" as const };

    expect(getDefaultWhatsAppTemplateId(cancelled)).toBe("status-update");
    expect(
      getAvailableWhatsAppTemplates(cancelled).map((template) => template.id),
    ).toEqual(["status-update"]);
  });

  it("starts confirmed orders with the confirmation template", () => {
    expect(
      getDefaultWhatsAppTemplateId({ ...baseOrder, status: "CONFIRMED" }),
    ).toBe("order-confirmation");
  });

  it("starts later-stage orders with a status update", () => {
    expect(
      getDefaultWhatsAppTemplateId({ ...baseOrder, status: "PROCESSING" }),
    ).toBe("status-update");
    expect(
      getDefaultWhatsAppTemplateId({ ...baseOrder, status: "DELIVERED" }),
    ).toBe("status-update");
  });
});
