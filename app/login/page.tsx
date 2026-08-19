import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/app/auth/_components/AuthShell";
import { LoginForm } from "@/app/auth/_components/LoginForm";
import { safeInternalPath } from "@/lib/auth/paths";
import { REMEMBER_ME_COOKIE } from "@/lib/auth/remember";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const remembered = cookieStore.get(REMEMBER_ME_COOKIE)?.value === "1";

  if (remembered) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) {
      redirect(safeInternalPath(params.next));
    }
  }

  return (
    <AuthShell
      description="Use the email and password connected to your private experience log."
      eyebrow="Welcome back"
      title="Sign in to your tracker"
    >
      <LoginForm
        initialError={params.error}
        initialMessage={params.message}
        initialRemembered={remembered}
        nextPath={safeInternalPath(params.next)}
      />
    </AuthShell>
  );
}
