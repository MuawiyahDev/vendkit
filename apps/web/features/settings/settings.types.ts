export const SETTINGS_CATEGORIES = [
  "business-profile",
  "invoice",
  "regional",
  "tax",
  "order",
  "payment",
  "shipping",
  "notification",
] as const;

export type SettingsCategory = (typeof SETTINGS_CATEGORIES)[number];

export function isSettingsCategory(value: string): value is SettingsCategory {
  return (SETTINGS_CATEGORIES as readonly string[]).includes(value);
}

export type CurrencyPosition = "BEFORE" | "AFTER";
export type CurrencyDisplayFormat = "SYMBOL" | "CODE" | "SYMBOL_AND_CODE";
export type TaxPricingMode = "INCLUSIVE" | "EXCLUSIVE";
export type InvoiceDefaultStatus = "DRAFT" | "ISSUED";
export type OrderStatus = "PENDING" | "CONFIRMED";
export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "MOBILE_FINANCIAL_SERVICE"
  | "CARD"
  | "OTHER";

export interface SettingsLogo {
  id: string;
  url: string;
}

export interface BusinessProfileSettings {
  businessName: string;
  legalName: string | null;
  logo: SettingsLogo | null;
  email: string | null;
  phone: string | null;
  alternativePhone: string | null;
  website: string | null;
  description: string | null;
  registrationNumber: string | null;
  taxIdentificationNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveInvoiceBusinessInformation {
  displayName: string;
  logo: SettingsLogo | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  taxRegistrationNumber: string | null;
  additionalInfo: string | null;
}

export interface InvoiceSettings {
  useBusinessProfile: boolean;
  displayName: string | null;
  logo: SettingsLogo | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  taxRegistrationNumber: string | null;
  additionalInfo: string | null;
  numberPrefix: string;
  numberFormat: string;
  yearBasedNumbering: boolean;
  automaticNumbering: boolean;
  startingSequence: number;
  duePeriodDays: number;
  paymentTerms: string | null;
  notes: string | null;
  footerText: string | null;
  currencyDisplayFormat: CurrencyDisplayFormat;
  showSku: boolean;
  showTaxBreakdown: boolean;
  showDiscountBreakdown: boolean;
  defaultStatus: InvoiceDefaultStatus;
  allowEditingAfterIssue: boolean;
  allowCancellation: boolean;
  effectiveBusinessInformation: EffectiveInvoiceBusinessInformation;
  createdAt: string;
  updatedAt: string;
}

export interface RegionalSettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: CurrencyPosition;
  decimalPrecision: number;
  thousandSeparator: string;
  decimalSeparator: string;
  defaultCountry: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxSettings {
  enabled: boolean;
  defaultName: string;
  defaultRate: string;
  taxIdentificationNumber: string | null;
  pricingMode: TaxPricingMode;
  showBreakdownOnInvoice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSettings {
  orderNumberPrefix: string;
  automaticNumbering: boolean;
  defaultStatus: OrderStatus;
  defaultNotes: string | null;
  allowEditing: boolean;
  requireCustomerInformation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSettings {
  enabledMethods: PaymentMethod[];
  defaultMethod: PaymentMethod;
  cashEnabled: boolean;
  bankTransferEnabled: boolean;
  bankAccountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  branchName: string | null;
  routingNumber: string | null;
  paymentInstructions: string | null;
  defaultPaymentTerms: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingSettings {
  enabled: boolean;
  defaultCharge: string;
  freeShippingThreshold: string | null;
  deliveryInstructions: string | null;
  defaultDeliveryMethod: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  businessNotificationEmail: string | null;
  orderConfirmationEnabled: boolean;
  paymentEnabled: boolean;
  invoiceEnabled: boolean;
  senderName: string;
  replyToEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AllSettings {
  businessProfile: BusinessProfileSettings;
  invoice: InvoiceSettings;
  regional: RegionalSettings;
  tax: TaxSettings;
  order: OrderSettings;
  payment: PaymentSettings;
  shipping: ShippingSettings;
  notification: NotificationSettings;
}

export interface SettingsResponseMap {
  "business-profile": BusinessProfileSettings;
  invoice: InvoiceSettings;
  regional: RegionalSettings;
  tax: TaxSettings;
  order: OrderSettings;
  payment: PaymentSettings;
  shipping: ShippingSettings;
  notification: NotificationSettings;
}

export const SETTINGS_DATA_KEY = {
  "business-profile": "businessProfile",
  invoice: "invoice",
  regional: "regional",
  tax: "tax",
  order: "order",
  payment: "payment",
  shipping: "shipping",
  notification: "notification",
} as const satisfies Record<SettingsCategory, keyof AllSettings>;

export interface BusinessProfileUpdateInput {
  businessName: string;
  legalName: string | null;
  logoImageId: string | null;
  email: string | null;
  phone: string | null;
  alternativePhone: string | null;
  website: string | null;
  description: string | null;
  registrationNumber: string | null;
  taxIdentificationNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface InvoiceUpdateInput {
  useBusinessProfile: boolean;
  displayName?: string | null;
  logoImageId?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  taxRegistrationNumber?: string | null;
  additionalInfo?: string | null;
  numberPrefix: string;
  numberFormat: string;
  yearBasedNumbering: boolean;
  automaticNumbering: boolean;
  startingSequence: number;
  duePeriodDays: number;
  paymentTerms: string | null;
  notes: string | null;
  footerText: string | null;
  currencyDisplayFormat: CurrencyDisplayFormat;
  showSku: boolean;
  showTaxBreakdown: boolean;
  showDiscountBreakdown: boolean;
  defaultStatus: InvoiceDefaultStatus;
  allowEditingAfterIssue: boolean;
  allowCancellation: boolean;
}

export interface RegionalUpdateInput {
  currency: string;
  currencySymbol: string;
  currencyPosition: CurrencyPosition;
  decimalPrecision: number;
  thousandSeparator: string;
  decimalSeparator: string;
  defaultCountry: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
}

export interface TaxUpdateInput {
  enabled: boolean;
  defaultName: string;
  defaultRate: number;
  taxIdentificationNumber: string | null;
  pricingMode: TaxPricingMode;
  showBreakdownOnInvoice: boolean;
}

export interface OrderUpdateInput {
  orderNumberPrefix: string;
  automaticNumbering: boolean;
  defaultStatus: OrderStatus;
  defaultNotes: string | null;
  allowEditing: boolean;
  requireCustomerInformation: boolean;
}

export interface PaymentUpdateInput {
  enabledMethods: PaymentMethod[];
  defaultMethod: PaymentMethod;
  bankAccountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  branchName: string | null;
  routingNumber: string | null;
  paymentInstructions: string | null;
  defaultPaymentTerms: string | null;
}

export interface ShippingUpdateInput {
  enabled: boolean;
  defaultCharge: number;
  freeShippingThreshold: number | null;
  deliveryInstructions: string | null;
  defaultDeliveryMethod: string | null;
}

export interface NotificationUpdateInput {
  businessNotificationEmail: string | null;
  orderConfirmationEnabled: boolean;
  paymentEnabled: boolean;
  invoiceEnabled: boolean;
  senderName: string;
  replyToEmail: string | null;
}

export interface SettingsUpdateInputMap {
  "business-profile": BusinessProfileUpdateInput;
  invoice: InvoiceUpdateInput;
  regional: RegionalUpdateInput;
  tax: TaxUpdateInput;
  order: OrderUpdateInput;
  payment: PaymentUpdateInput;
  shipping: ShippingUpdateInput;
  notification: NotificationUpdateInput;
}
