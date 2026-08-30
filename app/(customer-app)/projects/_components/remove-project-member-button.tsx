"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { removeProjectMemberAction } from "@/app/actions/projects";
import type { ProjectMemberRemovalState } from "@/src/projects/contracts";

type RemoveProjectMemberButtonProps = {
  projectId: string;
  memberId: string;
  memberName: string;
};

const initialProjectMemberRemovalState: ProjectMemberRemovalState = {
  status: "idle",
  message: "",
};

export function RemoveProjectMemberButton({
  projectId,
  memberId,
  memberName,
}: RemoveProjectMemberButtonProps) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const confirmationDialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    removeProjectMemberAction,
    initialProjectMemberRemovalState,
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
        aria-label={`Remove ${memberName} from this project`}
        className="cursor-pointer rounded-md border border-red-200 px-2 py-1 text-sm font-medium text-red-700 transition-colors hover:border-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        onClick={() => setIsConfirmationOpen(true)}
        type="button"
      >
        Remove
      </button>
      <dialog
        aria-describedby={`remove-member-description-${memberId}`}
        aria-labelledby={`remove-member-title-${memberId}`}
        className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40"
        onClose={() => setIsConfirmationOpen(false)}
        ref={confirmationDialogRef}
      >
        <form action={formAction} className="p-6">
          <input name="projectId" type="hidden" value={projectId} />
          <input name="userId" type="hidden" value={memberId} />
          <h3
            className="text-lg font-semibold"
            id={`remove-member-title-${memberId}`}
          >
            Remove {memberName}?
          </h3>
          <p
            className="mt-2 text-sm leading-6 text-zinc-600"
            id={`remove-member-description-${memberId}`}
          >
            This removes the member&apos;s access to this project. They will
            remain an organization member.
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
              {pending ? "Removing…" : "Remove access"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
