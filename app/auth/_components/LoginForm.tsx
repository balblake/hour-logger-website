"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { safeInternalPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/client";
import { AuthNotice } from "./AuthNotice";

type LoginFormProps = {
  initialError?: string;
  initialMessage?: string;
  initialRemembered?: boolean;
  nextPath?: string;
};

export function LoginForm({
  initialError,
  initialMessage,
  initialRemembered = false,
  nextPath,
}: LoginFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "on";

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("The email or password is incorrect. Please try again.");
      setPending(false);
      return;
    }

    await fetch("/auth/remember", {
      body: JSON.stringify({ remember }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => null);

    router.replace(safeInternalPath(nextPath));
    router.refresh();
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      {initialMessage ? <AuthNotice>{initialMessage}</AuthNotice> : null}
      {error ? (
        <AuthNotice id="login-error" tone="error">
          {error}
        </AuthNotice>
      ) : null}

      <div className="form-field">
        <label htmlFor="login-email">Email address</label>
        <input
          aria-describedby={error ? "login-error" : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="email"
          id="login-email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="form-field">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="login-password">Password</label>
          <Link className="text-link text-xs" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <input
          aria-describedby={error ? "login-error" : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="current-password"
          id="login-password"
          name="password"
          required
          type="password"
        />
      </div>

      <label className="remember-me-row" htmlFor="login-remember">
        <input
          defaultChecked={initialRemembered}
          id="login-remember"
          name="remember"
          type="checkbox"
        />
        <span>Remember me on this device</span>
      </label>

      <button
        aria-disabled={pending}
        className="button button-primary mt-1 w-full"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-[var(--muted)]">
        New to Hour Logger?{" "}
        <Link className="text-link" href="/register">
          Create an account
        </Link>
      </p>
    </form>
  );
}
