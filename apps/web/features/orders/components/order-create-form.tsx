"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/shared/native-select";
import { CustomerFormDialog } from "@/features/customers/components/customer-form-dialog";
import type { Customer } from "@/features/customers/api/customers-api";
import type { Product } from "@/features/products/api/products-api";
import { ApiError } from "@/lib/api/client";
import { formatAmount } from "@/lib/format";

import {
  createOrder,
  ORDER_SOURCES,
  type Order,
} from "../api/orders-api";
import {
  orderCreateSchema,
  type OrderCreateFormPayload,
  type OrderCreateFormValues,
} from "../schemas/orders.schemas";
import {
  formatOrderSource,
  roundToTwoDecimals,
} from "../utils/orders.utils";
import { CustomerPickerDialog } from "./order-form/customer-picker-dialog";
import { OrderChannelSection } from "./order-form/order-channel-section";
import { OrderChargesSection } from "./order-form/order-charges-section";
import {
  OrderCustomerSection,
} from "./order-form/order-customer-section";
import { OrderFormActions } from "./order-form/order-form-actions";
import { OrderFormSection } from "./order-form/order-form-section";
import { OrderItemsField } from "./order-form/order-items-field";
import { OrderNotesSection } from "./order-form/order-notes-section";
import {
  OrderShippingPhoneField,
  OrderShippingSection,
} from "./order-form/order-shipping-section";
import { OrderSummaryPanel } from "./order-form/order-summary-panel";
import { ProductPickerDialog } from "./order-form/product-picker-dialog";

interface OrderCreateFormProps {
  onCreated: (order: Order) => void;
  onCancel: () => void;
}

function toDefaultValues(): OrderCreateFormValues {
  return {
    customerId: "",
    source: "OTHER",
    items: [],
    discountAmount: "0",
    shippingFee: "0",
    taxAmount: "0",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCarrier: "",
    trackingNumber: "",
    customerNote: "",
    internalNote: "",
  };
}

