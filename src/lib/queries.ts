import "server-only";

import type {
  DocumentData,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

function toIso(value: unknown): string | null {
  const ts = value as Timestamp | undefined;
  return ts && typeof ts.toDate === "function" ? ts.toDate().toISOString() : null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Firestore's prefix-range trick: `` sorts after virtually every real character. */
function prefixRange(field: string, value: string) {
  return { field, from: value, to: value + "" };
}

async function count(query: Query): Promise<number> {
  const snap = await query.count().get();
  return snap.data().count;
}

export type PageResult<T> = { rows: T[]; nextCursor: string | null };

/**
 * Cursor-based pagination (Firestore `startAfter`) for the unfiltered browse view —
 * offset pagination isn't viable at scale since Firestore would have to read and
 * discard every prior doc. `cursorId` is the last-seen doc's id; we re-fetch that doc
 * to get a snapshot `startAfter` can use for the same `orderBy` field.
 */
async function getPage<T>(
  collection: string,
  orderByField: string,
  toRow: (doc: QueryDocumentSnapshot<DocumentData>) => T,
  cursorId: string | undefined,
  limitN: number
): Promise<PageResult<T>> {
  const db = getAdminDb();
  let query = db.collection(collection).orderBy(orderByField, "desc").limit(limitN) as Query<DocumentData>;

  if (cursorId) {
    const cursorDoc = await db.collection(collection).doc(cursorId).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const snap = await query.get();
  const rows = snap.docs.map(toRow);
  const nextCursor = snap.docs.length === limitN ? snap.docs[snap.docs.length - 1].id : null;
  return { rows, nextCursor };
}

/** Cheap server-side aggregation count (no docs fetched) — for page-header totals. */
export async function getUsersCount(): Promise<number> {
  return count(getAdminDb().collection("users"));
}

export async function getItemsCount(): Promise<number> {
  return count(getAdminDb().collection("items"));
}

/**
 * Penalty.status only ever has "pending" | "paid" | "escalated" written in practice
 * (confirmed against the Pahincho1 app source) — "pending_payment"/"disputed" are
 * declared in the type but never actually persisted. A live dispute shows up as
 * `disputedAt` being set instead. So "open" penalties = escalated OR disputed,
 * fetched as two queries and de-duped (Firestore has no native OR).
 */
async function getOpenPenaltyDocs(limitN: number): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  const [escalatedSnap, disputedSnap] = await Promise.all([
    getAdminDb().collection("penalties").where("status", "==", "escalated").limit(limitN).get(),
    getAdminDb().collection("penalties").where("disputedAt", "!=", null).limit(limitN).get(),
  ]);
  const byId = new Map<string, QueryDocumentSnapshot<DocumentData>>();
  for (const doc of [...escalatedSnap.docs, ...disputedSnap.docs]) byId.set(doc.id, doc);
  return Array.from(byId.values());
}

async function getActiveRentalDocs(limitN: number): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  const snap = await getAdminDb()
    .collection("transactions")
    .where("status", "==", "active_rental")
    .limit(limitN)
    .get();
  return snap.docs;
}

function isDocOverdue(doc: QueryDocumentSnapshot<DocumentData>): boolean {
  const due = doc.data().currentDueDate as Timestamp | undefined;
  return !!due && typeof due.toDate === "function" && due.toDate() < new Date();
}

export type Kpis = {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  totalItems: number;
  newItems7d: number;
  newItems30d: number;
  totalTransactions: number;
  openClaims: number;
  frozenAccounts: number;
  overdueRentals: number;
  itemsGiven: number;
  itemsBorrowed: number;
};

export async function getKpis(): Promise<Kpis> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    totalItems,
    newItems7d,
    newItems30d,
    totalTransactions,
    frozenAccounts,
    openPenaltyDocs,
    disputedRequests,
    activeRentalDocs,
    itemsGiven,
    itemsBorrowed,
  ] = await Promise.all([
    count(getAdminDb().collection("users")),
    count(getAdminDb().collection("users").where("createdAt", ">=", sevenDaysAgo)),
    count(getAdminDb().collection("users").where("createdAt", ">=", thirtyDaysAgo)),
    count(getAdminDb().collection("items")),
    count(getAdminDb().collection("items").where("listedAt", ">=", sevenDaysAgo)),
    count(getAdminDb().collection("items").where("listedAt", ">=", thirtyDaysAgo)),
    count(getAdminDb().collection("transactions")),
    count(getAdminDb().collection("users").where("isAccountFrozen", "==", true)),
    getOpenPenaltyDocs(200),
    count(getAdminDb().collection("requests").where("status", "in", ["disputed", "escalated"])),
    getActiveRentalDocs(500),
    count(getAdminDb().collection("items").where("status", "==", "given")),
    count(getAdminDb().collection("items").where("status", "==", "rented")),
  ]);

  return {
    totalUsers,
    newUsers7d,
    newUsers30d,
    totalItems,
    newItems7d,
    newItems30d,
    totalTransactions,
    openClaims: openPenaltyDocs.length + disputedRequests,
    frozenAccounts,
    overdueRentals: activeRentalDocs.filter(isDocOverdue).length,
    itemsGiven,
    itemsBorrowed,
  };
}

