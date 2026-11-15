import type {
  CurrencyDisplayFormat,
  CurrencyPosition,
  InvoiceDefaultStatus,
  OrderStatus,
  PaymentMethod,
  TaxPricingMode,
} from "../settings.types";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

const FALLBACK_CURRENCIES = [
  "BDT",
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AED",
  "SAR",
  "CAD",
  "AUD",
  "JPY",
  "CNY",
  "SGD",
  "MYR",
  "PKR",
  "NPR",
  "LKR",
  "IDR",
  "PHP",
  "THB",
  "VND",
  "TRY",
  "BRL",
  "MXN",
  "ZAR",
  "NGN",
  "KES",
  "EGP",
] as const;

const ISO_COUNTRY_CODES =
  "AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW";

const LANGUAGE_CODES = [
  "en",
  "en-US",
  "en-GB",
  "bn",
  "bn-BD",
  "hi",
  "ar",
  "es",
  "fr",
  "de",
  "pt",
  "it",
  "nl",
  "tr",
  "id",
  "ms",
  "ur",
  "zh",
  "ja",
  "ko",
  "ru",
  "vi",
  "th",
  "sw",
  "ha",
  "yo",
  "ig",
  "am",
  "fil",
] as const;

function createDisplayNames(
  type: "currency" | "region" | "language",
): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(["en"], { type });
  } catch {
    return null;
  }
}

function getSupportedValues(
  key: "currency" | "timeZone",
  fallback: readonly string[],
): string[] {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf(key);
    }
  } catch {
    // Fall through to the safe subset.
  }
  return [...fallback];
}

function buildCurrencyOptions(): SelectOption[] {
  const names = createDisplayNames("currency");
  return getSupportedValues("currency", FALLBACK_CURRENCIES)
    .map((code) => {
      const name = names?.of(code);
      return {
        value: code,
        label: name ? `${code} — ${name}` : code,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildCountryOptions(): SelectOption[] {
  const names = createDisplayNames("region");
  return ISO_COUNTRY_CODES.split(",")
    .map((code) => ({
      value: code,
      label: names?.of(code) ?? code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildTimezoneOptions(): SelectOption[] {
  const zones = getSupportedValues("timeZone", ["Asia/Dhaka"]);
  const uniqueZones = ["UTC", ...zones.filter((zone) => zone !== "UTC")];

  return uniqueZones.map((zone) => ({
    value: zone,
    label: zone.replaceAll("_", " "),
    description: zone,
  }));
}

function buildLanguageOptions(): SelectOption[] {
  const names = createDisplayNames("language");
  return LANGUAGE_CODES.map((code) => ({
    value: code,
    label: names?.of(code) ?? code,
  })).sort((a, b) => a.label.localeCompare(b.label));
}

export const CURRENCY_OPTIONS = buildCurrencyOptions();
export const COUNTRY_OPTIONS = buildCountryOptions();
export const TIMEZONE_OPTIONS = buildTimezoneOptions();
export const LANGUAGE_OPTIONS = buildLanguageOptions();

export const CURRENCY_POSITION_OPTIONS: SelectOption[] = [
  { value: "BEFORE", label: "Before amount", description: "৳ 1,250.00" },
  { value: "AFTER", label: "After amount", description: "1,250.00 ৳" },
];

export const CURRENCY_DISPLAY_OPTIONS: SelectOption[] = [
  { value: "SYMBOL", label: "Symbol only", description: "৳ 1,250.00" },
  { value: "CODE", label: "Currency code", description: "BDT 1,250.00" },
  {
    value: "SYMBOL_AND_CODE",
    label: "Symbol and code",
    description: "৳ BDT 1,250.00",
  },
];

export const DATE_FORMAT_OPTIONS: SelectOption[] = [
  { value: "DD/MM/YYYY", label: "31/12/2026" },
  { value: "MM/DD/YYYY", label: "12/31/2026" },
  { value: "YYYY-MM-DD", label: "2026-12-31" },
  { value: "DD MMM YYYY", label: "31 Dec 2026" },
  { value: "D MMMM YYYY", label: "31 December 2026" },
];

export const TIME_FORMAT_OPTIONS: SelectOption[] = [
  { value: "HH:mm", label: "14:30" },
  { value: "HH:mm:ss", label: "14:30:45" },
  { value: "hh:mm A", label: "02:30 PM" },
  { value: "hh:mm:ss A", label: "02:30:45 PM" },
];

export const TAX_PRICING_OPTIONS: SelectOption[] = [
  {
    value: "EXCLUSIVE",
    label: "Tax exclusive",
    description: "Tax is added on top of the selling price.",
  },
  {
    value: "INCLUSIVE",
    label: "Tax inclusive",
    description: "The selling price already contains tax.",
  },
];

export const INVOICE_STATUS_OPTIONS: SelectOption[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
];

export const ORDER_STATUS_OPTIONS: SelectOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
];

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "CASH",
    label: "Cash",
    description: "Cash received in person or on delivery.",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank transfer",
    description: "Direct transfer to the business bank account.",
  },
  {
    value: "MOBILE_FINANCIAL_SERVICE",
    label: "Mobile financial service",
    description: "Mobile wallet or agent-based payment.",
  },
  {
    value: "CARD",
    label: "Card",
    description: "Manual recording of a card payment.",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Any other manual payment method.",
  },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  MOBILE_FINANCIAL_SERVICE: "Mobile financial service",
  CARD: "Card",
  OTHER: "Other",
};

export const CURRENCY_POSITION_LABELS: Record<CurrencyPosition, string> = {
  BEFORE: "Before amount",
  AFTER: "After amount",
};

export const CURRENCY_DISPLAY_LABELS: Record<CurrencyDisplayFormat, string> = {
  SYMBOL: "Symbol only",
  CODE: "Currency code",
  SYMBOL_AND_CODE: "Symbol and code",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceDefaultStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
};

export const TAX_PRICING_LABELS: Record<TaxPricingMode, string> = {
  EXCLUSIVE: "Tax exclusive",
  INCLUSIVE: "Tax inclusive",
};
