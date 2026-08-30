export type ProjectCreationState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type ProjectMemberAssignmentState = ProjectCreationState;
