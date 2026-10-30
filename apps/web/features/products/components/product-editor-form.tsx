"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useForm,
  useWatch,
  type UseFormSetError,
} from "react-hook-form";

import { SuccessAlert } from "@/components/shared/success-alert";
import type { SelectOption } from "@/components/shared/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { Brand } from "@/features/brands/api/brands-api";
import type { Category } from "@/features/categories/api/categories-api";
import type { PickedImage } from "@/features/images/api/images-api";
import { ApiError } from "@/lib/api/client";

import {
  createProduct,
  replaceProductImages,
  updateProduct,
  type Product,
} from "../api/products-api";
import {
  productFormSchema,
  type ProductFormPayload,
  type ProductFormValues,
} from "../schemas/products.schemas";
import {
  getProductImageIds,
  isSameImageOrder,
} from "../utils/products.utils";
import {
  toProductCreateInput,
  toProductFormValues,
  toProductUpdateInput,
} from "../utils/product-form.utils";
import { AdditionalDetailsSection } from "./product-form/additional-details-section";
import { BasicInformationSection } from "./product-form/basic-information-section";
import { InventorySection } from "./product-form/inventory-section";
import { OrganizationSection } from "./product-form/organization-section";
import { PricingSection } from "./product-form/pricing-section";
import { ProductFormActions } from "./product-form/product-form-actions";
import type { ProductFormApi } from "./product-form/product-form.types";
import { ProductImagesSection } from "./product-form/product-images-section";
import { ProductSummaryPanel } from "./product-form/product-summary-panel";

interface ProductEditorFormProps {
  /** Existing product to edit, or null when creating a new one. */
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  optionsLoading: boolean;
  optionsError: string | null;
  onRetryOptions: () => void;
  /** Called after a successful create with the backend's product. */
  onCreated: (product: Product) => void;
  /** Navigates away when the user cancels (after any discard confirm). */
  onCancel: () => void;
}

/**
 * Maps SKU/slug uniqueness conflicts from the API onto the matching form
 * fields so the error appears inline instead of only as a banner.
 */
function applyServerFieldConflicts(
  error: ApiError,
  setError: UseFormSetError<ProductFormValues>,
): void {
  if (error.status !== 409) {
    return;
  }

  if (/sku/i.test(error.message)) {
    setError("sku", { type: "server", message: error.message });
  }
  if (/slug/i.test(error.message)) {
    setError("slug", { type: "server", message: error.message });
  }
}

export function ProductEditorForm({
  product,
  categories,
  brands,
  optionsLoading,
  optionsError,
  onRetryOptions,
  onCreated,
  onCancel,
}: ProductEditorFormProps) {
  const mode: "create" | "edit" = product ? "edit" : "create";
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Ordered ids as stored by the backend when the form mounted; updated on
  // every successful save so image changes are compared against reality.
  const [originalImageIds, setOriginalImageIds] = useState<string[]>(() =>
    product ? getProductImageIds(product) : [],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues, unknown, ProductFormPayload>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toProductFormValues(product),
  });

  const selectedImages: PickedImage[] = useWatch({ control, name: "images" }) ?? [];

  // Warn before closing the tab or navigating away with unsaved changes.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Ensure the product's current category/brand stay selectable even when
  // they fall outside the loaded option window (e.g. >100 records).
  const categoryOptions: SelectOption[] = useMemo(() => {
    const options = categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
    const currentCategory = product?.category;
    if (
      currentCategory &&
      !categories.some((category) => category.id === currentCategory.id)
    ) {
      options.unshift({
        value: currentCategory.id,
        label: currentCategory.name,
      });
    }
    return options;
  }, [categories, product]);

  const brandOptions: SelectOption[] = useMemo(() => {
    const options = brands.map((brand) => ({
      value: brand.id,
      label: brand.name,
    }));
    const currentBrand = product?.brand;
    if (currentBrand && !brands.some((brand) => brand.id === currentBrand.id)) {
      options.unshift({ value: currentBrand.id, label: currentBrand.name });
    }
    return options;
  }, [brands, product]);

  function handleFormError(error: unknown) {
    if (error instanceof ApiError) {
      applyServerFieldConflicts(error, setError);
      setServerError(error.message);
      return;
    }
    setServerError("Something went wrong. Please try again.");
  }

  async function onSubmit(values: ProductFormPayload) {
    setServerError(null);
    setSuccessMessage(null);

    if (!product) {
      try {
        const created = await createProduct(toProductCreateInput(values));
        onCreated(created);
      } catch (error) {
        handleFormError(error);
      }
      return;
    }

    let saved: Product;
    try {
      saved = await updateProduct(product.id, toProductUpdateInput(values));
    } catch (error) {
      handleFormError(error);
      return;
    }

    const nextIds = values.images.map((image) => image.id);
    if (!isSameImageOrder(originalImageIds, nextIds)) {
      try {
        saved = await replaceProductImages(product.id, nextIds);
      } catch (error) {
        setServerError(
          error instanceof ApiError
            ? `Product details were saved, but images could not be updated: ${error.message}`
            : "Product details were saved, but images could not be updated. Please try again.",
        );
        return;
      }
    }

    setOriginalImageIds(nextIds);
    reset(toProductFormValues(saved));
    setSuccessMessage(`Changes to ${saved.name} were saved.`);
  }

  function requestCancel() {
    if (isSubmitting) {
      return;
    }
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    onCancel();
  }

  const formApi: ProductFormApi = {
    mode,
    control,
    register,
    errors,
    isSubmitting,
  };

  const submitDisabled = isSubmitting || optionsLoading || optionsError !== null;

  return (
    <form
      id="product-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {successMessage ? (
        <SuccessAlert
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      {serverError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="gap-0 overflow-hidden py-0">
            <BasicInformationSection form={formApi} />
            <OrganizationSection
              form={formApi}
              categoryOptions={categoryOptions}
              brandOptions={brandOptions}
              optionsLoading={optionsLoading}
              optionsError={optionsError}
              onRetryOptions={onRetryOptions}
            />
            <PricingSection form={formApi} />
            <InventorySection form={formApi} />
            <ProductImagesSection
              form={formApi}
              images={selectedImages}
              onChange={(nextImages) =>
                setValue("images", nextImages, { shouldDirty: true })
              }
            />
            <AdditionalDetailsSection form={formApi} />
          </Card>

          <ProductFormActions
            mode={mode}
            isSubmitting={isSubmitting}
            isDirty={isDirty}
            confirmDiscard={confirmDiscard}
            submitDisabled={submitDisabled}
            onCancel={requestCancel}
            onKeepEditing={() => setConfirmDiscard(false)}
            onDiscard={() => {
              setConfirmDiscard(false);
              onCancel();
            }}
          />
        </div>

        <ProductSummaryPanel
          form={formApi}
          images={selectedImages}
          categories={categories}
          brands={brands}
        />
      </div>
    </form>
  );
}
