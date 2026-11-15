import { z } from "zod";

import type {
  BusinessProfileSettings,
  BusinessProfileUpdateInput,
} from "../settings.types";
import {
  optionalEmail,
  optionalPhone,
  optionalText,
  optionalWebsite,
  requiredText,
} from "./settings-schema.utils";

export const businessProfileFormSchema = z.object({
  businessName: requiredText(
    200,
    "Business name must be at most 200 characters",
  ),
  legalName: optionalText(200, "Legal name must be at most 200 characters"),
  logoImageId: z.string(),
  logoUrl: z.string(),
  email: optionalEmail(),
  phone: optionalPhone(),
  alternativePhone: optionalPhone(),
  website: optionalWebsite(),
  description: optionalText(
    2000,
    "Description must be at most 2000 characters",
  ),
  registrationNumber: optionalText(
    100,
    "Registration number must be at most 100 characters",
  ),
  taxIdentificationNumber: optionalText(
    100,
    "Tax identification number must be at most 100 characters",
  ),
  addressLine1: optionalText(500, "Address must be at most 500 characters"),
  addressLine2: optionalText(500, "Address must be at most 500 characters"),
  city: optionalText(100, "City must be at most 100 characters"),
  state: optionalText(100, "State must be at most 100 characters"),
  postalCode: optionalText(20, "Postal code must be at most 20 characters"),
  country: optionalText(100, "Country must be at most 100 characters"),
});

export type BusinessProfileFormValues = z.input<
  typeof businessProfileFormSchema
>;
export type BusinessProfileFormPayload = z.output<
  typeof businessProfileFormSchema
>;

export function toBusinessProfileFormValues(
  profile: BusinessProfileSettings,
): BusinessProfileFormValues {
  return {
    businessName: profile.businessName,
    legalName: profile.legalName ?? "",
    logoImageId: profile.logo?.id ?? "",
    logoUrl: profile.logo?.url ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    alternativePhone: profile.alternativePhone ?? "",
    website: profile.website ?? "",
    description: profile.description ?? "",
    registrationNumber: profile.registrationNumber ?? "",
    taxIdentificationNumber: profile.taxIdentificationNumber ?? "",
    addressLine1: profile.addressLine1 ?? "",
    addressLine2: profile.addressLine2 ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    postalCode: profile.postalCode ?? "",
    country: profile.country ?? "",
  };
}

export function toBusinessProfileUpdateInput(
  values: BusinessProfileFormPayload,
): BusinessProfileUpdateInput {
  return {
    businessName: values.businessName,
    legalName: values.legalName,
    logoImageId: values.logoImageId || null,
    email: values.email,
    phone: values.phone,
    alternativePhone: values.alternativePhone,
    website: values.website,
    description: values.description,
    registrationNumber: values.registrationNumber,
    taxIdentificationNumber: values.taxIdentificationNumber,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2,
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    country: values.country,
  };
}