export type UserRow = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  accountStatus: string;
  isAccountFrozen: boolean;
  unresolvedPenaltyAmount: number;
  listedItemCount: number;
  borrowedItemCount: number;
  points: number;
  rating: number;
  createdAt: string | null;
};

function toUserRow(doc: QueryDocumentSnapshot<DocumentData>): UserRow {
  const d = doc.data();
  return {
    userId: doc.id,
    firstName: d.firstName ?? "",
    lastName: d.lastName ?? "",
    email: d.email ?? "",
    accountStatus: d.accountStatus ?? "unknown",
    isAccountFrozen: !!d.isAccountFrozen,
    unresolvedPenaltyAmount: d.unresolvedPenaltyAmount ?? 0,
    listedItemCount: d.listedItemCount ?? 0,
    borrowedItemCount: d.borrowedItemCount ?? 0,
    points: d.points ?? 0,
    rating: d.rating ?? 0,
    createdAt: toIso(d.createdAt),
  };
}

/**
 * Search by email, first name, or last name (prefix match — Firestore range queries
 * can't do substring/full-text search), falling back to an exact userId lookup.
 * Name fields aren't stored lowercase, so both the as-typed and capitalized casing
 * are tried for firstName/lastName.
 */
export async function searchUsers(term: string): Promise<UserRow[]> {
  const trimmed = term.trim();
  const db = getAdminDb();

  if (!trimmed) {
    const snap = await db.collection("users").orderBy("createdAt", "desc").limit(25).get();
    return snap.docs.map(toUserRow);
  }

  const capitalized = capitalize(trimmed);
  const ranges = [
    prefixRange("email", trimmed.toLowerCase()),
    prefixRange("firstName", trimmed),
    prefixRange("firstName", capitalized),
    prefixRange("lastName", trimmed),
    prefixRange("lastName", capitalized),
  ];

  const snaps = await Promise.all(
    ranges.map((r) =>
      db.collection("users").where(r.field, ">=", r.from).where(r.field, "<=", r.to).limit(25).get()
    )
  );

  const byId = new Map<string, UserRow>();
  for (const snap of snaps) {
    for (const doc of snap.docs) byId.set(doc.id, toUserRow(doc));
  }
  if (byId.size > 0) return Array.from(byId.values()).slice(0, 25);

  const doc = await db.collection("users").doc(trimmed).get();
  return doc.exists ? [toUserRow(doc as QueryDocumentSnapshot<DocumentData>)] : [];
}

export async function getUserById(userId: string): Promise<UserRow | null> {
  const doc = await getAdminDb().collection("users").doc(userId).get();
  return doc.exists ? toUserRow(doc as QueryDocumentSnapshot<DocumentData>) : null;
}

/** Paginated, unfiltered browse of the users collection (see `getPage`). */
export async function getUsersPage(cursorId?: string, limitN = 25): Promise<PageResult<UserRow>> {
  return getPage("users", "createdAt", toUserRow, cursorId, limitN);
}

export type ItemRow = {
  itemId: string;
  title: string;
  description: string;
  condition: string;
  estimatedValue: number;
  ownerId: string;
  status: string;
  pointsToAcquire: number;
  pointsToRent: number;
  currentBorrowerId: string | null;
  listedAt: string | null;
};

