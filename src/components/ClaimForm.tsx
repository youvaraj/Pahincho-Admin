"use client";

import { useActionState } from "react";
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_LABELS,
  type AdminClaimRow,
  type ClaimStatus,
  type ClaimUserPrefill,
} from "@/lib/claimTypes";
import type { ActionState } from "@/app/(dashboard)/claims/actions";
import { useActionToast } from "@/components/Toast";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-primary outline-none focus:border-accent";
const labelClass = "mb-1 block text-xs font-medium text-ink-secondary";
const lockedClass =
  "w-full rounded-lg border border-border bg-page px-3 py-2 text-sm text-ink-secondary";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: AdminClaimRow;
  /** Prefill from a user profile when creating a new claim. */
  prefill?: ClaimUserPrefill;
  submitLabel: string;
  defaultStatus?: ClaimStatus;
  /** Optional action shown on the same row as Save (e.g. Delete). */
  secondaryAction?: React.ReactNode;
};

export function ClaimForm({
  action,
  initial,
  prefill,
  submitLabel,
  defaultStatus = "new",
  secondaryAction,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  useActionToast(state);

  const userId = initial?.userId ?? prefill?.userId ?? "";
  const firstName = initial?.firstName ?? prefill?.firstName ?? "";
  const lastName = initial?.lastName ?? prefill?.lastName ?? "";
  const email = initial?.email ?? prefill?.email ?? "";
  const identityLocked = Boolean(prefill && !initial);

  return (
    <form action={formAction} className="space-y-4">
      {userId ? <input type="hidden" name="userId" value={userId} /> : null}

      {identityLocked && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent">
          Linked to user account — name and email are taken from their profile.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            readOnly={identityLocked}
            defaultValue={firstName}
            className={identityLocked ? lockedClass : inputClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            readOnly={identityLocked}
            defaultValue={lastName}
            className={identityLocked ? lockedClass : inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          readOnly={identityLocked}
          defaultValue={email}
          className={identityLocked ? lockedClass : inputClass}
        />
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>
          Claim title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="details" className={labelClass}>
          Claim details
        </label>
        <textarea
          id="details"
          name="details"
          required
          rows={5}
          defaultValue={initial?.details}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={initial?.status ?? defaultStatus}
          className={inputClass}
        >
          {CLAIM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CLAIM_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {secondaryAction}
      </div>
    </form>
  );
}
