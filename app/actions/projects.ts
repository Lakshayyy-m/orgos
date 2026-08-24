"use server";

import { revalidatePath } from "next/cache";
import { DEMO_ACME_ORGANIZATION_ID } from "@/src/organizations/demo-organization";
import {
  createProjectForOrganization,
  isProjectNameConflict,
} from "@/src/projects/service";
import type { ProjectCreationState } from "@/src/projects/contracts";
import { validateProjectInput } from "@/src/projects/validation";

export async function createProjectAction(
  _previousState: ProjectCreationState,
  formData: FormData,
): Promise<ProjectCreationState> {
  const validation = validateProjectInput({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!validation.isValid) {
    return {
      status: "error",
      message: validation.message,
    };
  }

  try {
    const project = await createProjectForOrganization({
      organizationId: DEMO_ACME_ORGANIZATION_ID,
      name: validation.value.name,
      description: validation.value.description,
    });

    revalidatePath("/");

    return {
      status: "success",
      message: `${project.name} was created.`,
    };
  } catch (error: unknown) {
    if (isProjectNameConflict(error)) {
      return {
        status: "error",
        message: "A project with that name already exists in Acme Corp.",
      };
    }

    // eslint-disable-next-line no-console -- Server-side failures need logging until structured logging is introduced.
    console.error("Project creation failed.", error);

    return {
      status: "error",
      message: "Unable to create the project. Try again.",
    };
  }
}
