import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimComments } from "@/components/ClaimComments";
import { ClaimForm } from "@/components/ClaimForm";
import { DeleteClaimButton } from "@/components/DeleteClaimButton";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminClaimById, listClaimComments } from "@/lib/claims";
import { CLAIM_STATUS_LABELS } from "@/lib/claimTypes";
import { adminClaimTone } from "@/lib/statusTone";
import { updateClaimAction } from "../actions";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [claim, comments] = await Promise.all([getAdminClaimById(id), listClaimComments(id)]);
  if (!claim) notFound();

  const boundUpdate = updateClaimAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/claims" className="mb-4 inline-block text-sm text-accent hover:underline">
        ← Claims
      </Link>

      <div className="mb-6">
        <p className="mb-1 font-mono text-xs text-ink-muted">{claim.claimNumber}</p>
        <h1 className="mb-2 text-lg font-semibold text-ink-primary">{claim.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={adminClaimTone(claim.status)} label={CLAIM_STATUS_LABELS[claim.status]} />
            <span className="text-sm text-ink-secondary">
              {claim.firstName} {claim.lastName} · {claim.email}
            </span>
            {claim.userId ? (
              <Link
                href={`/users/${claim.userId}`}
                className="text-sm text-accent hover:underline"
              >
                View user
              </Link>
            ) : null}
          </div>
        <p className="mt-2 text-xs text-ink-muted">
          Created {claim.createdAt ? new Date(claim.createdAt).toLocaleString() : "—"}
          {claim.createdBy ? ` by ${claim.createdBy}` : ""}
          {claim.updatedAt
            ? ` · Updated ${new Date(claim.updatedAt).toLocaleString()}${claim.updatedBy ? ` by ${claim.updatedBy}` : ""}`
            : ""}
        </p>
        {claim.confirmationEmailSentAt ? (
          <p className="mt-1 text-xs text-good">
            Confirmation email sent {new Date(claim.confirmationEmailSentAt).toLocaleString()}
          </p>
        ) : claim.confirmationEmailError ? (
          <p className="mt-1 text-xs text-critical">
            Confirmation email not sent: {claim.confirmationEmailError}
          </p>
        ) : null}
      </div>

      <Card className="mb-8 p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-primary">Claim details</h2>
        <ClaimForm
          action={boundUpdate}
          initial={claim}
          submitLabel="Save changes"
          secondaryAction={<DeleteClaimButton claimId={claim.id} />}
        />
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-primary">Comments</h2>
        <Card className="p-5">
          <ClaimComments claimId={claim.id} comments={comments} />
        </Card>
      </div>
    </div>
  );
}
