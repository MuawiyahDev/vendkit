"use client";

import { getSettingsCategoryMeta } from "../constants/settings-categories";
import type { SettingsCategory } from "../settings.types";
import { useSettingsData } from "./settings-provider";
import { BusinessProfileForm } from "./business-profile-form";
import { InvoiceSettingsForm } from "./invoice-settings-form";
import { NotificationSettingsForm } from "./notification-settings-form";
import { OrderSettingsForm } from "./order-settings-form";
import { PaymentSettingsForm } from "./payment-settings-form";
import { RegionalSettingsForm } from "./regional-settings-form";
import { ShippingSettingsForm } from "./shipping-settings-form";
import { TaxSettingsForm } from "./tax-settings-form";

interface SettingsCategoryViewProps {
  category: SettingsCategory;
}

/**
 * Category router for the settings content area. Data is already loaded and
 * shared by SettingsProvider, so this component only chooses the matching
 * form and wires the saved value back into the shared cache.
 */
export function SettingsCategoryView({ category }: SettingsCategoryViewProps) {
  const { data, canEdit, updateCategory } = useSettingsData();

  if (!data) {
    return null;
  }

  const meta = getSettingsCategoryMeta(category);
  const Icon = meta.icon;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="bg-primary-soft text-primary-soft-foreground mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg leading-tight font-semibold tracking-tight">
            {meta.title}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
            {meta.description}
          </p>
        </div>
      </div>

      {category === "business-profile" ? (
        <BusinessProfileForm
          settings={data.businessProfile}
          regional={data.regional}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("business-profile", settings)}
        />
      ) : null}

      {category === "invoice" ? (
        <InvoiceSettingsForm
          settings={data.invoice}
          businessProfile={data.businessProfile}
          regional={data.regional}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("invoice", settings)}
        />
      ) : null}

      {category === "regional" ? (
        <RegionalSettingsForm
          settings={data.regional}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("regional", settings)}
        />
      ) : null}

      {category === "tax" ? (
        <TaxSettingsForm
          settings={data.tax}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("tax", settings)}
        />
      ) : null}

      {category === "order" ? (
        <OrderSettingsForm
          settings={data.order}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("order", settings)}
        />
      ) : null}

      {category === "payment" ? (
        <PaymentSettingsForm
          settings={data.payment}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("payment", settings)}
        />
      ) : null}

      {category === "shipping" ? (
        <ShippingSettingsForm
          settings={data.shipping}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("shipping", settings)}
        />
      ) : null}

      {category === "notification" ? (
        <NotificationSettingsForm
          settings={data.notification}
          readOnly={!canEdit}
          onSaved={(settings) => updateCategory("notification", settings)}
        />
      ) : null}
    </div>
  );
}
