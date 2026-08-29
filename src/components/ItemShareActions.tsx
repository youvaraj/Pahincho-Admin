"use client";

import { useCallback, useState } from "react";
import {
  buildItemGiveawayAdMessage,
  buildItemLabelDeepLink,
} from "@/lib/itemLabel";

type Props = {
  itemId: string;
  title: string;
  zipCode?: string | null;
  ownerWillingToDropoff?: boolean;
  className?: string;
};

export function ItemShareActions({
  itemId,
  title,
  zipCode,
  ownerWillingToDropoff,
  className,
}: Props) {
  const [copied, setCopied] = useState<"link" | "ad" | null>(null);

  const copy = useCallback(async (text: string, kind: "link" | "ad") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }, []);

  const deepLink = buildItemLabelDeepLink(itemId);
  const adMessage = buildItemGiveawayAdMessage({
    title,
    itemId,
    zipCode,
    ownerWillingToDropoff,
  });

  const buttonClass =
    "rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary hover:bg-page";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => copy(deepLink, "link")}
        className={buttonClass}
      >
        {copied === "link" ? "Copied link" : "Copy deep link"}
      </button>
      <button
        type="button"
        onClick={() => copy(adMessage, "ad")}
        className={buttonClass}
      >
        {copied === "ad" ? "Copied message" : "Copy ad message"}
      </button>
    </div>
  );
}
