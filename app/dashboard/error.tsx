"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="portal-error-page">
      <BrandLogo className="brand-mark" />
      <h1>Your dashboard could not be opened.</h1>
      <p>
        The starter may still need its Supabase database setup or environment
        values. Try again after those are connected.
      </p>
      <div>
        <button className="button button-primary" type="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button-secondary" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
