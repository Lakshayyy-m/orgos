"use client";

import { useActionState } from "react";
import { createProjectAction } from "@/app/actions/projects";
import type { ProjectCreationState } from "@/src/projects/contracts";
import {
  maximumProjectDescriptionLength,
  maximumProjectNameLength,
} from "@/src/projects/validation";

const initialProjectCreationState: ProjectCreationState = {
  status: "idle",
  message: "",
};

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialProjectCreationState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Project name
        <input
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base"
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
      <button
        className="w-fit rounded-lg bg-indigo-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating project…" : "Create project"}
      </button>
    </form>
  );
}
