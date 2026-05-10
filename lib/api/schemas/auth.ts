import { z } from "zod";

/**
 * Auth validation schemas — shared between client forms and server actions.
 * See: docs/api/validation.md
 */

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  fullName: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
