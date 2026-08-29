/**
 * Shared item-label deep link format for admin print + mobile scan.
 * Keep in sync with Pahincho mobile: app/helpers/itemLabelLink.ts
 *
 * Prefer HTTPS App Links so camera scans open the app directly
 * (custom pahincho:// schemes often show Android's "Open with" chooser).
 *
 *   https://www.pahincho.com/q/{itemId}
 */
export const ITEM_LABEL_HTTPS_ORIGIN = "https://www.pahincho.com";
export const ITEM_LABEL_PATH_PREFIX = "q";
export const ITEM_LABEL_SCHEME = "pahincho";

export function buildItemLabelDeepLink(itemId: string): string {
  const id = encodeURIComponent(itemId.trim());
  return `${ITEM_LABEL_HTTPS_ORIGIN}/${ITEM_LABEL_PATH_PREFIX}/${id}`;
}

/** Fallback custom-scheme link (used by the web bridge page). */
export function buildItemLabelCustomSchemeLink(itemId: string): string {
  const id = encodeURIComponent(itemId.trim());
  return `${ITEM_LABEL_SCHEME}:///${ITEM_LABEL_PATH_PREFIX}/${id}`;
}

/** Network QR image (no npm dep). Fine for admin print preview. */
export function buildItemLabelQrImageUrl(itemId: string, size = 280): string {
  const data = buildItemLabelDeepLink(itemId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&margin=10&data=${encodeURIComponent(data)}`;
}

export function shortItemCode(itemId: string): string {
  return itemId.length <= 10 ? itemId : `${itemId.slice(0, 6)}…${itemId.slice(-4)}`;
}

/** Neighbor giveaway post for Nextdoor / social — fill title, link, and optional zip. */
export function buildItemGiveawayAdMessage(opts: {
  title: string;
  itemId: string;
  zipCode?: string | null;
  ownerWillingToDropoff?: boolean;
}): string {
  const title = opts.title.trim() || "this item";
  const deepLink = buildItemLabelDeepLink(opts.itemId);
  const zip = opts.zipCode?.trim() || null;

  const lines = [
    `Hi neighbors! I'm giving away a ${title} for free.`,
    "To keep things fair and easy to organize, I put it up on Pahincho (a local neighbor-sharing app).",
    `You can grab it or request it here: ${deepLink}`,
  ];

  if (opts.ownerWillingToDropoff && zip) {
    lines.push(
      `Happy to drop it off if you're within ~5 miles of ${zip}! Looking forward to passing this along to someone nearby.`,
    );
  } else if (opts.ownerWillingToDropoff) {
    lines.push(
      "Happy to drop it off if you're nearby! Looking forward to passing this along to someone nearby.",
    );
  } else {
    lines.push("Looking forward to passing this along to someone nearby.");
  }

  return lines.join("\n");
}
