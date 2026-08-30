"use server";

import { revalidatePath } from "next/cache";
import { DEMO_ACME_ORGANIZATION_ID } from "@/src/organizations/demo-organization";
import {
  assignProjectMember,
  createProjectForOrganization,
  isProjectNameConflict,
  ProjectMembershipError,
  removeProjectMember,
  updateProjectForOrganization,
} from "@/src/projects/service";
import type {
  ProjectCreationState,
  ProjectMemberAssignmentState,
  ProjectMemberRemovalState,
  ProjectUpdateState,
} from "@/src/projects/contracts";
import {
  validateProjectInput,
  validateProjectMemberAssignment,
  validateProjectUpdate,
} from "@/src/projects/validation";

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

    revalidatePath("/projects");

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

export async function updateProjectAction(
  _previousState: ProjectUpdateState,
  formData: FormData,
): Promise<ProjectUpdateState> {
  const validation = validateProjectUpdate({
    projectId: formData.get("projectId"),
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
    const project = await updateProjectForOrganization({
      organizationId: DEMO_ACME_ORGANIZATION_ID,
      projectId: validation.value.projectId,
      name: validation.value.name,
      description: validation.value.description,
    });

    if (!project) {
      return {
        status: "error",
        message: "That project does not belong to Acme Corp.",
      };
    }

    revalidatePath("/projects");

    return {
      status: "success",
      message: `${project.name} was updated.`,
    };
  } catch (error: unknown) {
    if (isProjectNameConflict(error)) {
      return {
        status: "error",
        message: "A project with that name already exists in Acme Corp.",
      };
    }

    // eslint-disable-next-line no-console -- Server-side failures need logging until structured logging is introduced.
    console.error("Project update failed.", error);

    return {
      status: "error",
      message: "Unable to update the project. Try again.",
    };
  }
}

export async function assignProjectMemberAction(
  _previousState: ProjectMemberAssignmentState,
  formData: FormData,
): Promise<ProjectMemberAssignmentState> {
  const validation = validateProjectMemberAssignment({
    projectId: formData.get("projectId"),
    userId: formData.get("userId"),
  });

  if (!validation.isValid) {
    return {
      status: "error",
      message: validation.message,
    };
  }

  try {
    const result = await assignProjectMember({
      organizationId: DEMO_ACME_ORGANIZATION_ID,
      projectId: validation.value.projectId,
      userId: validation.value.userId,
    });

    if (result.status === "already_assigned") {
      return {
        status: "error",
        message: "That member is already assigned to the project.",
      };
    }

    revalidatePath("/projects");

    return {
      status: "success",
      message: "Project member assigned.",
    };
  } catch (error: unknown) {
    if (error instanceof ProjectMembershipError) {
      return {
        status: "error",
        message: "The project or member does not belong to Acme Corp.",
      };
    }

    // eslint-disable-next-line no-console -- Server-side failures need logging until structured logging is introduced.
    console.error("Project member assignment failed.", error);

    return {
      status: "error",
      message: "Unable to assign the member. Try again.",
    };
  }
}

export async function removeProjectMemberAction(
  _previousState: ProjectMemberRemovalState,
  formData: FormData,
): Promise<ProjectMemberRemovalState> {
  const validation = validateProjectMemberAssignment({
    projectId: formData.get("projectId"),
    userId: formData.get("userId"),
  });

  if (!validation.isValid) {
    return {
      status: "error",
      message: validation.message,
    };
  }

  try {
    const result = await removeProjectMember({
      organizationId: DEMO_ACME_ORGANIZATION_ID,
      projectId: validation.value.projectId,
      userId: validation.value.userId,
    });

    if (result.status === "not_assigned") {
      return {
        status: "error",
        message: "That member is not assigned to this project.",
      };
    }

    revalidatePath("/projects");

    return {
      status: "success",
      message: "Project member removed.",
    };
  } catch (error: unknown) {
    // eslint-disable-next-line no-console -- Server-side failures need logging until structured logging is introduced.
    console.error("Project member removal failed.", error);

    return {
      status: "error",
      message: "Unable to remove the member. Try again.",
    };
  }
}
