"use client";

import { Loader2, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

/**
 * Debounces input, then does a client-side (no full reload) URL update so the
 * Suspense boundary around the results can stream in a fresh skeleton per term.
 * Clearing the field drops `q` (and paging) but keeps any other list filters.
 */
export function SearchInput({
  initialValue,
  placeholder,
  extraParams,
}: {
  initialValue: string;
  placeholder: string;
  /** Other list filters to keep when the search term changes (paging is reset). */
  extraParams?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialValue);
  const [syncedValue, setSyncedValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the field in sync with the URL (e.g. browser back/forward) without an
  // effect — adjusting state during render, per React's guidance on deriving
  // state from a changed prop.
  if (initialValue !== syncedValue) {
    setSyncedValue(initialValue);
    setValue(initialValue);
  }

  function scheduleNavigate(term: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(extraParams ?? {})) {
        if (value) params.set(key, value);
      }
      const trimmed = term.trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => router.replace(url, { scroll: false }));
    }, 300);
  }

  return (
    <div className="relative w-full max-w-md">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          scheduleNavigate(e.target.value);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-9 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
      />
      {isPending && (
        <Loader2
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-muted"
        />
      )}
    </div>
  );
}
