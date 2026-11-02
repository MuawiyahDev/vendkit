import type { UseFormRegisterReturn } from "react-hook-form";

/**
 * The plain text fields (walk-in guest details, shipping address, and notes)
 * that exist on both the create and update order forms and are rendered
 * through shared components.
 */
export type OrderTextField =
  | "guestName"
  | "guestPhone"
  | "shippingName"
  | "shippingPhone"
  | "shippingAddress"
  | "shippingCity"
  | "shippingPostalCode"
  | "customerNote"
  | "internalNote";

/**
 * Register accessor compatible with `UseFormRegister` of either order form,
 * narrowed to the shared text fields.
 */
export type OrderTextFieldRegister = <TFieldName extends string>(
  name: TFieldName,
) => UseFormRegisterReturn<TFieldName>;
