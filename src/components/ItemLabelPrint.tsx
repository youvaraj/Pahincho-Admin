"use client";

import { useCallback } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { ItemShareActions } from "@/components/ItemShareActions";
import {
  buildItemLabelQrImageUrl,
  shortItemCode,
} from "@/lib/itemLabel";

type Props = {
  itemId: string;
  title: string;
  listedAt?: string | null;
  ownerFirstName?: string | null;
  zipCode?: string | null;
  ownerWillingToDropoff?: boolean;
};

/** Physical label size for wireless/Bluetooth thermal printers */
const LABEL_WIDTH_IN = 3;
const LABEL_HEIGHT_IN = 2;

/** Short posted date, e.g. "Aug 2 '26" */
function formatPostedShort(listedAt?: string | null): string | null {
  if (!listedAt) return null;
  const d = new Date(listedAt);
  if (Number.isNaN(d.getTime())) return null;
  const mon = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon} ${day} '${yy}`;
}

export function ItemLabelPrint({
  itemId,
  title,
  listedAt,
  ownerFirstName,
  zipCode,
  ownerWillingToDropoff,
}: Props) {
  // Dense QR for small thermal labels (~1.15" square)
  const qrUrl = buildItemLabelQrImageUrl(itemId, 220);
  const posted = formatPostedShort(listedAt);
  const owner = ownerFirstName?.trim() || null;

  const onPrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrint}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Print label (3″ × 2″)
        </button>
        <ItemShareActions
          itemId={itemId}
          title={title}
          zipCode={zipCode}
          ownerWillingToDropoff={ownerWillingToDropoff}
        />
        <p className="text-xs text-ink-muted">
          Sized for 3″ × 2″ thermal labels. In the print dialog, set paper/label to 3×2
          and margins to none / minimum.
        </p>
      </div>

      {/* Screen preview matches print size */}
      <div
        className="label-sheet mx-auto overflow-hidden rounded-md border border-border bg-white text-center shadow-sm"
        style={{
          width: `${LABEL_WIDTH_IN}in`,
          height: `${LABEL_HEIGHT_IN}in`,
          padding: "0.12in",
          boxSizing: "border-box",
        }}
      >
        <div className="flex h-full items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR code for item ${itemId}`}
            width={220}
            height={220}
            className="label-qr shrink-0 object-contain"
            style={{ width: "1.35in", height: "1.35in" }}
          />
          <div className="min-w-0 flex-1 text-left">
            <div className="label-brand flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE_PATH}/logo-black.png`}
                alt=""
                className="h-[10px] w-auto shrink-0 object-contain"
              />
              <p className="text-[9px] font-normal uppercase tracking-wide leading-none text-ink-muted">
                Pahincho
              </p>
            </div>
            <h1 className="label-title mt-1.5 text-[12px] font-semibold leading-tight text-ink-primary line-clamp-3">
              {title || "Untitled item"}
            </h1>
            {owner ? (
              <p className="label-owner mt-1 text-[9px] font-normal leading-tight text-ink-muted">
                Owner: {owner}
              </p>
            ) : null}
            <p className="label-code mt-1 font-mono text-[10px] font-normal leading-tight text-ink-secondary">
              {shortItemCode(itemId)}
            </p>
            {posted ? (
              <p className="label-posted text-[9px] font-normal leading-tight text-ink-muted">
                Posted: {posted}
              </p>
            ) : null}
            <p className="label-hint text-[8px] font-normal leading-tight text-ink-muted">
              Scan to open in app
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .label-sheet,
          .label-sheet * {
            visibility: visible !important;
          }
          .label-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${LABEL_WIDTH_IN}in !important;
            height: ${LABEL_HEIGHT_IN}in !important;
            max-width: ${LABEL_WIDTH_IN}in !important;
            max-height: ${LABEL_HEIGHT_IN}in !important;
            margin: 0 !important;
            padding: 0.1in !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: ${LABEL_WIDTH_IN}in ${LABEL_HEIGHT_IN}in;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
