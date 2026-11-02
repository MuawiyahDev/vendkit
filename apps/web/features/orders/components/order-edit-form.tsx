"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { CustomerFormDialog } from "@/features/customers/components/customer-form-dialog";
import type { Customer } from "@/features/customers/api/customers-api";
import { ApiError } from "@/lib/api/client";

import { updateOrder, type Order } from "../api/orders-api";
import {
  orderUpdateSchema,
  type OrderUpdateFormPayload,
  type OrderUpdateFormValues,
} from "../schemas/orders.schemas";
import { CustomerPickerDialog } from "./order-form/customer-picker-dialog";
import { OrderCustomerSection } from "./order-form/order-customer-section";
import { OrderFormActions } from "./order-form/order-form-actions";
import { OrderFormSection } from "./order-form/order-form-section";
import { OrderNotesSection } from "./order-form/order-notes-section";
import { OrderShippingSection } from "./order-form/order-shipping-section";

interface OrderEditFormProps {
  order: Order;
  onSaved: (order: Order) => void;
  onCancel: () => void;
}

/**
 * Editable order fields. The backend only allows the customer, shipping
 * details, and notes to change after creation — items and totals are
 * immutable, so they are shown read-only next to the form.
 */
export function OrderEditForm({ order, onSaved, onCancel }: OrderEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
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
    register, // eslint-disable-line @typescript-eslint/no-unused-vars
    handleSubmit,
    reset,

    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrderUpdateFormValues, unknown, OrderUpdateFormPayload>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: toDefaultValues(order),
  });

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
        shippingName: values.shippingName,
        shippingPhone: values.shippingPhone,
        shippingAddress: values.shippingAddress,
        shippingCity: values.shippingCity,
        shippingPostalCode: values.shippingPostalCode,
        customerNote: values.customerNote,
        internalNote: values.internalNote,
      });
      reset(toDefaultValues(saved));
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
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
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
            title="Shipping details"
            description="Update where this order should be delivered."
          >
            <OrderShippingSection

                            shippingNameError={errors.shippingName?.message}
              shippingPhoneError={errors.shippingPhone?.message}
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
    </form>
  );
}

function toDefaultValues(order: Order): OrderUpdateFormValues {
  return {
    customerId: order.customer?.id ?? "",
    shippingName: order.shippingName ?? "",
    shippingPhone: order.shippingPhone ?? "",
    shippingAddress: order.shippingAddress ?? "",
    shippingCity: order.shippingCity ?? "",
    shippingPostalCode: order.shippingPostalCode ?? "",
    customerNote: order.customerNote ?? "",
    internalNote: order.internalNote ?? "",
  };
}
