import { z } from "zod";

export const CATEGORY_NAME_MAX_LENGTH = 100;
export const CATEGORY_SLUG_MAX_LENGTH = 120;

/**
 * Mirrors the NestJS CreateCategoryDto/UpdateCategoryDto rules. The slug is
 * optional; when omitted the API generates one from the category name.
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      CATEGORY_NAME_MAX_LENGTH,
      `Name must be at most ${CATEGORY_NAME_MAX_LENGTH} characters`,
    ),
  slug: z
    .string()
    .trim()
    .max(
      CATEGORY_SLUG_MAX_LENGTH,
      `Slug must be at most ${CATEGORY_SLUG_MAX_LENGTH} characters`,
    )
    .transform((value) => (value === "" ? undefined : value)),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.input<typeof categoryFormSchema>;
export type CategoryFormPayload = z.output<typeof categoryFormSchema>;
