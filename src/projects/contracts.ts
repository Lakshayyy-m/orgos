export type ProjectCreationState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type ProjectMemberAssignmentState = ProjectCreationState;
export type ProjectMemberRemovalState = ProjectCreationState;
export type ProjectUpdateState = ProjectCreationState;
