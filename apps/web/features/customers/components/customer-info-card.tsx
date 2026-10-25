import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { Customer } from "../api/customers-api";
import { formatDateTime, formatOptionalValue } from "../utils/customers.utils";

interface CustomerInfoCardProps {
  customer: Customer;
}

interface InfoRowProps {
  label: string;
  value: string;
  href?: string;
}

function InfoRow({ label, value, href }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-1 py-3.5 sm:grid sm:grid-cols-[150px_1fr] sm:items-baseline sm:gap-4">
      <dt className="text-muted-foreground text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
        {label}
      </dt>
      <dd className="text-foreground text-sm break-words">
        {href ? (
          <a
            href={href}
            className="focus-visible:ring-ring/40 rounded-sm transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  const hasAddress =
    customer.address !== null ||
    customer.city !== null ||
    customer.postalCode !== null;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Contact details</CardTitle>
        <CardDescription>
          Information captured for this customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-1">
        <dl className="divide-border-subtle divide-y">
          <InfoRow label="Name" value={customer.name} />
          <InfoRow
            label="Phone"
            value={customer.phone}
            href={`tel:${customer.phone}`}
          />
          <InfoRow
            label="Email"
            value={formatOptionalValue(customer.email)}
            href={customer.email ? `mailto:${customer.email}` : undefined}
          />
          {hasAddress ? (
            <>
              <InfoRow
                label="Address"
                value={formatOptionalValue(customer.address)}
              />
              <InfoRow label="City" value={formatOptionalValue(customer.city)} />
              <InfoRow
                label="Postal code"
                value={formatOptionalValue(customer.postalCode)}
              />
            </>
          ) : null}
          <InfoRow label="Notes" value={formatOptionalValue(customer.notes)} />
        </dl>
        <Separator className="my-1" />
        <div className="text-muted-foreground/80 flex flex-col gap-1 py-3 text-xs sm:flex-row sm:gap-6">
          <span>Created {formatDateTime(customer.createdAt)}</span>
          <span>Last updated {formatDateTime(customer.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
