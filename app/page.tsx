import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Grid3X3,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const previewCategories = [
  {
    name: "Volunteer",
    time: "0 hrs",
    goal: "100 hrs",
    color: "#b3538c",
  },
  {
    name: "Clinical",
    time: "0 hrs",
    goal: "100 hrs",
    color: "#7763b2",
  },
  {
    name: "Shadowing",
    time: "0 hrs",
    goal: "50 hrs",
    color: "#d19a3e",
  },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">
          <BrandLogo className="brand-mark" />
          <span>Hour Logger</span>
        </Link>
        <div className="landing-actions">
          <Link className="button button-quiet" href="/login">
            Sign in
          </Link>
          <Link className="button button-primary" href="/register">
            Create account
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            Made for all the hours that matter
          </div>
          <h1>Your experience hours, finally in one calm place.</h1>
          <p>
            Log hours and minutes as quickly as a spreadsheet, keep organization contacts
            connected, and see every category roll up into a clear dashboard.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/register">
              Start tracking free
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link className="text-link" href="/login">
              I already have an account
            </Link>
          </div>
          <div className="trust-row">
            <span>
              <LockKeyhole size={15} aria-hidden="true" />
              Your records stay private
            </span>
            <span>
              <CheckCircle2 size={15} aria-hidden="true" />
              Create any category
            </span>
          </div>
        </div>

        <div className="dashboard-preview" aria-label="Dashboard preview">
          <div className="preview-topbar">
            <div>
              <span className="preview-kicker">EXPERIENCE OVERVIEW</span>
              <h2>Hours dashboard</h2>
            </div>
            <span className="preview-chip">This year</span>
          </div>

          <div className="preview-cards">
            {previewCategories.map((category) => (
              <article
                className="preview-card"
                key={category.name}
                style={{ "--category-color": category.color } as React.CSSProperties}
              >
                <span>{category.name}</span>
                <strong>{category.time}</strong>
                <small>goal {category.goal}</small>
              </article>
            ))}
          </div>

          <div className="preview-total">
            <div>
              <span>Total experience</span>
              <strong>0 hrs</strong>
            </div>
            <div className="preview-ring" aria-hidden="true">
              <Clock3 size={22} />
            </div>
          </div>

          <div className="preview-progress">
            <div className="preview-progress-head">
              <span>Category</span>
              <span>Progress</span>
            </div>
            {previewCategories.map((category) => (
              <div className="preview-progress-row" key={category.name}>
                <span className="preview-category-name">
                  <i style={{ backgroundColor: category.color }} />
                  {category.name}
                </span>
                <span className="preview-track">
                  <i style={{ backgroundColor: category.color, width: "3%" }} />
                </span>
                <strong>0%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="feature-strip" aria-label="Product features">
        <article>
          <CalendarDays aria-hidden="true" />
          <div>
            <h2>Fast session logging</h2>
            <p>Date picker, notes, role, hours, and minutes in one clean row.</p>
          </div>
        </article>
        <article>
          <Grid3X3 aria-hidden="true" />
          <div>
            <h2>Spreadsheet familiar</h2>
            <p>Editable tables without the alignment and formula headaches.</p>
          </div>
        </article>
        <article>
          <Sparkles aria-hidden="true" />
          <div>
            <h2>Smart organization fields</h2>
            <p>Select a place and its saved contact and role fill themselves in.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
