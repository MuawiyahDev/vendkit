import type {
  CurrencyDisplayFormat,
  CurrencyPosition,
  InvoiceDefaultStatus,
  NotificationSettings,
  OrderSettings,
  OrderStatus,
  PaymentMethod,
  PaymentSettings,
  Prisma,
  RegionalSettings,
  ShippingSettings,
  TaxPricingMode,
  TaxSettings,
} from '@repo/database';
import type {
  BUSINESS_PROFILE_INCLUDE,
  INVOICE_SETTINGS_INCLUDE,
} from './settings.constants.js';

export type BusinessProfileRow = Prisma.BusinessProfileSettingsGetPayload<{
  include: typeof BUSINESS_PROFILE_INCLUDE;
}>;

export type InvoiceSettingsRow = Prisma.InvoiceSettingsGetPayload<{
  include: typeof INVOICE_SETTINGS_INCLUDE;
}>;

export type RegionalSettingsRow = RegionalSettings;
export type TaxSettingsRow = TaxSettings;
export type OrderSettingsRow = OrderSettings;
export type PaymentSettingsRow = PaymentSettings;
export type ShippingSettingsRow = ShippingSettings;
export type NotificationSettingsRow = NotificationSettings;

export interface LogoResponse {
  id: string;
  url: string;
}

export interface BusinessProfileResponse {
  businessName: string;
  legalName: string | null;
  logo: LogoResponse | null;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface EffectiveInvoiceBusinessInformation {
  displayName: string;
  logo: LogoResponse | null;
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

export interface InvoiceSettingsResponse {
  useBusinessProfile: boolean;
  displayName: string | null;
  logo: LogoResponse | null;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface RegionalSettingsResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxSettingsResponse {
  enabled: boolean;
  defaultName: string;
  defaultRate: string;
  taxIdentificationNumber: string | null;
  pricingMode: TaxPricingMode;
  showBreakdownOnInvoice: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderSettingsResponse {
  orderNumberPrefix: string;
  automaticNumbering: boolean;
  defaultStatus: OrderStatus;
  defaultNotes: string | null;
  allowEditing: boolean;
  requireCustomerInformation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSettingsResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingSettingsResponse {
  enabled: boolean;
  defaultCharge: string;
  freeShippingThreshold: string | null;
  deliveryInstructions: string | null;
  defaultDeliveryMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettingsResponse {
  businessNotificationEmail: string | null;
  orderConfirmationEnabled: boolean;
  paymentEnabled: boolean;
  invoiceEnabled: boolean;
  senderName: string;
  replyToEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AllSettingsResponse {
  businessProfile: BusinessProfileResponse;
  invoice: InvoiceSettingsResponse;
  regional: RegionalSettingsResponse;
  tax: TaxSettingsResponse;
  order: OrderSettingsResponse;
  payment: PaymentSettingsResponse;
  shipping: ShippingSettingsResponse;
  notification: NotificationSettingsResponse;
}

export type SettingsCategoryResponse =
  | BusinessProfileResponse
  | InvoiceSettingsResponse
  | RegionalSettingsResponse
  | TaxSettingsResponse
  | OrderSettingsResponse
  | PaymentSettingsResponse
  | ShippingSettingsResponse
  | NotificationSettingsResponse;

export interface OrderRuntimeConfig {
  currency: string;
  orderNumberPrefix: string;
  automaticNumbering: boolean;
  defaultStatus: OrderStatus;
  defaultNotes: string | null;
  allowEditing: boolean;
  requireCustomerInformation: boolean;
  shippingEnabled: boolean;
  defaultShippingCharge: Prisma.Decimal;
  freeShippingThreshold: Prisma.Decimal | null;
}

export interface InvoiceNumberAssignment {
  number: string;
  sequence: number;
  year: number | null;
}
