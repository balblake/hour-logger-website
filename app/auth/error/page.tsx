import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/app/auth/_components/AuthShell";
import { AuthNotice } from "@/app/auth/_components/AuthNotice";

export const metadata: Metadata = {
  title: "Authentication error",
};

export default function AuthErrorPage() {
  return (
    <AuthShell
      description="The confirmation link may be invalid, expired, or already used."
      eyebrow="We could not verify that"
      title="Please try again"
    >
      <div className="grid gap-5">
        <AuthNotice tone="error">
          Return to sign in, or create a fresh account confirmation or password
          reset request.
        </AuthNotice>
        <Link className="button button-primary w-full" href="/login">
          Return to sign in
        </Link>
        <Link className="button button-secondary w-full" href="/forgot-password">
          Reset password
        </Link>
      </div>
    </AuthShell>
  );
}
