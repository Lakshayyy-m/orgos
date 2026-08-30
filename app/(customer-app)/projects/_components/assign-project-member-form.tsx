"use client";

import { useActionState } from "react";
import { assignProjectMemberAction } from "@/app/actions/projects";
import type { ProjectMemberAssignmentState } from "@/src/projects/contracts";

type AssignmentProject = {
  id: string;
  name: string;
};

type AssignmentOrganizationMember = {
  userId: string;
  displayName: string;
};

type AssignProjectMemberFormProps = {
  projects: readonly AssignmentProject[];
  organizationMembers: readonly AssignmentOrganizationMember[];
};

const initialProjectMemberAssignmentState: ProjectMemberAssignmentState = {
  status: "idle",
  message: "",
};

export function AssignProjectMemberForm({
  projects,
  organizationMembers,
}: AssignProjectMemberFormProps) {
  const [state, formAction, pending] = useActionState(
    assignProjectMemberAction,
    initialProjectMemberAssignmentState,
  );

  if (projects.length === 0 || organizationMembers.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-600">
        Create a project and add organization members before assigning access.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Project
        <select
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base"
          defaultValue=""
          disabled={pending}
          name="projectId"
          required
        >
          <option disabled value="">
            Select a project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Organization member
        <select
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base"
          defaultValue=""
          disabled={pending}
          name="userId"
          required
        >
          <option disabled value="">
            Select a member
          </option>
          {organizationMembers.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName}
            </option>
          ))}
        </select>
      </label>
      {state.status !== "idle" ? (
        <p
          aria-live="polite"
          className={
            state.status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"
          }
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="w-fit rounded-lg bg-indigo-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Assigning member…" : "Assign member"}
      </button>
    </form>
  );
}
