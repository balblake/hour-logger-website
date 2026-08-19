import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-14">
      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden px-6 lg:block">
          <Link className="brand" href="/">
            <BrandLogo className="brand-mark" />
            <span>Hour Logger</span>
          </Link>
          <p className="mt-12 max-w-md text-sm font-bold uppercase tracking-[0.16em] text-[var(--purple-600)]">
            Flexible experience tracker
          </p>
          <h2 className="mt-4 max-w-lg text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-[var(--purple-950)]">
            Every hour, contact, and story—kept together.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-[var(--muted)]">
            Log sessions in hours and minutes, keep organization details connected, and
            see your progress add up automatically.
          </p>
        </section>

        <section className="mx-auto w-full max-w-lg rounded-[26px] border border-[var(--line)] bg-white/95 p-6 shadow-[var(--shadow-lg)] sm:p-9">
          <Link className="brand mb-8 lg:hidden" href="/">
            <BrandLogo className="brand-mark" />
            <span>Hour Logger</span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--purple-600)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--purple-950)]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
