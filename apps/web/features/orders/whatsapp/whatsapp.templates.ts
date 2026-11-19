import type { OrderStatus } from "../api/orders-api";
import {
  formatCurrency,
  formatStatusLabel,
  outstandingBalance,
} from "../utils/orders.utils";
import type {
  WhatsAppOrder,
  WhatsAppTemplate,
  WhatsAppTemplateId,
} from "./whatsapp.types";
import { getOrderGreetingName } from "./whatsapp.utils";

const TEMPLATE_DEFINITIONS: readonly WhatsAppTemplate[] = [
  {
    id: "order-confirmation",
    label: "Order confirmation",
    description: "Confirm that the order was received.",
  },
  {
    id: "status-update",
    label: "Status update",
    description: "Share the order's current status.",
  },
  {
    id: "payment-reminder",
    label: "Payment reminder",
    description: "Mention the remaining balance.",
  },
  {
    id: "order-ready",
    label: "Order ready",
    description: "Let the customer know it is ready.",
  },
];

const READY_STATUSES: readonly OrderStatus[] = ["PROCESSING", "SHIPPED"];

function isTemplateAvailable(
  template: WhatsAppTemplate,
  order: WhatsAppOrder,
): boolean {
  switch (template.id) {
    case "order-confirmation":
      return order.status !== "CANCELLED";
    case "payment-reminder":
      return order.status !== "CANCELLED" && outstandingBalance(order) > 0;
    case "order-ready":
      return READY_STATUSES.includes(order.status);
    case "status-update":
      return true;
  }
}

/** Templates whose required order data is actually present. */
export function getAvailableWhatsAppTemplates(
  order: WhatsAppOrder,
): WhatsAppTemplate[] {
  return TEMPLATE_DEFINITIONS.filter((template) =>
    isTemplateAvailable(template, order),
  );
}

/**
 * Renders a template from real order values only. Amounts use the order's
 * currency and the dashboard's existing currency formatting.
 */
export function renderWhatsAppTemplate(
  templateId: WhatsAppTemplateId,
  order: WhatsAppOrder,
): string {
  const name = getOrderGreetingName(order);
  const orderNumber = order.orderNumber;

  switch (templateId) {
    case "order-confirmation":
      return `Hello ${name}, thank you for your order #${orderNumber}. Your order has been received successfully.`;
    case "status-update": {
      const tracking = order.trackingNumber?.trim();

      if (tracking) {
        const carrier = order.shippingCarrier?.trim();
        return `Hello ${name}, your order #${orderNumber} status has been updated to ${formatStatusLabel(order.status)}.${carrier ? ` It is with ${carrier}.` : ""} Tracking number: ${tracking}.`;
      }

      return `Hello ${name}, your order #${orderNumber} status has been updated to ${formatStatusLabel(order.status)}.`;
    }
    case "payment-reminder":
      return `Hello ${name}, this is a reminder regarding payment for your order #${orderNumber}. The outstanding amount is ${formatCurrency(outstandingBalance(order), order.currency)}.`;
    case "order-ready":
      return `Hello ${name}, your order #${orderNumber} is ready. Thank you for shopping with us!`;
  }
}

/**
 * New orders start with a confirmation; every later stage starts with an
 * accurate status update. The seller can still pick any other available
 * template.
 */
export function getDefaultWhatsAppTemplateId(
  order: WhatsAppOrder,
): WhatsAppTemplateId {
  if (order.status === "PENDING" || order.status === "CONFIRMED") {
    return "order-confirmation";
  }
  return "status-update";
}
