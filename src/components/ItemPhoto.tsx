"use client";

import { useState } from "react";

export function ItemPhoto({
  imageUrl,
  title,
  itemId,
}: {
  imageUrl: string;
  title: string;
  itemId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Could not fetch image.");
      const blob = await res.blob();
      const ext = blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
          ? "webp"
          : "jpg";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${(title || itemId).replace(/[^\w.-]+/g, "_").slice(0, 40)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Storage CORS often blocks fetch — open the original URL instead.
      setError("Opening image in a new tab — save it from there if download is blocked.");
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[220px] shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title || "Item photo"}
        className="aspect-square w-full rounded-xl border border-border object-cover bg-page"
      />
      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-page disabled:opacity-60"
      >
        {busy ? "Downloading…" : "Download photo"}
      </button>
      {error ? <p className="mt-1 text-xs text-ink-muted">{error}</p> : null}
    </div>
  );
}
