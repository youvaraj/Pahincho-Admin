"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  FOLLOW_UP_EMAIL_SUBJECT,
  buildFollowUpEmailBody,
} from "@/lib/followUpEmail";

const fieldClass =
  "w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-accent";

export function FollowUpEmailButton({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState(FOLLOW_UP_EMAIL_SUBJECT);
  const [body, setBody] = useState("");

  const fillTemplate = useCallback(() => {
    setSubject(FOLLOW_UP_EMAIL_SUBJECT);
    setBody(buildFollowUpEmailBody(firstName, lastName));
    setCopied(false);
  }, [firstName, lastName]);

  function openModal() {
    fillTemplate();
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setCopied(false);
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [body]);

  const to = email.trim();
  const mailto = `${to ? `mailto:${encodeURIComponent(to)}` : "mailto:"}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={closeModal}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-border px-5 py-4">
                <h3 id={titleId} className="text-sm font-semibold text-ink-primary">
                  Follow-up email
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Edit the template, then copy or open it in your email app.
                </p>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
                <label className="block text-xs font-medium text-ink-secondary" htmlFor="follow-up-subject">
                  Subject
                </label>
                <input
                  id="follow-up-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`mt-1 ${fieldClass}`}
                />

                <label className="mt-3 block text-xs font-medium text-ink-secondary" htmlFor="follow-up-body">
                  Message
                </label>
                <textarea
                  id="follow-up-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={16}
                  className={`mt-1 min-h-64 flex-1 resize-y ${fieldClass}`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={fillTemplate}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-page"
                >
                  Reset to template
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-page"
                  >
                    Close
                  </button>
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
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-page"
      >
        Generate follow-up email content
      </button>
      {dialog}
    </>
  );
}
