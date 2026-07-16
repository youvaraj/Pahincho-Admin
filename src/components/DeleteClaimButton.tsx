"use client";

import { useTransition } from "react";
import { deleteClaimAction } from "@/app/(dashboard)/claims/actions";

export function DeleteClaimButton({ claimId }: { claimId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this claim and all of its comments? This cannot be undone.")) {
          return;
        }
        startTransition(async () => {
          await deleteClaimAction(claimId);
        });
      }}
      className="rounded-lg border border-critical/30 bg-critical-soft px-4 py-2 text-sm font-medium text-critical hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete claim"}
    </button>
  );
}
