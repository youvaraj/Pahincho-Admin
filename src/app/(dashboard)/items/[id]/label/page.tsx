import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemById, getUserById } from "@/lib/queries";
import { ItemLabelPrint } from "@/components/ItemLabelPrint";

export const dynamic = "force-dynamic";

export default async function ItemLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemById(id);
  if (!item) notFound();

  const owner = item.ownerId ? await getUserById(item.ownerId) : null;
  const ownerFirstName = owner?.firstName?.trim() || null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print">
        <Link
          href={`/items/${item.itemId}`}
          className="text-sm text-ink-secondary hover:text-ink-primary"
        >
          ← Back to item
        </Link>
        <h1 className="mt-4 text-lg font-semibold text-ink-primary">Print item label</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Unique QR for this listing. Owners open manage/history; borrowers open received
          detail; everyone else opens the public item page.
        </p>
      </div>

      <div className="mt-6">
        <ItemLabelPrint
          itemId={item.itemId}
          title={item.title}
          listedAt={item.listedAt}
          ownerFirstName={ownerFirstName}
          zipCode={item.zipCode}
          ownerWillingToDropoff={item.ownerWillingToDropoff}
        />
      </div>
    </div>
  );
}
