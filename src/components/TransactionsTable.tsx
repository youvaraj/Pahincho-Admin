"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TransactionFilter, TransactionRow } from "@/lib/queries";
import { isTransactionOverdue, transactionTone } from "@/lib/statusTone";
import { StatusBadge } from "./StatusBadge";
import { Card } from "./Card";

const HEADERS = ["", "Item", "Owner", "Borrower", "Type", "Status", "Points", "Due", "Created"];

function DetailRow({ t }: { t: TransactionRow }) {
  return (
    <tr className="border-b border-border bg-page last:border-0">
      <td colSpan={HEADERS.length} className="px-4 py-4">
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-ink-muted">Transaction ID</dt>
            <dd className="font-mono text-xs text-ink-secondary">{t.transactionId}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Pickup date</dt>
            <dd className="text-ink-secondary">
              {t.pickupDate ? new Date(t.pickupDate).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Returned date</dt>
            <dd className="text-ink-secondary">
              {t.returnedDate ? new Date(t.returnedDate).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Completed</dt>
            <dd className="text-ink-secondary">
              {t.completionDate ? new Date(t.completionDate).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Collateral held</dt>
            <dd className="text-ink-secondary">
              {t.collateralHeld} {t.collateralHeld > 0 && (t.collateralRefunded ? "(refunded)" : "(not refunded)")}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Late fee points</dt>
            <dd className="text-ink-secondary">{t.lateFeePoints}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Extensions</dt>
            <dd className="text-ink-secondary">{t.extensionCount}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Ratings (borrower / owner)</dt>
            <dd className="text-ink-secondary">
              {t.borrowerRating ?? "—"} / {t.ownerRating ?? "—"}
            </dd>
          </div>
          {t.penaltyReason && (
            <div className="col-span-2">
              <dt className="text-ink-muted">Penalty reason</dt>
              <dd className="text-ink-secondary">{t.penaltyReason}</dd>
            </div>
          )}
          {t.disputeReason && (
            <div className="col-span-2">
              <dt className="text-ink-muted">Dispute reason</dt>
              <dd className="text-ink-secondary">{t.disputeReason}</dd>
            </div>
          )}
        </dl>
      </td>
    </tr>
  );
}

export function TransactionsTable({
  transactions,
  filter,
}: {
  transactions: TransactionRow[];
  filter: TransactionFilter;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-ink-secondary">
          <tr>
            {HEADERS.map((h, i) => (
              <th key={h || i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const isOpen = expanded.has(t.transactionId);
            const overdue = filter !== "overdue" && isTransactionOverdue(t);
            return (
              <Fragment key={t.transactionId}>
                <tr
                  onClick={() => toggle(t.transactionId)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-page"
                >
                  <td className="px-4 py-3 text-ink-muted">
                    {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/items/${t.itemId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent hover:underline"
                    >
                      {t.itemId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/users/${t.ownerId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent hover:underline"
                    >
                      {t.ownerId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/users/${t.borrowerId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent hover:underline"
                    >
                      {t.borrowerId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{t.transactionType}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      tone={overdue ? "warning" : transactionTone(t.status)}
                      label={overdue ? "overdue" : t.status}
                    />
                  </td>
                  <td className="px-4 py-3">{t.pointsExchanged}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {t.currentDueDate ? new Date(t.currentDueDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
                {isOpen && <DetailRow t={t} />}
              </Fragment>
            );
          })}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={HEADERS.length} className="px-4 py-6 text-center text-ink-muted">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
