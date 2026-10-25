"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserX,
} from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { SuccessAlert } from "@/components/shared/success-alert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useCustomer } from "../hooks/use-customer";
import { CustomerAvatar } from "./customer-avatar";
import { CustomerDeleteDialog } from "./customer-delete-dialog";
import { CustomerFormDialog } from "./customer-form-dialog";
import { CustomerInfoCard } from "./customer-info-card";
import { CustomerOrderHistory } from "./customer-order-history";
import { CustomerStatusBadge } from "./customer-status-badge";

function CustomerDetailsSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading customer details"
    >
      <span className="sr-only">Loading customer details…</span>
      <div className="flex flex-col gap-6" aria-hidden="true">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex w-full flex-col gap-4 rounded-xl border p-6 lg:max-w-md lg:shrink-0">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
            ))}
          </div>
          <div className="flex w-full flex-col gap-3 rounded-xl border p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { view, customer, refresh } = useCustomer(id);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (view.status === "loading") {
    return <CustomerDetailsSkeleton />;
  }

  if (view.status === "error") {
    if (view.notFound) {
      return (
        <div className="flex flex-col gap-6">
          <BackLink />
          <EmptyState
            icon={UserX}
            title="Customer not found"
            description="This customer may have been deleted, or the link is incorrect."
          >
            <Button type="button" variant="outline" asChild>
              <Link href="/customers">Back to customers</Link>
            </Button>
          </EmptyState>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div className="flex flex-col items-center gap-4 py-8">
          <Alert variant="destructive" className="max-w-md text-left">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{view.message}</AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={refresh}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setFeedback(`Changes to ${customer.name} were saved.`);
    refresh();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteOpen(false);
    router.replace("/customers");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={() => setFeedback(null)} />
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <CustomerAvatar
            name={customer.name}
            className="size-12 sm:size-14"
            fallbackClassName="text-sm"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] break-words sm:text-[1.75rem]">
                {customer.name}
              </h1>
              <CustomerStatusBadge
                createdAt={customer.createdAt}
                className="px-2"
              />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <a
                href={`tel:${customer.phone}`}
                className="hover:text-foreground focus-visible:ring-ring/40 flex items-center gap-1.5 rounded-sm tabular-nums transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                {customer.phone}
              </a>
              {customer.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:text-foreground focus-visible:ring-ring/40 flex items-center gap-1.5 truncate rounded-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden"
                >
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{customer.email}</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive-outline"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:max-w-md lg:shrink-0">
          <CustomerInfoCard customer={customer} />
        </div>
        <div className="w-full min-w-0">
          <CustomerOrderHistory customerId={customer.id} />
        </div>
      </div>

      <CustomerFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        customer={customer}
        onSuccess={handleEditSuccess}
      />

      <CustomerDeleteDialog
        customer={customer}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/customers"
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to customers
    </Link>
  );
}
