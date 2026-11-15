import {
  CurrencyDisplayFormat,
  CurrencyPosition,
  InvoiceDefaultStatus,
  OrderStatus,
  PaymentMethod,
  Prisma,
  TaxPricingMode,
  type BusinessProfileSettings,
  type InvoiceSettings,
  type NotificationSettings,
  type OrderSettings,
  type PaymentSettings,
  type RegionalSettings,
  type ShippingSettings,
  type TaxSettings,
} from '@repo/database';
import { DEFAULT_CURRENCY } from '../common/constants/currency.constants.js';

export const SETTINGS_SINGLETON_ID = 'default';

export const DOCUMENT_SEQUENCE_INVOICE_KEY = 'INVOICE';

export const IMAGE_API_ROUTE = '/api/images';

export const BUSINESS_NAME_MAX_LENGTH = 200;
export const BUSINESS_LEGAL_NAME_MAX_LENGTH = 200;
export const BUSINESS_EMAIL_MAX_LENGTH = 254;
export const BUSINESS_PHONE_MAX_LENGTH = 30;
export const BUSINESS_WEBSITE_MAX_LENGTH = 500;
export const BUSINESS_DESCRIPTION_MAX_LENGTH = 2000;
export const BUSINESS_REGISTRATION_MAX_LENGTH = 100;
export const BUSINESS_TAX_ID_MAX_LENGTH = 100;
export const ADDRESS_LINE_MAX_LENGTH = 500;
export const ADDRESS_CITY_MAX_LENGTH = 100;
export const ADDRESS_STATE_MAX_LENGTH = 100;
export const ADDRESS_POSTAL_CODE_MAX_LENGTH = 20;
export const ADDRESS_COUNTRY_MAX_LENGTH = 100;

export const DOCUMENT_PREFIX_MAX_LENGTH = 20;
export const DOCUMENT_PREFIX_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export const INVOICE_NUMBER_FORMAT_MAX_LENGTH = 100;
export const INVOICE_NUMBER_FORMAT_TOKENS = [
  '{prefix}',
  '{year}',
  '{month}',
  '{sequence}',
] as const;
export const INVOICE_NUMBER_FORMAT_PATTERN =
  /^(?=.*\{sequence\})(?!.*\{(?!prefix\}|year\}|month\}|sequence\})).{1,100}$/;

export const INVOICE_PAYMENT_TERMS_MAX_LENGTH = 1000;
export const INVOICE_NOTES_MAX_LENGTH = 2000;
export const INVOICE_FOOTER_MAX_LENGTH = 1000;
export const INVOICE_ADDITIONAL_INFO_MAX_LENGTH = 2000;

export const TAX_NAME_MAX_LENGTH = 100;
export const TAX_ID_MAX_LENGTH = 100;
export const MAX_TAX_RATE = 100;

export const ORDER_NOTES_MAX_LENGTH = 2000;

export const PAYMENT_BANK_FIELD_MAX_LENGTH = 200;
export const PAYMENT_REFERENCE_MAX_LENGTH = 100;
export const PAYMENT_INSTRUCTIONS_MAX_LENGTH = 2000;
export const PAYMENT_TERMS_MAX_LENGTH = 1000;

export const SHIPPING_METHOD_MAX_LENGTH = 100;
export const SHIPPING_INSTRUCTIONS_MAX_LENGTH = 2000;
export const MAX_SHIPPING_CHARGE = 9_999_999_999.99;

export const NOTIFICATION_SENDER_MAX_LENGTH = 200;

export const MAX_DECIMAL_PRECISION = 6;
export const MAX_SEQUENCE_VALUE = 999_999_999;
export const MAX_DUE_PERIOD_DAYS = 3650;

export const SUPPORTED_DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD MMM YYYY',
  'D MMMM YYYY',
] as const;

export const SUPPORTED_TIME_FORMATS = [
  'HH:mm',
  'HH:mm:ss',
  'hh:mm A',
  'hh:mm:ss A',
] as const;

