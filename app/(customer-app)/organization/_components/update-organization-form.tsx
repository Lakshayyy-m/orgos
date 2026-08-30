"use client";

import { useActionState, useState } from "react";
import { updateOrganizationAction } from "@/app/actions/organizations";
import type { OrganizationUpdateState } from "@/src/organizations/contracts";
import { maximumOrganizationNameLength } from "@/src/organizations/validation";

type UpdateOrganizationFormProps = {
  initialName: string;
};

const initialOrganizationUpdateState: OrganizationUpdateState = {
  status: "idle",
  message: "",
};

export function UpdateOrganizationForm({
  initialName,
}: UpdateOrganizationFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateOrganizationAction,
    initialOrganizationUpdateState,
  );

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between gap-4 ">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          {initialName}
        </h1>
        <button
          className="cursor-pointer rounded-md  px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:border-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          <span className="sr-only">Edit organization</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="inline-block"
          >
            <path
              fill="currentColor"
              d="M21.7 6.29a1 1 0 0 0 0-1.41l-2.58-2.59a1 1 0 0 0-1.41 0l-1.83 1.83-10.09 10.09A3 3 0 0 0 4.06 17l-.82 2.42a1 1 0 0 0 1.26 1.26l2.42-.82a3 3 0 0 0 2.18-.83l10.09-10.09ZM6.59 18l-.98.33.33-.98a1 1 0 0 1 .27-.42l7.52-7.52 1.06 1.06-7.52 7.52a1 1 0 0 1-.42.27Zm9.48-12.13 2.06 2.06-1.06 1.06-2.06-2.06 1.06-1.06Z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid max-w-lg gap-4">
      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Organization name
        <input
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base"
          defaultValue={initialName}
          disabled={pending}
          maxLength={maximumOrganizationNameLength}
          name="name"
          required
        />
      </label>
      {state.status !== "idle" ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-sm text-red-700"
              : "text-sm text-emerald-700"
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