function toItemRow(doc: QueryDocumentSnapshot<DocumentData>): ItemRow {
  const d = doc.data();
  return {
    itemId: doc.id,
    title: d.title ?? "",
    description: d.description ?? "",
    condition: d.condition ?? "unknown",
    estimatedValue: d.estimatedValue ?? 0,
    ownerId: d.ownerId ?? "",
    status: d.status ?? "unknown",
    pointsToAcquire: d.pointsToAcquire ?? 0,
    pointsToRent: d.pointsToRent ?? 0,
    currentBorrowerId: d.currentBorrowerId ?? null,
    listedAt: toIso(d.listedAt),
  };
}

/**
 * Search by title prefix, then itemId, then owner userId; if none of those hit, fall
 * back to an in-memory substring scan (title + description) over the most recent 300
 * items. Firestore range queries only support prefix matching, so this is the
 * pragmatic way to cover "search by description" at the current catalog size — move
 * to Algolia/Typesense if the catalog grows past a few thousand items.
 */
export async function searchItems(term: string): Promise<ItemRow[]> {
  const trimmed = term.trim();
  const db = getAdminDb();

  if (!trimmed) {
    const snap = await db.collection("items").orderBy("listedAt", "desc").limit(25).get();
    return snap.docs.map(toItemRow);
  }

  const titleRange = prefixRange("title", trimmed);
  const titleSnap = await db
    .collection("items")
    .where("title", ">=", titleRange.from)
    .where("title", "<=", titleRange.to)
    .limit(25)
    .get();
  if (!titleSnap.empty) return titleSnap.docs.map(toItemRow);

  const byId = await db.collection("items").doc(trimmed).get();
  if (byId.exists) return [toItemRow(byId as QueryDocumentSnapshot<DocumentData>)];

  const byOwner = await db.collection("items").where("ownerId", "==", trimmed).limit(25).get();
  if (!byOwner.empty) return byOwner.docs.map(toItemRow);

  const lower = trimmed.toLowerCase();
  const recentSnap = await db.collection("items").orderBy("listedAt", "desc").limit(300).get();
  return recentSnap.docs
    .map(toItemRow)
    .filter(
      (item) => item.title.toLowerCase().includes(lower) || item.description.toLowerCase().includes(lower)
    )
    .slice(0, 25);
}

export async function getItemById(itemId: string): Promise<ItemRow | null> {
  const doc = await getAdminDb().collection("items").doc(itemId).get();
  return doc.exists ? toItemRow(doc as QueryDocumentSnapshot<DocumentData>) : null;
}

/** Paginated, unfiltered browse of the items collection (see `getPage`). */
export async function getItemsPage(cursorId?: string, limitN = 25): Promise<PageResult<ItemRow>> {
  return getPage("items", "listedAt", toItemRow, cursorId, limitN);
}

export async function getItemsForOwner(userId: string, limitN = 50): Promise<ItemRow[]> {
  const snap = await getAdminDb().collection("items").where("ownerId", "==", userId).limit(limitN).get();
  return snap.docs.map(toItemRow).sort((a, b) => (b.listedAt ?? "").localeCompare(a.listedAt ?? ""));
}

export type TransactionStatus =
  | "pending_approval"
  | "pending_pickup"
  | "active_pickup"
  | "active_rental"
  | "completed_get"
  | "completed_return_on_time"
  | "completed_return_late"
  | "voided"
  | "defaulted_lost"
  | "defaulted_lost_by_borrower"
  | "defaulted_damaged_by_borrower"
  | "defaulted_not_returned"
  | "disputed"
  | "escalated";

export type TransactionRow = {
  transactionId: string;
  itemId: string;
  ownerId: string;
  borrowerId: string;
  transactionType: "get" | "borrow";
  status: TransactionStatus;
  pointsExchanged: number;
  pickupDate: string | null;
  currentDueDate: string | null;
  returnedDate: string | null;
  completionDate: string | null;
  createdAt: string | null;
  collateralHeld: number;
  collateralRefunded: boolean;
  lateFeePoints: number;
  extensionCount: number;
  penaltyReason: string | null;
  disputeReason: string | null;
  borrowerRating: number | null;
  ownerRating: number | null;
};

