import { z } from "zod";

export const maximumProjectNameLength = 255;
export const maximumProjectDescriptionLength = 2_000;

export const projectInputSchema = z.object({
  name: z
    .string({ error: "A project name is required." })
    .trim()
    .min(1, { error: "A project name is required." })
    .max(maximumProjectNameLength, {
      error: `Project names must be ${maximumProjectNameLength} characters or fewer.`,
    }),
  description: z
    .string({ error: "The project description is invalid." })
    .trim()
    .max(maximumProjectDescriptionLength, {
      error: `Descriptions must be ${maximumProjectDescriptionLength} characters or fewer.`,
    }),
});

export type ValidatedProjectInput = z.infer<typeof projectInputSchema>;

export type ProjectInputValidationResult =
  | { isValid: true; value: ValidatedProjectInput }
  | { isValid: false; message: string };

export function validateProjectInput(
  input: unknown,
): ProjectInputValidationResult {
  const result = projectInputSchema.safeParse(input);

  if (!result.success) {
    return {
      isValid: false,
      message: result.error.issues[0]?.message ?? "The project input is invalid.",
    };
  }

  return {
    isValid: true,
    value: result.data,
  };
}
