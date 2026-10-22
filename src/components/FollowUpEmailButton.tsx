"use client";

import { useCallback, useMemo, useState } from "react";
import {
  FOLLOW_UP_EMAIL_SUBJECT,
  buildFollowUpEmailBody,
} from "@/lib/followUpEmail";

export function FollowUpEmailButton({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const body = useMemo(
    () => buildFollowUpEmailBody(firstName, lastName),
    [firstName, lastName],
  );
  const mailto = useMemo(() => {
    const subject = encodeURIComponent(FOLLOW_UP_EMAIL_SUBJECT);
    const encodedBody = encodeURIComponent(body);
    const to = email.trim();
    return to
      ? `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${encodedBody}`
      : `mailto:?subject=${subject}&body=${encodedBody}`;
  }, [body, email]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [body]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-page"
      >
        {open ? "Hide follow-up email" : "Generate follow-up email content"}
      </button>
      {open ? (
        <div className="mt-3 max-w-2xl rounded-lg border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-medium text-ink-secondary">
            Subject: {FOLLOW_UP_EMAIL_SUBJECT}
          </p>
          <textarea
            readOnly
            value={body}
            rows={18}
            className="w-full resize-y rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-page"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={mailto}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Open in email
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
