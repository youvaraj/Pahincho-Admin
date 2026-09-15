"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ITEM_STATUSES,
  ITEM_STATUS_LABELS,
  type ItemDropoffFilter,
  type ItemStatus,
} from "@/lib/itemFilters";

const selectClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft";

function itemsHref(opts: {
  q?: string;
  status?: ItemStatus | "all";
  dropoff?: ItemDropoffFilter;
}): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.dropoff && opts.dropoff !== "all") params.set("dropoff", opts.dropoff);
  const qs = params.toString();
  return qs ? `/items?${qs}` : "/items";
}

export function ItemsFilters({
  q,
  status,
  dropoff,
}: {
  q: string;
  status: ItemStatus | "all";
  dropoff: ItemDropoffFilter;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(next: { status: ItemStatus | "all"; dropoff: ItemDropoffFilter }) {
    startTransition(() =>
      router.replace(itemsHref({ q, ...next }), { scroll: false }),
    );
  }

  return (
    <div className={`flex flex-wrap items-end gap-3 ${isPending ? "opacity-70" : ""}`}>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-secondary">Status</span>
        <select
          value={status}
          onChange={(e) =>
            navigate({
              status: e.target.value as ItemStatus | "all",
              dropoff,
            })
          }
          className={selectClass}
        >
          <option value="all">All</option>
          {ITEM_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ITEM_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink-secondary">Drop-off</span>
        <select
          value={dropoff}
          onChange={(e) =>
            navigate({
              status,
              dropoff: e.target.value as ItemDropoffFilter,
            })
          }
          className={selectClass}
        >
          <option value="all">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
    </div>
  );
}
