"use client";

import { useCallback, useState } from "react";
import {
  buildItemLabelDeepLink,
  buildItemLabelQrImageUrl,
  shortItemCode,
} from "@/lib/itemLabel";

type Props = {
  itemId: string;
  title: string;
};

export function ItemLabelPrint({ itemId, title }: Props) {
  const deepLink = buildItemLabelDeepLink(itemId);
  const qrUrl = buildItemLabelQrImageUrl(itemId, 320);
  const [copied, setCopied] = useState(false);

  const onPrint = useCallback(() => {
    window.print();
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [deepLink]);

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrint}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Print label
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-ink-primary hover:bg-page"
        >
          {copied ? "Copied link" : "Copy deep link"}
        </button>
        <p className="text-xs text-ink-muted">
          Stick on the item underside. Scanning opens the right screen in the Pahincho app.
        </p>
      </div>

      <div className="label-sheet mx-auto max-w-sm rounded-xl border border-border bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Pahincho
        </p>
        <h1 className="mt-2 text-base font-semibold text-ink-primary line-clamp-2">
          {title || "Untitled item"}
        </h1>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={`QR code for item ${itemId}`}
          width={320}
          height={320}
          className="mx-auto mt-4 h-64 w-64 object-contain"
        />

        <p className="mt-3 font-mono text-xs text-ink-secondary">
          {shortItemCode(itemId)}
        </p>
        <p className="mt-1 break-all font-mono text-[10px] text-ink-muted">{deepLink}</p>
        <p className="mt-4 text-[11px] text-ink-muted">
          Scan with phone camera — opens Pahincho directly when installed
        </p>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .label-sheet,
          .label-sheet * {
            visibility: visible !important;
          }
          .label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 2.5in;
            border: 1px solid #111 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0.2in !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.25in;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
