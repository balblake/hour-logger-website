"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthNotice } from "./AuthNotice";

type RecoveryStage = "request" | "verify" | "update";

const PASSWORD_MIN_LENGTH = 8;

export function RecoveryForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [stage, setStage] = useState<RecoveryStage>("request");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function requestCode(address: string) {
    const redirectTo = new URL(
      "/forgot-password",
      window.location.origin,
    ).toString();

    return supabase.auth.resetPasswordForEmail(address, { redirectTo });
  }

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const address = String(formData.get("email") ?? "").trim();
    const { error: requestError } = await requestCode(address);

    if (requestError) {
      setError(
        "We could not send a code right now. Wait a moment and try again.",
      );
      setPending(false);
      return;
    }

    setEmail(address);
    setMessage(
      "If an account matches that email, a six-digit reset code is on its way.",
    );
    setStage("verify");
    setPending(false);
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const token = String(formData.get("token") ?? "").replace(/\D/g, "");

    if (!/^\d{6}$/.test(token)) {
      setError("Enter the six-digit code from the email.");
      setPending(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (verifyError) {
      setError("That code is invalid or has expired. Request a new code.");
      setPending(false);
      return;
    }

    setStage("update");
    setMessage("Code verified. Choose a new password.");
    setPending(false);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");

    if (password !== confirmation) {
      setError("The two passwords do not match.");
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        updateError.message ||
          "We could not update the password. Please try another password.",
      );
      setPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setPending(true);

    const { error: resendError } = await requestCode(email);

    if (resendError) {
      setError(
        "We could not send another code yet. Wait a moment and try again.",
      );
      setPending(false);
      return;
    }

    setMessage("A new code was requested. Check your inbox.");
    setPending(false);
  }

  return (
    <div className="grid gap-5">
      {message ? <AuthNotice>{message}</AuthNotice> : null}
      {error ? (
        <AuthNotice id="recovery-error" tone="error">
          {error}
        </AuthNotice>
      ) : null}

      {stage === "request" ? (
        <form className="grid gap-5" onSubmit={handleRequest}>
          <div className="form-field">
            <label htmlFor="recovery-email">Email address</label>
            <input
              aria-describedby={error ? "recovery-error" : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="email"
              defaultValue={email}
              id="recovery-email"
              name="email"
              required
              type="email"
            />
          </div>
          <button
            aria-disabled={pending}
            className="button button-primary w-full"
            disabled={pending}
            type="submit"
          >
            {pending ? "Sending code…" : "Send reset code"}
          </button>
        </form>
      ) : null}

      {stage === "verify" ? (
        <form className="grid gap-5" onSubmit={handleVerify}>
          <div className="form-field">
            <label htmlFor="recovery-token">Six-digit code</label>
            <input
              aria-describedby="recovery-code-hint"
              autoComplete="one-time-code"
              id="recovery-token"
              inputMode="numeric"
              maxLength={6}
              name="token"
              pattern="[0-9]{6}"
              required
              type="text"
            />
            <span className="field-hint" id="recovery-code-hint">
              Enter the code sent to {email}.
            </span>
          </div>
          <button
            aria-disabled={pending}
            className="button button-primary w-full"
            disabled={pending}
            type="submit"
          >
            {pending ? "Checking code…" : "Verify code"}
          </button>
          <button
            className="button button-secondary w-full"
            disabled={pending}
            onClick={handleResend}
            type="button"
          >
            Send a new code
          </button>
          <button
            className="button button-quiet w-full"
            disabled={pending}
            onClick={() => {
              setError("");
              setMessage("");
              setStage("request");
            }}
            type="button"
          >
            Change email
          </button>
        </form>
      ) : null}

      {stage === "update" ? (
        <form className="grid gap-5" onSubmit={handleUpdate}>
          <div className="form-field">
            <label htmlFor="recovery-password">New password</label>
            <input
              aria-describedby="recovery-password-hint"
              autoComplete="new-password"
              id="recovery-password"
              minLength={PASSWORD_MIN_LENGTH}
              name="password"
              required
              type="password"
            />
            <span className="field-hint" id="recovery-password-hint">
              Use at least {PASSWORD_MIN_LENGTH} characters.
            </span>
          </div>
          <div className="form-field">
            <label htmlFor="recovery-password-confirmation">
              Confirm new password
            </label>
            <input
              aria-describedby={error ? "recovery-error" : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="new-password"
              id="recovery-password-confirmation"
              minLength={PASSWORD_MIN_LENGTH}
              name="passwordConfirmation"
              required
              type="password"
            />
          </div>
          <button
            aria-disabled={pending}
            className="button button-primary w-full"
            disabled={pending}
            type="submit"
          >
            {pending ? "Updating password…" : "Update password"}
          </button>
        </form>
      ) : null}

      <p className="text-center text-sm text-[var(--muted)]">
        Remembered your password?{" "}
        <Link className="text-link" href="/login">
          Return to sign in
        </Link>
      </p>
    </div>
  );
}
