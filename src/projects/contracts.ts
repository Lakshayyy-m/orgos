export type ProjectCreationState = {
  status: "idle" | "error" | "success";
  message: string;
};
