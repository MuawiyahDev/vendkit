import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

import type {
  ProductFormPayload,
  ProductFormValues,
} from "../../schemas/products.schemas";

export type ProductFormMode = "create" | "edit";

/**
 * Shared react-hook-form surface handed to every section component, so
 * each section stays focused on its own fields without prop-drilling the
 * full form API individually.
 */
export interface ProductFormApi {
  mode: ProductFormMode;
  control: Control<ProductFormValues, unknown, ProductFormPayload>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  isSubmitting: boolean;
}