function toTransactionRow(doc: QueryDocumentSnapshot<DocumentData>): TransactionRow {
  const d = doc.data();
  return {
    transactionId: doc.id,
    itemId: d.itemId ?? "",
    ownerId: d.ownerId ?? "",
    borrowerId: d.borrowerId ?? "",
    transactionType: d.transactionType ?? "borrow",
    status: d.status ?? "pending_approval",
    pointsExchanged: d.pointsExchanged ?? 0,
    pickupDate: toIso(d.pickupDate),
    currentDueDate: toIso(d.currentDueDate),
    returnedDate: toIso(d.returnedDate),
    completionDate: toIso(d.completionDate),
    createdAt: toIso(d.createdAt),
    collateralHeld: d.collateralHeld ?? 0,
    collateralRefunded: !!d.collateralRefunded,
    lateFeePoints: d.lateFeePoints ?? 0,
    extensionCount: d.extensionCount ?? 0,
    penaltyReason: d.penaltyReason ?? null,
    disputeReason: d.disputeDetails?.disputeReason ?? null,
    borrowerRating: d.borrowerRating ?? null,
    ownerRating: d.ownerRating ?? null,
  };
}

const TRANSACTION_STATUS_GROUPS = {
  active: ["pending_approval", "pending_pickup", "active_pickup", "active_rental"],
  completed: ["completed_get", "completed_return_on_time", "completed_return_late"],
  disputed: ["disputed", "escalated"],
} as const;

export type TransactionFilter = "all" | "active" | "overdue" | "completed" | "disputed";

/**
 * Real server-side ordering + `startAfter` cursor for every filter, so paging stays
 * cheap no matter how large the `transactions` collection grows — never fetch-then-
 * sort-in-memory across the whole collection. This does mean "active"/"completed"/
 * "disputed" (status `in` + orderBy createdAt) and "overdue" (status == + currentDueDate
 * range + orderBy currentDueDate) need one composite index each — Firestore surfaces a
 * direct console link the first time each shape runs; that's a normal one-time setup
 * step, not a bug. "all" needs no index (single-field orderBy).
 */
