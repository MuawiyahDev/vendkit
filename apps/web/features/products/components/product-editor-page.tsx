"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertCircle, ArrowLeft, PackageX } from "lucide-react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { Product } from "../api/products-api";
import { useCatalogOptions } from "../hooks/use-catalog-options";
import { useProduct } from "../hooks/use-product";
import { ProductEditorForm } from "./product-editor-form";
import { ProductSummaryPanelSkeleton } from "./product-form/product-summary-panel";

interface ProductEditorPageProps {
  /** Existing product id for edit mode; omit to create a new product. */
  productId?: string;
}

function EditorLoadingSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading product"
    >
      <span className="sr-only">Loading product…</span>
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <div className="border-border-subtle rounded-xl border">
            <div className="flex flex-col gap-4 p-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="border-border-subtle flex flex-col gap-4 border-t p-6">
              <Skeleton className="h-4 w-40" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="border-border-subtle flex flex-col gap-4 border-t p-6">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <ProductSummaryPanelSkeleton />
      </div>
    </div>
  );
}

/**
 * Full-page product creator/editor. Owns the breadcrumb header, loading
 * and error states, and delegates the form itself to `ProductEditorForm`
 * so create and edit share one implementation.
 */
export function ProductEditorPage({ productId }: ProductEditorPageProps) {
  const router = useRouter();
  const mode: "create" | "edit" = productId ? "edit" : "create";
  const { view, product, refresh } = useProduct(productId ?? null);
  const { view: catalogView, refresh: refreshCatalog } = useCatalogOptions();

  function goToProducts() {
    router.push("/products");
  }

  function handleCreated(created: Product) {
    router.push(
      `/products?notice=${encodeURIComponent(`${created.name} was added.`)}`,
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Products", href: "/products" },
    { label: mode === "create" ? "Add product" : "Edit product" },
  ];

  const backButton = (
    <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
      <Link href="/products">
        <ArrowLeft aria-hidden="true" />
        Back to Products
      </Link>
    </Button>
  );

  if (productId && (view.status === "loading" || view.status === "idle")) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <PageHeader title="Edit product" actions={backButton} />
        </div>
        <EditorLoadingSkeleton />
      </div>
    );
  }

  if (productId && view.status === "error") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <PageHeader title="Edit product" actions={backButton} />
        </div>

        {view.notFound ? (
          <EmptyState
            icon={PackageX}
            title="Product not found"
            description="This product may have been deleted, or the link is incorrect."
          >
            <Button type="button" variant="outline" asChild>
              <Link href="/products">Back to Products</Link>
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

  const title = product ? product.name : "Add product";
  const description =
    mode === "create"
      ? "Add a product to your catalog with pricing, inventory, organization, and images."
      : "Update this product's details, pricing, inventory, and images.";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader
          title={title}
          description={description}
          actions={backButton}
        />
      </div>

      <ProductEditorForm
        key={productId ?? "new"}
        product={product}
        categories={catalogView.status === "success" ? catalogView.categories : []}
        brands={catalogView.status === "success" ? catalogView.brands : []}
        optionsLoading={catalogView.status === "loading"}
        optionsError={
          catalogView.status === "error" ? catalogView.message : null
        }
        onRetryOptions={refreshCatalog}
        onCreated={handleCreated}
        onCancel={goToProducts}
      />
    </div>
  );
}
