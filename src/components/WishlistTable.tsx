"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteWishlistItemsAction,
  type DeleteWishlistState,
} from "@/app/(dashboard)/wishlist/actions";
import type { WishlistRowWithUser } from "@/lib/queries";
import { wishlistPriorityTone, wishlistStatusTone } from "@/lib/statusTone";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/Card";
import { useActionToast } from "@/components/Toast";

function userLabel(row: WishlistRowWithUser): string {
  const name = `${row.userFirstName} ${row.userLastName}`.trim();
  if (name) return name;
  if (row.userEmail) return row.userEmail;
  return row.userId || "—";
}

export function WishlistTable({ rows }: { rows: WishlistRowWithUser[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteWishlistItemsAction,
    {} as DeleteWishlistState,
  );
  useActionToast(state);

  const rowIds = useMemo(() => rows.map((r) => r.wishlistId), [rows]);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  useEffect(() => {
    if (state.success) {
      setSelected(new Set());
      setConfirmOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(rowIds);
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rowIds]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rowIds));
    }
  }

  const selectedRows = rows.filter((r) => selected.has(r.wishlistId));

  return (
    <>
      {someSelected && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-secondary">
            {selected.size} selected
          </p>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
            className="rounded-md border border-critical/30 bg-critical/10 px-3 py-1.5 text-sm font-medium text-critical hover:bg-critical/15 disabled:opacity-60"
          >
            Delete selected
          </button>
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-ink-secondary">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={rows.length === 0 || pending}
                  aria-label="Select all on this page"
                  className="h-4 w-4 rounded border-border accent-accent"
                />
              </th>
              <th className="px-4 py-3 font-medium">Wish</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Posted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr
                key={w.wishlistId}
                className="border-b border-border last:border-0 hover:bg-page"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(w.wishlistId)}
                    onChange={() => toggleOne(w.wishlistId)}
                    disabled={pending}
                    aria-label={`Select ${w.itemTitle || "wishlist entry"}`}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-primary">{w.itemTitle || "—"}</p>
                  {w.description ? (
                    <p
                      className="mt-0.5 max-w-md truncate text-xs text-ink-muted"
                      title={w.description}
                    >
                      {w.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {w.userId ? (
                    <Link href={`/users/${w.userId}`} className="text-accent hover:underline">
                      {userLabel(w)}
                    </Link>
                  ) : (
                    "—"
                  )}
                  {w.userEmail && userLabel(w) !== w.userEmail ? (
                    <p className="mt-0.5 text-xs text-ink-muted">{w.userEmail}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={wishlistPriorityTone(w.priority)} label={w.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={wishlistStatusTone(w.status)} label={w.status} />
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  No wishlist entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-wishlist-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg">
            <form action={formAction}>
              {Array.from(selected).map((id) => (
                <input key={id} type="hidden" name="wishlistIds" value={id} />
              ))}
              <h3 id="delete-wishlist-title" className="text-sm font-semibold text-ink-primary">
                Delete wishlist {selected.size === 1 ? "entry" : "entries"}?
              </h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Permanently delete {selected.size}{" "}
                {selected.size === 1 ? "entry" : "entries"}? This cannot be undone.
              </p>
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-ink-secondary">
                {selectedRows.map((w) => (
                  <li key={w.wishlistId} className="truncate">
                    · {w.itemTitle || w.wishlistId}
                    {userLabel(w) !== "—" ? ` (${userLabel(w)})` : ""}
                  </li>
                ))}
              </ul>
              {state.error ? (
                <p className="mt-3 text-sm text-critical" role="alert">
                  {state.error}
                </p>
              ) : null}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={pending}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-page disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-critical px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