export async function getTransactions(
  filter: TransactionFilter,
  cursorId?: string,
  limitN = 25
): Promise<PageResult<TransactionRow>> {
  const db = getAdminDb();
  const transactions = db.collection("transactions");

  let query: Query<DocumentData>;
  if (filter === "overdue") {
    query = transactions
      .where("status", "==", "active_rental")
      .where("currentDueDate", "<", new Date())
      .orderBy("currentDueDate", "asc")
      .limit(limitN);
  } else if (filter === "all") {
    query = transactions.orderBy("createdAt", "desc").limit(limitN);
  } else {
    query = transactions
      .where("status", "in", TRANSACTION_STATUS_GROUPS[filter])
      .orderBy("createdAt", "desc")
      .limit(limitN);
  }

  if (cursorId) {
    const cursorDoc = await transactions.doc(cursorId).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const snap = await query.get();
  const rows = snap.docs.map(toTransactionRow);
  const nextCursor = snap.docs.length === limitN ? snap.docs[snap.docs.length - 1].id : null;
  return { rows, nextCursor };
}

export async function getTransactionsAsBorrower(userId: string, limitN = 50): Promise<TransactionRow[]> {
  const snap = await getAdminDb()
    .collection("transactions")
    .where("borrowerId", "==", userId)
    .limit(limitN)
    .get();
  return snap.docs.map(toTransactionRow).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getTransactionsAsOwner(userId: string, limitN = 50): Promise<TransactionRow[]> {
  const snap = await getAdminDb().collection("transactions").where("ownerId", "==", userId).limit(limitN).get();
  return snap.docs.map(toTransactionRow).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getTransactionsForItem(itemId: string, limitN = 50): Promise<TransactionRow[]> {
  const snap = await getAdminDb().collection("transactions").where("itemId", "==", itemId).limit(limitN).get();
  return snap.docs.map(toTransactionRow).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export type ClaimRow = {
  id: string;
  kind: "penalty" | "request" | "transaction";
  status: string;
  userId: string | null;
  relatedUserIds: string[];
  itemId: string | null;
  transactionId: string | null;
  reason: string | null;
  amount: number | null;
  createdAt: string | null;
};

/** Merges open penalties, disputed/escalated requests, and disputed/escalated transactions into one feed. */
export async function getClaims(): Promise<ClaimRow[]> {
  const [penaltyDocs, requestsSnap, transactionsSnap] = await Promise.all([
    getOpenPenaltyDocs(50),
    getAdminDb().collection("requests").where("status", "in", ["disputed", "escalated"]).limit(50).get(),
    getAdminDb()
      .collection("transactions")
      .where("status", "in", TRANSACTION_STATUS_GROUPS.disputed)
      .limit(50)
      .get(),
  ]);

  const penalties: ClaimRow[] = penaltyDocs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      kind: "penalty",
      status: d.status,
      userId: d.userId ?? null,
      relatedUserIds: d.userId ? [d.userId] : [],
      itemId: d.itemId ?? null,
      transactionId: d.transactionId ?? null,
      reason: d.disputeReason ?? d.penaltyReason ?? null,
      amount: d.penaltyAmount ?? null,
      createdAt: toIso(d.createdAt),
    };
  });

  const requests: ClaimRow[] = requestsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      kind: "request",
      status: d.status,
      userId: d.fromUserId ?? null,
      relatedUserIds: [d.fromUserId, d.ownerId].filter(Boolean),
      itemId: d.itemId ?? null,
      transactionId: d.transactionId ?? null,
      reason: d.disputeDetails?.disputeReason ?? null,
      amount: null,
      createdAt: toIso(d.createdAt),
    };
  });

  const transactions: ClaimRow[] = transactionsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      kind: "transaction",
      status: d.status,
      userId: d.disputeDetails?.disputedBy ?? d.borrowerId ?? null,
      relatedUserIds: [d.ownerId, d.borrowerId].filter(Boolean),
      itemId: d.itemId ?? null,
      transactionId: doc.id,
      reason: d.disputeDetails?.disputeReason ?? null,
      amount: null,
      createdAt: toIso(d.createdAt),
    };
  });

  return [...penalties, ...requests, ...transactions].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );
}

export async function getClaimsForUser(userId: string): Promise<ClaimRow[]> {
  const claims = await getClaims();
  return claims.filter((c) => c.relatedUserIds.includes(userId));
}

export async function getClaimsForItem(itemId: string): Promise<ClaimRow[]> {
  const claims = await getClaims();
  return claims.filter((c) => c.itemId === itemId);
}

export type PointsTransactionType = "earned" | "spent" | "bonus" | "penalty" | "refund" | "purchase";

/**
 * `points_transactions` is a ledger written only by Cloud Functions (client writes
 * are denied by Firestore rules) — one doc per points-affecting event, each carrying
 * the signed `amount` and the user's running `balance` right after that event, so the
 * admin view doesn't need to recompute a running total.
 */
export type PointsTransactionRow = {
  id: string;
  type: PointsTransactionType;
  category: string;
  amount: number;
  balance: number;
  description: string;
  relatedItemId: string | null;
  relatedItemTitle: string | null;
  otherPartyUserId: string | null;
  otherPartyName: string | null;
  createdAt: string | null;
};

function toPointsTransactionRow(doc: QueryDocumentSnapshot<DocumentData>): PointsTransactionRow {
  const d = doc.data();
  return {
    id: doc.id,
    type: d.type ?? "earned",
    category: d.category ?? "other",
    amount: d.amount ?? 0,
    balance: d.balance ?? 0,
    description: d.description ?? "",
    relatedItemId: d.relatedItemId ?? null,
    relatedItemTitle: d.relatedItemTitle ?? null,
    otherPartyUserId: d.otherPartyUserId ?? null,
    otherPartyName: d.otherPartyName ?? null,
    createdAt: toIso(d.createdAt),
  };
}

export async function getPointsTransactionsForUser(userId: string, limitN = 100): Promise<PointsTransactionRow[]> {
  const snap = await getAdminDb()
    .collection("points_transactions")
    .where("userId", "==", userId)
    .limit(limitN)
    .get();
  return snap.docs
    .map(toPointsTransactionRow)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
