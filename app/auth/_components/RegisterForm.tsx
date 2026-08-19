"use client";

import Link from "next/link";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthNotice } from "./AuthNotice";

const PASSWORD_MIN_LENGTH = 8;

export function RegisterForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");

    if (password !== confirmation) {
      setError("The two passwords do not match.");
      setPending(false);
      return;
    }

    const emailRedirectTo = new URL(
      "/auth/confirm?next=/dashboard",
      window.location.origin,
    ).toString();

    const {
      data: { session },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (signUpError) {
      setError(
        "We could not create the account. Check your information and try again.",
      );
      setPending(false);
      return;
    }

    if (session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setSubmittedEmail(email);
    setPending(false);
  }

  if (submittedEmail) {
    return (
      <div className="signup-confirmation" role="status">
        <span className="signup-confirmation-icon">
          <MailCheck aria-hidden="true" />
        </span>
        <div>
          <span className="page-kicker">ONE MORE STEP</span>
          <h2>Check your email</h2>
          <p>
            We sent a confirmation link to <strong>{submittedEmail}</strong>.
            Open that email and confirm your address before signing in.
          </p>
          <small>
            If it is not in your inbox after a few minutes, check your spam or
            junk folder.
          </small>
        </div>
        <Link className="button button-primary w-full" href="/login">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      {error ? (
        <AuthNotice id="register-error" tone="error">
          {error}
        </AuthNotice>
      ) : null}

      <div className="form-field">
        <label htmlFor="register-email">Email address</label>
        <input
          aria-describedby={error ? "register-error" : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="email"
          id="register-email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="form-field">
        <div className="password-label-row">
          <label htmlFor="register-password">Password</label>
          <button
            aria-controls="register-password register-password-confirmation"
            aria-pressed={showPasswords}
            className="password-visibility-toggle"
            onClick={() => setShowPasswords((current) => !current)}
            type="button"
          >
            {showPasswords ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>
        </div>
        <input
          aria-describedby="register-password-hint"
          autoComplete="new-password"
          id="register-password"
          minLength={PASSWORD_MIN_LENGTH}
          name="password"
          required
          type={showPasswords ? "text" : "password"}
        />
        <span className="field-hint" id="register-password-hint">
          Use at least {PASSWORD_MIN_LENGTH} characters.
        </span>
      </div>

      <div className="form-field">
        <label htmlFor="register-password-confirmation">Confirm password</label>
        <input
          aria-describedby={error ? "register-error" : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          id="register-password-confirmation"
          minLength={PASSWORD_MIN_LENGTH}
          name="passwordConfirmation"
          required
          type={showPasswords ? "text" : "password"}
        />
      </div>

      <div className="signup-email-reminder" role="note">
        <MailCheck size={20} aria-hidden="true" />
        <div>
          <strong>You will need to check your email</strong>
          <span>
            After creating your account, open the confirmation message we send
            before trying to sign in.
          </span>
        </div>
      </div>

      <button
        aria-disabled={pending}
        className="button button-primary mt-1 w-full"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link className="text-link" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
