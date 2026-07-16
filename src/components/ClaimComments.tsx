"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/(dashboard)/claims/actions";
import { addCommentAction } from "@/app/(dashboard)/claims/actions";
import type { ClaimCommentRow } from "@/lib/claimTypes";
import { useActionToast } from "@/components/Toast";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-accent";

export function ClaimComments({
  claimId,
  comments,
}: {
  claimId: string;
  comments: ClaimCommentRow[];
}) {
  const boundAction = addCommentAction.bind(null, claimId);
  const [state, formAction, pending] = useActionState(boundAction, {} as ActionState);
  useActionToast(state);

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-page px-4 py-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span className="font-medium text-ink-secondary">{c.authorEmail}</span>
                <span>·</span>
                <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink-primary">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-3 border-t border-border pt-4">
        <label htmlFor="body" className="mb-1 block text-xs font-medium text-ink-secondary">
          Add comment
        </label>
        <textarea id="body" name="body" required rows={3} className={inputClass} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post comment"}
        </button>
      </form>
    </div>
  );
}
