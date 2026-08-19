import type { Metadata } from "next";
import { AuthShell } from "@/app/auth/_components/AuthShell";
import { RegisterForm } from "@/app/auth/_components/RegisterForm";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <AuthShell
      description="Create a private account for your dashboard, logs, organizations, and goals."
      eyebrow="Start tracking"
      title="Create your account"
    >
      <RegisterForm />
    </AuthShell>
  );
}
