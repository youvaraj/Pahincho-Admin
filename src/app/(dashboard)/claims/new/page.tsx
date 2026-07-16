import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimForm } from "@/components/ClaimForm";
import { Card } from "@/components/Card";
import { getUserById } from "@/lib/queries";
import { createClaimAction } from "../actions";

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  const user = userId ? await getUserById(userId) : null;
  if (userId && !user) notFound();

  const prefill = user
    ? {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={user ? `/users/${user.userId}` : "/claims"}
        className="mb-4 inline-block text-sm text-accent hover:underline"
      >
        ← {user ? `${user.firstName} ${user.lastName}` : "Claims"}
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-ink-primary">New claim</h1>
      <p className="mb-6 text-sm text-ink-secondary">
        {user
          ? `File a support claim for ${user.firstName} ${user.lastName} (${user.email}).`
          : "Create an admin-managed claim ticket for follow-up with a claimer."}
      </p>
      <Card className="p-5">
        <ClaimForm action={createClaimAction} prefill={prefill} submitLabel="Create claim" />
      </Card>
    </div>
  );
}
