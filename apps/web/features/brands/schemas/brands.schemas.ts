import { z } from "zod";

export const BRAND_NAME_MAX_LENGTH = 100;
export const BRAND_SLUG_MAX_LENGTH = 120;

/**
 * Mirrors the NestJS CreateBrandDto/UpdateBrandDto rules. The slug is
 * optional; when omitted the API generates one from the brand name.
 */
export const brandFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      BRAND_NAME_MAX_LENGTH,
      `Name must be at most ${BRAND_NAME_MAX_LENGTH} characters`,
    ),
  slug: z
    .string()
    .trim()
    .max(
      BRAND_SLUG_MAX_LENGTH,
      `Slug must be at most ${BRAND_SLUG_MAX_LENGTH} characters`,
    )
    .transform((value) => (value === "" ? undefined : value)),
  isActive: z.boolean(),
});

export type BrandFormValues = z.input<typeof brandFormSchema>;
export type BrandFormPayload = z.output<typeof brandFormSchema>;
