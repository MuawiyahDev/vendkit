/**
 * Field groups rendered by shared order-form sections. Each section accepts a
 * register function narrowed to the exact field names it renders, so the
 * create and edit forms can pass their fully typed `register` without `any`.
 */
export type OrderChargeFieldName = "discountAmount" | "shippingFee" | "taxAmount";

export type OrderShippingFieldName =
  | "shippingName"
  | "shippingPhone"
  | "shippingAddress"
  | "shippingCity"
  | "shippingPostalCode";

export type OrderNotesFieldName = "customerNote" | "internalNote";
