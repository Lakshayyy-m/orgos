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

export const projectMemberAssignmentSchema = z.object({
  projectId: z
    .string({ error: "Select a project." })
    .uuid({ error: "Select a valid project." }),
  userId: z
    .string({ error: "Select an organization member." })
    .uuid({ error: "Select a valid organization member." }),
});

export type ValidatedProjectInput = z.infer<typeof projectInputSchema>;
export type ValidatedProjectMemberAssignment = z.infer<
  typeof projectMemberAssignmentSchema
>;

export type ProjectInputValidationResult =
  | { isValid: true; value: ValidatedProjectInput }
  | { isValid: false; message: string };

export type ProjectMemberAssignmentValidationResult =
  | { isValid: true; value: ValidatedProjectMemberAssignment }
  | { isValid: false; message: string };

function getValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "The project input is invalid.";
}

export function validateProjectInput(
  input: unknown,
): ProjectInputValidationResult {
  const result = projectInputSchema.safeParse(input);

  if (!result.success) {
    return {
      isValid: false,
      message: getValidationMessage(result.error),
    };
  }

  return {
    isValid: true,
    value: result.data,
  };
}

export function validateProjectMemberAssignment(
  input: unknown,
): ProjectMemberAssignmentValidationResult {
  const result = projectMemberAssignmentSchema.safeParse(input);

  if (!result.success) {
    return {
      isValid: false,
      message: getValidationMessage(result.error),
    };
  }

  return {
    isValid: true,
    value: result.data,
  };
}
