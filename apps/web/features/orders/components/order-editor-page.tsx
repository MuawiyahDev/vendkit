"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Ban, ReceiptText } from "lucide-react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useOrder } from "../hooks/use-order";
import type { Order } from "../api/orders-api";
import { OrderCreateForm } from "./order-create-form";
import { OrderEditForm } from "./order-edit-form";
import { OrderItemsCard } from "./order-items-card";
import { OrderSummaryCard } from "./order-summary-card";

interface OrderEditorPageProps {
  /** Existing order id for edit mode; omit to create a new order. */
  orderId?: string;
}

function EditorLoadingSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading order"
    >
      <span className="sr-only">Loading order…</span>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl border p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Full-page order creator/editor. Create mode composes the creation form;
 * edit mode loads the order and limits edits to the fields the backend
 * still allows to change.
 */
export function OrderEditorPage({ orderId }: OrderEditorPageProps) {
  const router = useRouter();
  const mode: "create" | "edit" = orderId ? "edit" : "create";
  const { view, order, refresh } = useOrder(orderId ?? null);

  function goToOrders() {
    router.push("/orders");
  }

  function handleCreated(created: Order) {
    router.push(
      `/orders/${created.id}?notice=${encodeURIComponent(
        `Order ${created.orderNumber} was created.`,
      )}`,
    );
    router.refresh();
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Orders", href: "/orders" },
    { label: mode === "create" ? "Create order" : `Edit ${order?.orderNumber ?? "order"}` },
  ];

  const backButton = (
    <Button
      type="button"
      variant="outline"
      asChild
      className="w-full sm:w-auto"
    >
      <Link href="/orders">
        <ArrowLeft aria-hidden="true" />
        Back to Orders
      </Link>
    </Button>
  );

  if (mode === "create") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <PageHeader
            title="Create order"
            description="Pick the customer and products, add charges or notes, and place the order. Stock is deducted as soon as it is created."
            actions={backButton}
          />
        </div>

        <OrderCreateForm onCreated={handleCreated} onCancel={goToOrders} />
      </div>
    );
  }

  if (view.status === "loading" || !orderId) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <PageHeader title="Edit order" actions={backButton} />
        </div>
        <EditorLoadingSkeleton />
      </div>
    );
  }

  if (view.status === "error") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <PageHeader title="Edit order" actions={backButton} />
        </div>

        {view.notFound ? (
          <EmptyState
            icon={ReceiptText}
            title="Order not found"
            description="This order may have been deleted, or the link is incorrect."
          >
            <Button type="button" variant="outline" asChild>
              <Link href="/orders">Back to Orders</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <Alert variant="destructive" className="max-w-md text-left">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{view.message}</AlertDescription>
            </Alert>
            <Button type="button" variant="outline" onClick={refresh}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!order) {
    return null;
  }

  if (order.status === "CANCELLED") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <PageHeader
            title={`Edit ${order.orderNumber}`}
            actions={backButton}
          />
        </div>
        <EmptyState
          icon={Ban}
          title="Cancelled orders cannot be edited"
          description="This order was cancelled, so its details are locked. Create a new order if the customer wants to buy again."
        >
          <Button type="button" variant="outline" asChild>
            <Link href={`/orders/${order.id}`}>View order details</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader
          title={`Edit ${order.orderNumber}`}
          description="Update products, quantities, customer, shipping details, or notes. Stock changes are recorded automatically."
          actions={backButton}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <OrderEditForm
          key={order.id}
          order={order}
          onSaved={() => refresh()}
          onCancel={goToOrders}
        />

        <div className="flex w-full flex-col gap-6">
          <OrderSummaryCard order={order} />
          <OrderItemsCard items={order.items} currency={order.currency} />
        </div>
      </div>
    </div>
  );
}
