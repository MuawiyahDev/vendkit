import { renderToBuffer } from "@react-pdf/renderer";

import type { Order } from "@/features/orders/api/orders-api";

import { getInvoiceBusinessProfile } from "./invoice-business";
import { InvoiceDocument } from "./invoice-document";

/**
 * Renders the invoice PDF for an order. Kept separate from the route handler
 * so JSX stays in a `.tsx` module and the HTTP layer remains thin.
 */
export async function renderOrderInvoicePdf(order: Order): Promise<Buffer> {
  return renderToBuffer(
    <InvoiceDocument
      order={order}
      business={getInvoiceBusinessProfile()}
      generatedAt={new Date()}
    />,
  );
}
