"use client";

import type { PickedImage } from "@/features/images/api/images-api";

import { ImagesField } from "./images-field";
import type { ProductFormApi } from "./product-form.types";
import { FormSection } from "./form-section";

interface ProductImagesSectionProps {
  form: ProductFormApi;
  /** Current ordered selection, including images from other pages. */
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
}

/**
 * Product image associations. Delegates to the reusable image library
 * picker; removing an image only detaches it from the product.
 */
export function ProductImagesSection({
  form,
  images,
  onChange,
}: ProductImagesSectionProps) {
  return (
    <FormSection
      title="Product images"
      description="Pick images from your library. The first image is used as the primary product image."
    >
      <ImagesField
        images={images}
        onChange={onChange}
        disabled={form.isSubmitting}
      />
    </FormSection>
  );
}
