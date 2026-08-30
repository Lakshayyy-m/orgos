import { z } from "zod";

export const maximumOrganizationNameLength = 255;

export const organizationUpdateSchema = z.object({
  name: z
    .string({ error: "An organization name is required." })
    .trim()
    .min(1, { error: "An organization name is required." })
    .max(maximumOrganizationNameLength, {
      error: `Organization names must be ${maximumOrganizationNameLength} characters or fewer.`,
    }),
});

export type ValidatedOrganizationUpdate = z.infer<
  typeof organizationUpdateSchema
>;

export type OrganizationUpdateValidationResult =
  | { isValid: true; value: ValidatedOrganizationUpdate }
  | { isValid: false; message: string };

export function validateOrganizationUpdate(
  input: unknown,
): OrganizationUpdateValidationResult {
  const result = organizationUpdateSchema.safeParse(input);

  if (!result.success) {
    return {
      isValid: false,
      message:
        result.error.issues[0]?.message ?? "The organization input is invalid.",
    };
  }

  return {
    isValid: true,
    value: result.data,
  };
}
