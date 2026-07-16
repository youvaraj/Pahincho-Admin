import "server-only";

import { FieldValue, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import {
  generateClaimNumber,
  isClaimStatus,
  type AdminClaimRow,
  type ClaimCommentRow,
  type ClaimInput,
  type ClaimStatus,
} from "./claimTypes";

export type {
  AdminClaimRow,
  ClaimCommentRow,
  ClaimInput,
  ClaimStatus,
} from "./claimTypes";
export {
  CLAIM_STATUSES,
  CLAIM_STATUS_LABELS,
  generateClaimNumber,
  isClaimStatus,
  normalizeClaimInput,
} from "./claimTypes";

function toIso(value: unknown): string | null {
  const ts = value as { toDate?: () => Date } | undefined;
  return ts && typeof ts.toDate === "function" ? ts.toDate().toISOString() : null;
}

function toClaimRow(doc: QueryDocumentSnapshot<DocumentData>): AdminClaimRow {
  const d = doc.data();
  return {
    id: doc.id,
    claimNumber: typeof d.claimNumber === "string" && d.claimNumber ? d.claimNumber : doc.id,
    userId: typeof d.userId === "string" && d.userId ? d.userId : null,
    firstName: typeof d.firstName === "string" ? d.firstName : "",
    lastName: typeof d.lastName === "string" ? d.lastName : "",
    email: typeof d.email === "string" ? d.email : "",
    title: typeof d.title === "string" ? d.title : "",
    details: typeof d.details === "string" ? d.details : "",
    status: isClaimStatus(d.status) ? d.status : "new",
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
    createdBy: typeof d.createdBy === "string" ? d.createdBy : null,
    updatedBy: typeof d.updatedBy === "string" ? d.updatedBy : null,
    confirmationEmailSentAt: toIso(d.confirmationEmailSentAt),
    confirmationEmailError:
      typeof d.confirmationEmailError === "string" ? d.confirmationEmailError : null,
  };
}

function toCommentRow(doc: QueryDocumentSnapshot<DocumentData>): ClaimCommentRow {
  const d = doc.data();
  return {
    id: doc.id,
    body: typeof d.body === "string" ? d.body : "",
    authorEmail: typeof d.authorEmail === "string" ? d.authorEmail : "",
    createdAt: toIso(d.createdAt),
  };
}

export async function listAdminClaims(status?: ClaimStatus | "all"): Promise<AdminClaimRow[]> {
  const snap = await getAdminDb().collection("claims").orderBy("createdAt", "desc").limit(100).get();
  const rows = snap.docs.map(toClaimRow);
  if (!status || status === "all") return rows;
  return rows.filter((row) => row.status === status);
}

/** Admin support claims for a specific user (in-memory filter to avoid composite indexes). */
export async function listAdminClaimsForUser(userId: string): Promise<AdminClaimRow[]> {
  const snap = await getAdminDb().collection("claims").orderBy("createdAt", "desc").limit(100).get();
  return snap.docs.map(toClaimRow).filter((row) => row.userId === userId);
}

export async function getAdminClaimById(id: string): Promise<AdminClaimRow | null> {
  const doc = await getAdminDb().collection("claims").doc(id).get();
  if (!doc.exists) return null;
  return toClaimRow(doc as QueryDocumentSnapshot<DocumentData>);
}

export type CreatedClaim = {
  id: string;
  claimNumber: string;
};

export async function createAdminClaim(
  input: ClaimInput,
  adminEmail: string
): Promise<CreatedClaim> {
  const claimNumber = generateClaimNumber();
  const ref = await getAdminDb().collection("claims").add({
    ...input,
    userId: input.userId,
    claimNumber,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: adminEmail,
    updatedBy: adminEmail,
    confirmationEmailSentAt: null,
    confirmationEmailError: null,
  });
  return { id: ref.id, claimNumber };
}

export async function recordClaimConfirmationEmailResult(
  id: string,
  result: { ok: true; providerId: string } | { ok: false; error: string }
): Promise<void> {
  const ref = getAdminDb().collection("claims").doc(id);
  if (result.ok) {
    await ref.update({
      confirmationEmailSentAt: FieldValue.serverTimestamp(),
      confirmationEmailError: null,
      confirmationEmailProviderId: result.providerId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  await ref.update({
    confirmationEmailSentAt: null,
    confirmationEmailError: result.error.slice(0, 500),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updateAdminClaim(
  id: string,
  input: ClaimInput,
  adminEmail: string
): Promise<void> {
  const ref = getAdminDb().collection("claims").doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Claim not found.");

  // Preserve existing userId if the form didn't send one (e.g. edit without changing link).
  const existingUserId = doc.data()?.userId;
  const userId =
    input.userId ??
    (typeof existingUserId === "string" && existingUserId ? existingUserId : null);

  await ref.update({
    ...input,
    userId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: adminEmail,
  });
}

export async function deleteAdminClaim(id: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection("claims").doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Claim not found.");

  const commentsSnap = await ref.collection("comments").get();
  const batch = db.batch();
  for (const comment of commentsSnap.docs) batch.delete(comment.ref);
  batch.delete(ref);
  await batch.commit();
}

export async function listClaimComments(claimId: string): Promise<ClaimCommentRow[]> {
  const snap = await getAdminDb()
    .collection("claims")
    .doc(claimId)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .limit(200)
    .get();
  return snap.docs.map(toCommentRow);
}

export async function addClaimComment(
  claimId: string,
  body: string,
  adminEmail: string
): Promise<void> {
  const claimRef = getAdminDb().collection("claims").doc(claimId);
  const claim = await claimRef.get();
  if (!claim.exists) throw new Error("Claim not found.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  await claimRef.collection("comments").add({
    body: trimmed,
    authorEmail: adminEmail,
    createdAt: FieldValue.serverTimestamp(),
  });

  await claimRef.update({
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: adminEmail,
  });
}
