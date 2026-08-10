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
