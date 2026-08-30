import { z } from "zod";

export const maximumEmailLength = 320;
export const maximumDisplayNameLength = 120;
export const minimumPasswordLength = 12;
export const maximumPasswordLength = 1_024;

export const registrationSchema = z.object({
  email: z
    .string({ error: "An email address is required." })
    .trim()
    .toLowerCase()
    .email({ error: "Enter a valid email address." })
    .max(maximumEmailLength, {
      error: `Email addresses must be ${maximumEmailLength} characters or fewer.`,
    }),
  displayName: z
    .string({ error: "A display name is required." })
    .trim()
    .min(1, { error: "A display name is required." })
    .max(maximumDisplayNameLength, {
      error: `Display names must be ${maximumDisplayNameLength} characters or fewer.`,
    }),
  password: z
    .string({ error: "A password is required." })
    .min(minimumPasswordLength, {
      error: `Passwords must be at least ${minimumPasswordLength} characters.`,
    })
    .max(maximumPasswordLength, {
      error: `Passwords must be ${maximumPasswordLength} characters or fewer.`,
    }),
});

export type ValidatedRegistration = z.infer<typeof registrationSchema>;

export type RegistrationValidationResult =
  | { isValid: true; value: ValidatedRegistration }
  | { isValid: false; message: string };

export function validateRegistration(
  input: unknown,
): RegistrationValidationResult {
  const result = registrationSchema.safeParse(input);

  if (!result.success) {
    return {
      isValid: false,
      message: result.error.issues[0]?.message ?? "The registration is invalid.",
    };
  }

  return {
    isValid: true,
    value: result.data,
  };
}