export function OrderCreateForm({ onCreated, onCancel }: OrderCreateFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrderCreateFormValues, unknown, OrderCreateFormPayload>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: toDefaultValues(),
  });

  const itemsField = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discountAmount" });
  const watchedShipping = useWatch({ control, name: "shippingFee" });
  const watchedTax = useWatch({ control, name: "taxAmount" });

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

  /** Prefills empty shipping fields from the chosen customer. */
  function applyCustomerPrefill(customer: Customer) {
    if (!getValues("shippingName")) {
      setValue("shippingName", customer.name, { shouldDirty: true });
    }
    if (!getValues("shippingPhone")) {
      setValue("shippingPhone", customer.phone, { shouldDirty: true });
    }
    if (customer.address && !getValues("shippingAddress")) {
      setValue("shippingAddress", customer.address, { shouldDirty: true });
    }
    if (customer.city && !getValues("shippingCity")) {
      setValue("shippingCity", customer.city, { shouldDirty: true });
    }
    if (customer.postalCode && !getValues("shippingPostalCode")) {
      setValue("shippingPostalCode", customer.postalCode, {
        shouldDirty: true,
      });
    }
  }

  function handleCustomerSelect(customer: Customer) {
    setSelectedCustomer(customer);
    setValue("customerId", customer.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    applyCustomerPrefill(customer);
    setIsCustomerPickerOpen(false);
  }

  function handleProductAdd(product: Product) {
    setProductMap((current) => ({ ...current, [product.id]: product }));

    const existingIndex = itemsField.fields.findIndex(
      (field) => field.productId === product.id,
    );

    if (existingIndex >= 0) {
      const currentQuantity = getValues(`items.${existingIndex}.quantity`);
      const nextQuantity =
        (Number.isFinite(currentQuantity) ? currentQuantity : 0) + 1;
      setValue(`items.${existingIndex}.quantity`, nextQuantity, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      itemsField.append({ productId: product.id, quantity: 1 });
    }

    setIsProductPickerOpen(false);
  }

  /** Maps backend stock conflicts onto the matching item line. */
  function applyServerItemConflicts(
    error: ApiError,
    items: OrderCreateFormPayload["items"],
  ): boolean {
    const match = /^Insufficient stock for product "(.+)"$/.exec(error.message);
    if (!match) {
      return false;
    }

    const productName = match[1];
    const index = items.findIndex(
      (item) => productMap[item.productId]?.name === productName,
    );
    if (index < 0) {
      return false;
    }

    setError(`items.${index}.quantity`, {
      type: "server",
      message: `Insufficient stock for ${productName}`,
    });
    return true;
  }

  async function onSubmit(values: OrderCreateFormPayload) {
    setServerError(null);

    let valid = true;

    for (const [index, item] of values.items.entries()) {
      const product = productMap[item.productId];
      if (
        product?.trackInventory &&
        item.quantity > product.stockQuantity
      ) {
        setError(`items.${index}.quantity`, {
          type: "manual",
          message: `Only ${product.stockQuantity} units are in stock`,
        });
        valid = false;
      }
    }

    const subtotal = roundToTwoDecimals(
      values.items.reduce((sum, item) => {
        const product = productMap[item.productId];
        return product
          ? sum + Number(product.sellingPrice) * item.quantity
          : sum;
      }, 0),
    );

    if (values.discountAmount > subtotal) {
      setError("discountAmount", {
        type: "manual",
        message: "Discount cannot exceed the order subtotal",
      });
      valid = false;
    }

    if (!valid) {
      return;
    }

    try {
      const created = await createOrder({
        ...(values.customerId ? { customerId: values.customerId } : {}),
        source: values.source,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        discountAmount: values.discountAmount,
        shippingFee: values.shippingFee,
        taxAmount: values.taxAmount,
        shippingName: values.shippingName,
        shippingPhone: values.shippingPhone,
        shippingAddress: values.shippingAddress,
        shippingCity: values.shippingCity,
        shippingPostalCode: values.shippingPostalCode,
        shippingCarrier: values.shippingCarrier,
        trackingNumber: values.trackingNumber,
        customerNote: values.customerNote,
        internalNote: values.internalNote,
      });
      onCreated(created);
    } catch (error) {
      if (error instanceof ApiError) {
        if (applyServerItemConflicts(error, values.items)) {
          setServerError(error.message);
          return;
        }
        setServerError(error.message);
        return;
      }
      setServerError("Something went wrong. Please try again.");
    }
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

  const subtotalPreview = watchedItems.reduce((sum, item) => {
    const product = productMap[item.productId];
    if (!product) {
      return sum;
    }
    const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
    return sum + Number(product.sellingPrice) * quantity;
  }, 0);

  return (
    <form
      id="order-editor-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {serverError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="gap-0 overflow-hidden py-0">
            <OrderFormSection
              title="Customer"
              description="Choose who this order is for. Walk-in customers keep their details on the order only, or can be saved to your list."
            >
              <OrderCustomerSection
                selectedCustomer={selectedCustomer}
                customerIdError={errors.customerId?.message}
                                isSubmitting={isSubmitting}
                onChange={() => setIsCustomerPickerOpen(true)}
                onCreateNew={() => setIsCreateCustomerOpen(true)}
              />
            </OrderFormSection>

            <OrderFormSection
              title="Products"
              description="Add the products being sold. Prices are taken from the current selling price and stock is deducted when the order is created."
              action={
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(true)}
                  disabled={isSubmitting}
                  className="text-primary hover:text-primary/80 focus-visible:ring-ring/40 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
                >
                  Search products
                </button>
              }
            >
              <OrderItemsField
                fields={itemsField.fields}
                items={watchedItems}
                products={productMap}
                registerQuantity={(index) =>
                  register(`items.${index}.quantity`, { valueAsNumber: true })
                }
                quantityErrorFor={(index) =>
                  errors.items?.[index]?.quantity?.message
                }
                isSubmitting={isSubmitting}
                onRemove={(index) => itemsField.remove(index)}
                onAddProducts={() => setIsProductPickerOpen(true)}
              />
            </OrderFormSection>

            <OrderFormSection
              title="Charges"
              description="Optional order-level charges. Enter 0 to skip any of them."
            >
              <OrderChargesSection
                register={register}
                                errors={errors}
                subtotal={formatAmount(subtotalPreview)}
                isSubmitting={isSubmitting}
              />
            </OrderFormSection>

            <OrderFormSection
              title="Channel & delivery"
              description="Where this order came from, and how it is being sent if you use a courier."
            >
              <OrderChannelSection
                register={register}
                sourceField={
                  <Controller
                    control={control}
                    name="source"
                    render={({ field }) => (
                      <NativeSelect
                        id="order-source"
                        ariaLabel="Order channel"
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.value)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={isSubmitting}
                        options={ORDER_SOURCES.map((source) => ({
                          value: source,
                          label: formatOrderSource(source),
                        }))}
                      />
                    )}
                  />
                }
                shippingCarrierError={errors.shippingCarrier?.message}
                trackingNumberError={errors.trackingNumber?.message}
                isSubmitting={isSubmitting}
              />
            </OrderFormSection>

            <OrderFormSection
              title="Shipping details"
              description="Leave these empty to use the customer's saved details."
            >
              <OrderShippingSection
                register={register}
                phoneField={
                  <Controller
                    control={control}
                    name="shippingPhone"
                    render={({ field }) => (
                      <OrderShippingPhoneField
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.shippingPhone?.message}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                }
                shippingNameError={errors.shippingName?.message}
                shippingAddressError={errors.shippingAddress?.message}
                shippingCityError={errors.shippingCity?.message}
                shippingPostalCodeError={errors.shippingPostalCode?.message}
                isSubmitting={isSubmitting}
              />
            </OrderFormSection>


            <OrderFormSection
              title="Notes"
              description="Keep context with the order for the customer and your team."
            >
              <OrderNotesSection
                register={register}
                                customerNoteError={errors.customerNote?.message}
                internalNoteError={errors.internalNote?.message}
                isSubmitting={isSubmitting}
              />
            </OrderFormSection>
          </Card>

          <OrderFormActions
            mode="create"
            isSubmitting={isSubmitting}
            isDirty={isDirty}
            confirmDiscard={confirmDiscard}
            onCancel={requestCancel}
            onKeepEditing={() => setConfirmDiscard(false)}
            onDiscard={() => {
              setConfirmDiscard(false);
              onCancel();
            }}
          />
        </div>

        <OrderSummaryPanel
          items={watchedItems}
          products={productMap}
          discountAmount={watchedDiscount}
          shippingFee={watchedShipping}
          taxAmount={watchedTax}
        />
      </div>

      <CustomerPickerDialog
        open={isCustomerPickerOpen}
        onOpenChange={setIsCustomerPickerOpen}
        selectedCustomerId={selectedCustomer?.id ?? null}
        onSelect={handleCustomerSelect}
        onCreateNew={() => setIsCreateCustomerOpen(true)}
      />

      <CustomerFormDialog
        open={isCreateCustomerOpen}
        onOpenChange={setIsCreateCustomerOpen}
        onSuccess={(customer) => {
          setIsCreateCustomerOpen(false);
          handleCustomerSelect(customer);
        }}
      />

      <ProductPickerDialog
        open={isProductPickerOpen}
        onOpenChange={setIsProductPickerOpen}
        addedProductIds={itemsField.fields.map((field) => field.productId)}
        onAdd={handleProductAdd}
      />
    </form>
  );
}
