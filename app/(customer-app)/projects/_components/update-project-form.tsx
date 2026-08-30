"use client";

import { useActionState, useState } from "react";
import { updateProjectAction } from "@/app/actions/projects";
import type { ProjectUpdateState } from "@/src/projects/contracts";
import {
  maximumProjectDescriptionLength,
  maximumProjectNameLength,
} from "@/src/projects/validation";

type UpdateProjectFormProps = {
  projectId: string;
  initialName: string;
  initialDescription: string;
};

const initialProjectUpdateState: ProjectUpdateState = {
  status: "idle",
  message: "",
};

export function UpdateProjectForm({
  projectId,
  initialName,
  initialDescription,
}: UpdateProjectFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateProjectAction,
    initialProjectUpdateState,
  );

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{initialName}</h2>
          <p className="mt-2 text-zinc-600">
            {initialDescription || "No description provided."}
          </p>
        </div>
        <button
          className="cursor-pointer rounded-md border border-indigo-200 px-2 py-1 text-sm font-medium text-indigo-700 transition-colors hover:border-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input name="projectId" type="hidden" value={projectId} />
      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Project name
        <input
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base"
          defaultValue={initialName}
          disabled={pending}
          maxLength={maximumProjectNameLength}
          name="name"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Description
        <textarea
          className="min-h-24 rounded-lg border border-zinc-300 px-3 py-2 text-base"
          defaultValue={initialDescription}
          disabled={pending}
          maxLength={maximumProjectDescriptionLength}
          name="description"
        />
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
      <div className="flex gap-3">
        <button
          className="cursor-pointer rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          onClick={() => setIsEditing(false)}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