export const DEFAULT_BUSINESS_PROFILE = {
  businessName: 'VendKit',
  legalName: null,
  logoImageId: null,
  email: null,
  phone: null,
  alternativePhone: null,
  website: null,
  description: null,
  registrationNumber: null,
  taxIdentificationNumber: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
} satisfies Omit<
  BusinessProfileSettings,
  'id' | 'createdAt' | 'updatedAt'
>;

export const DEFAULT_INVOICE_SETTINGS = {
  useBusinessProfile: true,
  displayName: null,
  logoImageId: null,
  email: null,
  phone: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  taxRegistrationNumber: null,
  additionalInfo: null,
  numberPrefix: 'INV',
  numberFormat: '{prefix}-{year}-{sequence}',
  yearBasedNumbering: true,
  automaticNumbering: true,
  startingSequence: 1,
  duePeriodDays: 30,
  paymentTerms: null,
  notes: null,
  footerText: null,
  currencyDisplayFormat: CurrencyDisplayFormat.SYMBOL,
  showSku: true,
  showTaxBreakdown: true,
  showDiscountBreakdown: true,
  defaultStatus: InvoiceDefaultStatus.DRAFT,
  allowEditingAfterIssue: false,
  allowCancellation: true,
} satisfies Omit<InvoiceSettings, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_REGIONAL_SETTINGS = {
  currency: DEFAULT_CURRENCY,
  currencySymbol: '৳',
  currencyPosition: CurrencyPosition.BEFORE,
  decimalPrecision: 2,
  thousandSeparator: ',',
  decimalSeparator: '.',
  defaultCountry: 'BD',
  timezone: 'Asia/Dhaka',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  language: 'en',
} satisfies Omit<RegionalSettings, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_TAX_SETTINGS = {
  enabled: false,
  defaultName: 'VAT',
  defaultRate: new Prisma.Decimal(0),
  taxIdentificationNumber: null,
  pricingMode: TaxPricingMode.EXCLUSIVE,
  showBreakdownOnInvoice: true,
} satisfies Omit<TaxSettings, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_ORDER_SETTINGS = {
  orderNumberPrefix: 'ORD',
  automaticNumbering: true,
  defaultStatus: OrderStatus.PENDING,
  defaultNotes: null,
  allowEditing: true,
  requireCustomerInformation: false,
} satisfies Omit<OrderSettings, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_PAYMENT_SETTINGS = {
  enabledMethods: [
    PaymentMethod.CASH,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.MOBILE_FINANCIAL_SERVICE,
    PaymentMethod.CARD,
    PaymentMethod.OTHER,
  ],
  defaultMethod: PaymentMethod.CASH,
  bankAccountName: null,
  bankName: null,
  accountNumber: null,
  branchName: null,
  routingNumber: null,
  paymentInstructions: null,
  defaultPaymentTerms: null,
} satisfies Omit<PaymentSettings, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_SHIPPING_SETTINGS = {
  enabled: true,
  defaultCharge: new Prisma.Decimal(0),
  freeShippingThreshold: null,
  deliveryInstructions: null,
  defaultDeliveryMethod: null,
} satisfies Omit<ShippingSettings, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_NOTIFICATION_SETTINGS = {
  businessNotificationEmail: null,
  orderConfirmationEnabled: false,
  paymentEnabled: false,
  invoiceEnabled: false,
  senderName: 'VendKit',
  replyToEmail: null,
} satisfies Omit<NotificationSettings, 'id' | 'createdAt' | 'updatedAt'>;

export const LOGO_SELECT = {
  id: true,
} satisfies Prisma.ImageSelect;

export const BUSINESS_PROFILE_INCLUDE = {
  logo: { select: LOGO_SELECT },
} satisfies Prisma.BusinessProfileSettingsInclude;

export const INVOICE_SETTINGS_INCLUDE = {
  logo: { select: LOGO_SELECT },
} satisfies Prisma.InvoiceSettingsInclude;

export enum SettingsCategory {
  BusinessProfile = 'business-profile',
  Invoice = 'invoice',
  Regional = 'regional',
  Tax = 'tax',
  Order = 'order',
  Payment = 'payment',
  Shipping = 'shipping',
  Notification = 'notification',
}
