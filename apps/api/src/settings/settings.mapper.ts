import { IMAGE_API_ROUTE } from './settings.constants.js';
import type {
  AllSettingsResponse,
  BusinessProfileResponse,
  BusinessProfileRow,
  EffectiveInvoiceBusinessInformation,
  InvoiceSettingsResponse,
  InvoiceSettingsRow,
  LogoResponse,
  NotificationSettingsResponse,
  NotificationSettingsRow,
  OrderSettingsResponse,
  OrderSettingsRow,
  PaymentSettingsResponse,
  PaymentSettingsRow,
  RegionalSettingsResponse,
  RegionalSettingsRow,
  ShippingSettingsResponse,
  ShippingSettingsRow,
  TaxSettingsResponse,
  TaxSettingsRow,
} from './settings.types.js';

export function toLogoResponse(
  logo: { id: string } | null,
): LogoResponse | null {
  if (!logo) {
    return null;
  }

  return {
    id: logo.id,
    url: `${IMAGE_API_ROUTE}/${logo.id}/file`,
  };
}

export function toBusinessProfileResponse(
  row: BusinessProfileRow,
): BusinessProfileResponse {
  return {
    businessName: row.businessName,
    legalName: row.legalName,
    logo: toLogoResponse(row.logo),
    email: row.email,
    phone: row.phone,
    alternativePhone: row.alternativePhone,
    website: row.website,
    description: row.description,
    registrationNumber: row.registrationNumber,
    taxIdentificationNumber: row.taxIdentificationNumber,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toInvoiceSettingsResponse(
  row: InvoiceSettingsRow,
  businessProfile: BusinessProfileRow,
): InvoiceSettingsResponse {
  return {
    useBusinessProfile: row.useBusinessProfile,
    displayName: row.displayName,
    logo: toLogoResponse(row.logo),
    email: row.email,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    taxRegistrationNumber: row.taxRegistrationNumber,
    additionalInfo: row.additionalInfo,
    numberPrefix: row.numberPrefix,
    numberFormat: row.numberFormat,
    yearBasedNumbering: row.yearBasedNumbering,
    automaticNumbering: row.automaticNumbering,
    startingSequence: row.startingSequence,
    duePeriodDays: row.duePeriodDays,
    paymentTerms: row.paymentTerms,
    notes: row.notes,
    footerText: row.footerText,
    currencyDisplayFormat: row.currencyDisplayFormat,
    showSku: row.showSku,
    showTaxBreakdown: row.showTaxBreakdown,
    showDiscountBreakdown: row.showDiscountBreakdown,
    defaultStatus: row.defaultStatus,
    allowEditingAfterIssue: row.allowEditingAfterIssue,
    allowCancellation: row.allowCancellation,
    effectiveBusinessInformation: toEffectiveInvoiceBusinessInformation(
      row,
      businessProfile,
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toEffectiveInvoiceBusinessInformation(
  row: InvoiceSettingsRow,
  businessProfile: BusinessProfileRow,
): EffectiveInvoiceBusinessInformation {
  const fallback = row.useBusinessProfile;
  const pick = <T>(invoiceValue: T | null, businessValue: T | null): T | null =>
    fallback ? (invoiceValue ?? businessValue) : invoiceValue;

  return {
    displayName: row.displayName ?? businessProfile.businessName,
    logo:
      toLogoResponse(row.logo) ??
      (fallback ? toLogoResponse(businessProfile.logo) : null),
    email: pick(row.email, businessProfile.email),
    phone: pick(row.phone, businessProfile.phone),
    addressLine1: pick(row.addressLine1, businessProfile.addressLine1),
    addressLine2: pick(row.addressLine2, businessProfile.addressLine2),
    city: pick(row.city, businessProfile.city),
    state: pick(row.state, businessProfile.state),
    postalCode: pick(row.postalCode, businessProfile.postalCode),
    country: pick(row.country, businessProfile.country),
    taxRegistrationNumber: pick(
      row.taxRegistrationNumber,
      businessProfile.taxIdentificationNumber,
    ),
    additionalInfo: pick(row.additionalInfo, businessProfile.description),
  };
}

export function toRegionalSettingsResponse(
  row: RegionalSettingsRow,
): RegionalSettingsResponse {
  return {
    currency: row.currency,
    currencySymbol: row.currencySymbol,
    currencyPosition: row.currencyPosition,
    decimalPrecision: row.decimalPrecision,
    thousandSeparator: row.thousandSeparator,
    decimalSeparator: row.decimalSeparator,
    defaultCountry: row.defaultCountry,
    timezone: row.timezone,
    dateFormat: row.dateFormat,
    timeFormat: row.timeFormat,
    language: row.language,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toTaxSettingsResponse(row: TaxSettingsRow): TaxSettingsResponse {
  return {
    enabled: row.enabled,
    defaultName: row.defaultName,
    defaultRate: row.defaultRate.toString(),
    taxIdentificationNumber: row.taxIdentificationNumber,
    pricingMode: row.pricingMode,
    showBreakdownOnInvoice: row.showBreakdownOnInvoice,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toOrderSettingsResponse(
  row: OrderSettingsRow,
): OrderSettingsResponse {
  return {
    orderNumberPrefix: row.orderNumberPrefix,
    automaticNumbering: row.automaticNumbering,
    defaultStatus: row.defaultStatus,
    defaultNotes: row.defaultNotes,
    allowEditing: row.allowEditing,
    requireCustomerInformation: row.requireCustomerInformation,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPaymentSettingsResponse(
  row: PaymentSettingsRow,
): PaymentSettingsResponse {
  return {
    enabledMethods: row.enabledMethods,
    defaultMethod: row.defaultMethod,
    cashEnabled: row.enabledMethods.includes('CASH'),
    bankTransferEnabled: row.enabledMethods.includes('BANK_TRANSFER'),
    bankAccountName: row.bankAccountName,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    branchName: row.branchName,
    routingNumber: row.routingNumber,
    paymentInstructions: row.paymentInstructions,
    defaultPaymentTerms: row.defaultPaymentTerms,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toShippingSettingsResponse(
  row: ShippingSettingsRow,
): ShippingSettingsResponse {
  return {
    enabled: row.enabled,
    defaultCharge: row.defaultCharge.toString(),
    freeShippingThreshold: row.freeShippingThreshold?.toString() ?? null,
    deliveryInstructions: row.deliveryInstructions,
    defaultDeliveryMethod: row.defaultDeliveryMethod,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toNotificationSettingsResponse(
  row: NotificationSettingsRow,
): NotificationSettingsResponse {
  return {
    businessNotificationEmail: row.businessNotificationEmail,
    orderConfirmationEnabled: row.orderConfirmationEnabled,
    paymentEnabled: row.paymentEnabled,
    invoiceEnabled: row.invoiceEnabled,
    senderName: row.senderName,
    replyToEmail: row.replyToEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAllSettingsResponse(input: {
  businessProfile: BusinessProfileRow;
  invoice: InvoiceSettingsRow;
  regional: RegionalSettingsRow;
  tax: TaxSettingsRow;
  order: OrderSettingsRow;
  payment: PaymentSettingsRow;
  shipping: ShippingSettingsRow;
  notification: NotificationSettingsRow;
}): AllSettingsResponse {
  return {
    businessProfile: toBusinessProfileResponse(input.businessProfile),
    invoice: toInvoiceSettingsResponse(input.invoice, input.businessProfile),
    regional: toRegionalSettingsResponse(input.regional),
    tax: toTaxSettingsResponse(input.tax),
    order: toOrderSettingsResponse(input.order),
    payment: toPaymentSettingsResponse(input.payment),
    shipping: toShippingSettingsResponse(input.shipping),
    notification: toNotificationSettingsResponse(input.notification),
  };
}
