import { z } from "zod";

export const addMemberSchema = z.object({
  name: z.string().trim().max(100, "Use 100 characters or fewer"),
  email: z.string().trim().min(1, "Enter an email").email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128, "Use 128 characters or fewer"),
  role: z.enum(["USER", "ADMIN"]),
});

export type AddMemberValues = z.infer<typeof addMemberSchema>;
