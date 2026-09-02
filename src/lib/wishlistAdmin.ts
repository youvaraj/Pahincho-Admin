import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './firebaseAdmin';

/** Hard-delete wishlist docs and decrement each poster's `wishlistCount`. */
export async function deleteWishlistItems(wishlistIds: string[]): Promise<number> {
  const unique = [...new Set(wishlistIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return 0;

  const db = getAdminDb();
  const refs = unique.map((id) => db.collection('wishlist').doc(id));
  const snaps = await db.getAll(...refs);

  const userDecrements = new Map<string, number>();
  const batch = db.batch();
  let deleted = 0;

  for (const snap of snaps) {
    if (!snap.exists) continue;
    const userId = snap.data()?.userId;
    if (typeof userId === 'string' && userId) {
      userDecrements.set(userId, (userDecrements.get(userId) ?? 0) + 1);
    }
    batch.delete(snap.ref);
    deleted += 1;
  }

  if (deleted === 0) return 0;

  const userIds = [...userDecrements.keys()];
  const existingUserIds = new Set<string>();
  if (userIds.length > 0) {
    const userSnaps = await db.getAll(...userIds.map((id) => db.collection('users').doc(id)));
    for (const userSnap of userSnaps) {
      if (userSnap.exists) existingUserIds.add(userSnap.id);
    }
  }

  for (const [userId, count] of userDecrements) {
    if (!existingUserIds.has(userId)) continue;
    batch.update(db.collection('users').doc(userId), {
      wishlistCount: FieldValue.increment(-count),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  return deleted;
}
