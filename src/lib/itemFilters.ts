export const ITEM_STATUSES = [
  "available",
  "pending_pickup",
  "rented",
  "given",
  "lost_by_borrower",
  "removed",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type ItemDropoffFilter = "all" | "yes" | "no";

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  available: "Available",
  pending_pickup: "Pending pickup",
  rented: "Rented",
  given: "Given",
  lost_by_borrower: "Lost by borrower",
  removed: "Removed",
};

export type ItemListFilters = {
  status?: ItemStatus | "all";
  dropoff?: ItemDropoffFilter;
};

export function isItemStatus(value: string): value is ItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value);
}

export function isItemDropoffFilter(value: string): value is ItemDropoffFilter {
  return value === "all" || value === "yes" || value === "no";
}
