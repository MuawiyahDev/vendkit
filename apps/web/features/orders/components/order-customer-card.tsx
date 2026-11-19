import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { OrderBase } from "../api/orders-api";
import {
  formatOptionalValue,
  formatOrderSource,
  orderCustomerName,
  orderCustomerPhone,
} from "../utils/orders.utils";

interface OrderCustomerCardProps {
  order: OrderBase;
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5">
      <dt className="text-muted-foreground text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
        {label}
      </dt>
      <dd className="text-foreground text-sm break-words">
        {formatOptionalValue(value)}
      </dd>
    </div>
  );
}

/**
 * Customer contact details and the shipping destination snapshot stored on
 * the order (defaults to the customer's own details at creation time, or the
 * walk-in guest snapshot for guest orders).
 */
export function OrderCustomerCard({ order }: OrderCustomerCardProps) {
  const customer = order.customer ?? null;
  const displayName = orderCustomerName(order);
  const displayPhone = orderCustomerPhone(order);
  const hasCustomerLink = customer !== null;
  const hasShippingDetails =
    order.shippingName !== null ||
    order.shippingPhone !== null ||
    order.shippingAddress !== null ||
    order.shippingCity !== null ||
    order.shippingPostalCode !== null ||
    order.shippingCarrier !== null ||
    order.trackingNumber !== null;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Customer</CardTitle>
        <CardDescription>Who this order belongs to.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-3">
        <div className="flex items-center gap-3 py-2.5">
          <CustomerAvatar name={displayName} className="size-10" fallbackClassName="text-sm" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {hasCustomerLink ? (
              <Link
                href={`/customers/${customer.id}`}
                title={displayName}
                className="text-foreground hover:text-primary focus-visible:ring-ring/40 w-fit max-w-[220px] truncate rounded-sm text-sm font-medium transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                {displayName}
              </Link>
            ) : (
              <span
                title={displayName}
                className="text-foreground w-fit max-w-[220px] truncate rounded-sm text-sm font-medium"
              >
                {displayName}
                <span className="text-muted-foreground ml-1 text-xs font-normal">(walk-in)</span>
              </span>
            )}
            {displayPhone ? (
              <a
                href={`tel:${displayPhone}`}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex w-fit items-center gap-1.5 rounded-sm text-xs whitespace-nowrap tabular-nums transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                <Phone className="size-3" aria-hidden="true" />
                {displayPhone}
              </a>
            ) : null}
            {customer?.email ? (
              <a
                href={`mailto:${customer.email}`}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex w-fit items-center gap-1.5 rounded-sm text-xs transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                <Mail className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{customer.email}</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-border-subtle mt-2 border-t pt-2">
          <p className="text-muted-foreground py-2 text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
            Shipping to
          </p>
          <dl>
            {hasShippingDetails ? (
              <>
                <InfoRow label="Recipient" value={order.shippingName ?? order.customer?.name ?? null} />
                <InfoRow label="Phone" value={order.shippingPhone ?? order.customer?.phone ?? null} />
                <InfoRow label="Address" value={order.shippingAddress ?? null} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="City" value={order.shippingCity ?? null} />
                  <InfoRow label="Postal code" value={order.shippingPostalCode ?? null} />
                  <InfoRow label="Carrier" value={order.shippingCarrier ?? null} />
                  <InfoRow label="Tracking number" value={order.trackingNumber ?? null} />
                </div>
                <InfoRow label="Channel" value={formatOrderSource(order.source)} />
              </>
            ) : (
              <p className="text-muted-foreground py-2.5 text-sm">
                No shipping details were captured for this order.
              </p>
            )}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
