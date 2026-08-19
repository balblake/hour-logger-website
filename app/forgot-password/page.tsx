import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/_components/AuthShell";
import { RecoveryForm } from "@/app/auth/_components/RecoveryForm";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="We will email you a six-digit code. Verify it here, then choose a new password."
      eyebrow="Account recovery"
      title="Reset your password"
    >
      <RecoveryForm />
    </AuthShell>
  );
}
