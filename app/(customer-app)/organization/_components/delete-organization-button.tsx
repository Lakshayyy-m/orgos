"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteOrganizationAction } from "@/app/actions/organizations";
import type { OrganizationDeletionState } from "@/src/organizations/contracts";

type DeleteOrganizationButtonProps = {
  organizationName: string;
  memberCount: number;
  projectCount: number;
};

const initialOrganizationDeletionState: OrganizationDeletionState = {
  status: "idle",
  message: "",
};

export function DeleteOrganizationButton({
  organizationName,
  memberCount,
  projectCount,
}: DeleteOrganizationButtonProps) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const confirmationDialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    deleteOrganizationAction,
    initialOrganizationDeletionState,
  );

  useEffect(() => {
    const dialog = confirmationDialogRef.current;

    if (!dialog) {
      return;
    }

    if (isConfirmationOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isConfirmationOpen && dialog.open) {
      dialog.close();
    }
  }, [isConfirmationOpen]);

  return (
    <>
      <button
        className="cursor-pointer rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        onClick={() => setIsConfirmationOpen(true)}
        type="button"
      >
        Delete organization
      </button>
      <dialog
        aria-describedby="delete-organization-description"
        aria-labelledby="delete-organization-title"
        className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40"
        onClose={() => setIsConfirmationOpen(false)}
        ref={confirmationDialogRef}
      >
        <form action={formAction} className="p-6">
          <h2 className="text-lg font-semibold" id="delete-organization-title">
            Delete {organizationName}?
          </h2>
          <p
            className="mt-2 text-sm leading-6 text-zinc-600"
            id="delete-organization-description"
          >
            This permanently deletes the organization, its {projectCount}{" "}
            projects, and its {memberCount} member links. This cannot be undone.
          </p>
          {state.status === "error" ? (
            <p aria-live="polite" className="mt-3 text-sm text-red-700">
              {state.message}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              onClick={() => setIsConfirmationOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Deleting…" : "Delete organization"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
