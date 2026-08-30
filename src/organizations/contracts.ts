export type OrganizationUpdateState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type OrganizationDeletionState = OrganizationUpdateState;
