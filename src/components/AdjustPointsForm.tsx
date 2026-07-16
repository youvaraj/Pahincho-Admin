"use client";

import { useActionState, useRef, useState } from "react";
import {
  adjustPointsAction,
  type AdjustPointsState,
} from "@/app/(dashboard)/users/actions";
import { useActionToast } from "@/components/Toast";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary outline-none focus:border-accent sm:w-36";

export function AdjustPointsForm({
  userId,
  currentPoints,
}: {
  userId: string;
  currentPoints: number;
}) {
  const bound = adjustPointsAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(bound, {} as AdjustPointsState);
  useActionToast(state);
  const formRef = useRef<HTMLFormElement>(null);
  const allowSubmitRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (allowSubmitRef.current) {
      allowSubmitRef.current = false;
      return;
    }

    e.preventDefault();
    const amount = String(new FormData(e.currentTarget).get("amount") ?? "").trim();
    if (!amount) return;
    setPendingAmount(amount);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    setConfirmOpen(false);
    allowSubmitRef.current = true;
    formRef.current?.requestSubmit();
  }

  const amountNum = Number(pendingAmount);
  const previewBalance =
    Number.isFinite(amountNum) ? currentPoints + Math.trunc(amountNum) : null;

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <p className="mb-1 text-xs text-ink-muted">
            Current balance: {currentPoints.toLocaleString()}
          </p>
          <label htmlFor="amount" className="mb-1 block text-xs font-medium text-ink-secondary">
            Points to add (use negative to deduct)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            required
            step={1}
            placeholder="e.g. 50"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update points"}
        </button>
      </form>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjust-points-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg">
            <h3 id="adjust-points-title" className="text-sm font-semibold text-ink-primary">
              Confirm points update
            </h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Change this user&apos;s balance by{" "}
              <span className="font-medium text-ink-primary">
                {Number.isFinite(amountNum) && amountNum > 0
                  ? `+${Math.trunc(amountNum)}`
                  : pendingAmount}
              </span>
              ?
              {previewBalance !== null && (
                <>
                  {" "}
                  New balance will be{" "}
                  <span className="font-medium text-ink-primary">
                    {previewBalance.toLocaleString()}
                  </span>
                  .
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              This writes to the user profile and points history and cannot be undone from here.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
