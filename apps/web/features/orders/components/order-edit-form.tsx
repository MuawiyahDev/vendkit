"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/shared/native-select";
import { CustomerFormDialog } from "@/features/customers/components/customer-form-dialog";
import type { Customer } from "@/features/customers/api/customers-api";
import type { Product } from "@/features/products/api/products-api";
import { ApiError } from "@/lib/api/client";

import {
  ORDER_SOURCES,
  updateOrder,
  type Order,
} from "../api/orders-api";
import { useOrderProducts } from "../hooks/use-order-products";
import {
  orderUpdateSchema,
  type OrderUpdateFormPayload,
  type OrderUpdateFormValues,
} from "../schemas/orders.schemas";
import { formatOrderSource } from "../utils/orders.utils";
import { CustomerPickerDialog } from "./order-form/customer-picker-dialog";
import { OrderChannelSection } from "./order-form/order-channel-section";
import { OrderCustomerSection } from "./order-form/order-customer-section";
import { OrderFormActions } from "./order-form/order-form-actions";
import { OrderFormSection } from "./order-form/order-form-section";
import { OrderItemsField } from "./order-form/order-items-field";
import { OrderNotesSection } from "./order-form/order-notes-section";
import {
  OrderShippingPhoneField,
  OrderShippingSection,
} from "./order-form/order-shipping-section";
import { ProductPickerDialog } from "./order-form/product-picker-dialog";

interface OrderEditFormProps {
  order: Order;
  onSaved: (order: Order) => void;
  onCancel: () => void;
}

/**
 * Editable order fields. Quantities can be changed while the order is open;
 * the backend applies only the stock delta and keeps captured unit prices for
 * existing lines. Customer, shipping, and notes remain editable as before.
 */
export function OrderEditForm({ order, onSaved, onCancel }: OrderEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [extraProducts, setExtraProducts] = useState<Record<string, Product>>(
    {},
  );
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  const { view: productsView, refresh: refreshProducts } = useOrderProducts(
    order.items.map((item) => item.productId),
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    () =>
      order.customer ? {
        id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
            address: null,
            city: null,
            postalCode: null,
            notes: null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          }
        : null,
  );
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrderUpdateFormValues, unknown, OrderUpdateFormPayload>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: toDefaultValues(order),
  });

  const itemsField = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];

  const products = useMemo<Record<string, Product>>(
    () => ({
      ...(productsView.status === "success" ? productsView.products : {}),
      ...extraProducts,
    }),
    [productsView, extraProducts],
  );

  const snapshots = useMemo(
    () =>
      Object.fromEntries(
        order.items.map((item) => [
          item.productId,
          {
            productName: item.productName,
            sku: item.sku,
            unitPrice: item.unitPrice,
          },
        ]),
      ),
    [order.items],
  );

  function handleProductAdd(product: Product) {
    setExtraProducts((current) => ({ ...current, [product.id]: product }));

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

  function handleCustomerSelect(customer: Customer) {
    setSelectedCustomer(customer);
    setValue("customerId", customer.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setIsCustomerPickerOpen(false);
  }

  async function onSubmit(values: OrderUpdateFormPayload) {
    setServerError(null);
    setSuccessMessage(null);

    const customerPayload = values.customerId
      ? { customerId: values.customerId }
      : {};

    try {
      const saved = await updateOrder(order.id, {
        ...customerPayload,
        source: values.source,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
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
      reset(toDefaultValues(saved));
      refreshProducts();
      if (saved.customer) {
        setSelectedCustomer({
          id: saved.customer.id,
          name: saved.customer.name,
          phone: saved.customer.phone,
          email: saved.customer.email,
          address: null,
          city: null,
          postalCode: null,
          notes: null,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
        });
      }
      setSuccessMessage(`Changes to ${saved.orderNumber} were saved.`);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) {
        const match = /^Insufficient stock for product "(.+)"$/.exec(
          error.message,
        );
        if (match) {
          const index = values.items.findIndex(
            (item) => products[item.productId]?.name === match[1],
          );
          if (index >= 0) {
            setError(`items.${index}.quantity`, {
              type: "server",
              message: `Insufficient stock for ${match[1]}`,
            });
          }
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

  return (
    <form
      id="order-editor-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {successMessage ? (
        <Alert
          role="status"
          className="border-success/25 bg-success-soft text-success-soft-foreground [&>svg]:text-success-soft-foreground py-3"
        >
          <CheckCircle2 aria-hidden="true" />
          <AlertDescription className="font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      {serverError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex min-w-0 flex-col gap-6">
        <Card className="gap-0 overflow-hidden py-0">
          <OrderFormSection
            title="Customer"
            description="Reassign this order to a different customer if needed."
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
            description="Update quantities or add products. Only the changed stock is applied."
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
            {productsView.status === "error" ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>
                  Product stock could not be loaded: {productsView.message}
                </AlertDescription>
              </Alert>
            ) : null}
            <OrderItemsField
              fields={itemsField.fields}
              items={watchedItems}
              products={products}
              snapshots={snapshots}
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
            title="Channel & delivery"
            description="Update where this order came from and how it is being sent."
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
                      onChange={(event) => field.onChange(event.target.value)}
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
            description="Update where this order should be delivered."
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
          mode="edit"
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

function toDefaultValues(order: Order): OrderUpdateFormValues {
  return {
    customerId: order.customer?.id ?? "",
    source: order.source,
    items: order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    shippingName: order.shippingName ?? "",
    shippingPhone: order.shippingPhone ?? "",
    shippingAddress: order.shippingAddress ?? "",
    shippingCity: order.shippingCity ?? "",
    shippingPostalCode: order.shippingPostalCode ?? "",
    shippingCarrier: order.shippingCarrier ?? "",
    trackingNumber: order.trackingNumber ?? "",
    customerNote: order.customerNote ?? "",
    internalNote: order.internalNote ?? "",
  };
}
