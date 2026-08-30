"use server";

import { revalidatePath } from "next/cache";
import { DEMO_ACME_ORGANIZATION_ID } from "@/src/organizations/demo-organization";
import type {
  OrganizationDeletionState,
  OrganizationUpdateState,
} from "@/src/organizations/contracts";
import {
  deleteOrganization,
  updateOrganization,
} from "@/src/organizations/service";
import { validateOrganizationUpdate } from "@/src/organizations/validation";

export async function updateOrganizationAction(
  _previousState: OrganizationUpdateState,
  formData: FormData,
): Promise<OrganizationUpdateState> {
  const validation = validateOrganizationUpdate({
    name: formData.get("name"),
  });

  if (!validation.isValid) {
    return {
      status: "error",
      message: validation.message,
    };
  }

  try {
    const organization = await updateOrganization({
      organizationId: DEMO_ACME_ORGANIZATION_ID,
      name: validation.value.name,
    });

    if (!organization) {
      return {
        status: "error",
        message: "Acme Corp could not be found.",
      };
    }

    revalidatePath("/organization");

    return {
      status: "success",
      message: `${organization.name} was updated.`,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line no-console -- Server-side failures need logging until structured logging is introduced.
    console.error("Organization update failed.", error);

    return {
      status: "error",
      message: "Unable to update the organization. Try again.",
    };
  }
}

export async function deleteOrganizationAction(
  _previousState: OrganizationDeletionState,
  _formData: FormData,
): Promise<OrganizationDeletionState> {
  void _previousState;
  void _formData;

  try {
    const organization = await deleteOrganization(DEMO_ACME_ORGANIZATION_ID);

    if (!organization) {
      return {
        status: "error",
        message: "Acme Corp could not be found.",
      };
    }

    revalidatePath("/organization");
    revalidatePath("/projects");

    return {
      status: "success",
      message: `${organization.name} was deleted.`,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line no-console -- Server-side failures need logging until structured logging is introduced.
    console.error("Organization deletion failed.", error);

    return {
      status: "error",
      message: "Unable to delete the organization. Try again.",
    };
  }
}
