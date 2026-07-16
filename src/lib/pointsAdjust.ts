import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";

export type AdjustPointsResult = {
  previousBalance: number;
  newBalance: number;
  amount: number;
};

/**
 * Atomically adjusts a user's points and appends a ledger row in
 * `points_transactions` (Admin SDK — same collections the RN app uses).
 * Does not touch the Pahincho Cloud Functions codebase.
 */
export async function adjustUserPoints(params: {
  userId: string;
  amount: number;
  adminEmail: string;
}): Promise<AdjustPointsResult> {
  const { userId, amount, adminEmail } = params;
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("Enter a non-zero points amount.");
  }
  if (!Number.isInteger(amount)) {
    throw new Error("Points amount must be a whole number.");
  }

  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("User not found.");

    const data = snap.data() ?? {};
    const previousBalance = typeof data.points === "number" ? data.points : 0;
    const newBalance = previousBalance + amount;
    if (newBalance < 0) {
      throw new Error(`Cannot go below 0 points (current balance is ${previousBalance}).`);
    }

    const update: Record<string, unknown> = {
      points: newBalance,
      updatedAt: FieldValue.serverTimestamp(),
      lastActivityAt: FieldValue.serverTimestamp(),
    };
    if (amount > 0) {
      const earned = typeof data.totalPointsEarned === "number" ? data.totalPointsEarned : 0;
      update.totalPointsEarned = earned + amount;
    }

    tx.update(userRef, update);
    return { previousBalance, newBalance, amount };
  });

  await db.collection("points_transactions").add({
    userId,
    type: amount >= 0 ? "bonus" : "penalty",
    category: "by admin",
    amount,
    balance: result.newBalance,
    description: "Override or update pinchos by Support admin",
    relatedItemId: null,
    relatedItemTitle: null,
    otherPartyUserId: null,
    otherPartyName: null,
    metadata: {
      source: "pahincho-admin",
      adjustedBy: adminEmail,
      previousBalance: result.previousBalance,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  return result;
}
