import Link from "next/link";
import React from "react";

const notes = [
  "Sign-in is currently handled through Google authentication.",
  "Citizen flows available today include dashboard, complaints, hotspots, notifications, and preferences.",
  "Unfinished SRS modules are intentionally not exposed in the frontend yet.",
];

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink-strong)]"
        >
          <span aria-hidden="true">{"<-"}</span>
          Back to Sign In
        </Link>

        <div className="space-y-3">
          <p className="page-kicker">Access Notes</p>
          <h2 className="page-title text-3xl">There is no separate account registration flow yet.</h2>
          <p className="page-copy">
            To keep the product aligned with the implemented backend, account access currently starts with
            Google sign-in instead of a custom email and password registration form.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {notes.map((note, index) => (
          <div
            key={note}
            className="flex items-start gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4"
          >
            <span className="pill-badge">0{index + 1}</span>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{note}</p>
          </div>
        ))}
      </div>

      <div className="hero-card">
        <div className="space-y-3">
          <p className="metric-label">Next Step</p>
          <h3 className="text-2xl font-semibold text-[color:var(--ink-strong)]">Use the supported entry path</h3>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Continue to the Google sign-in page to access the live citizen portal and the complaint workflows.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="primary-action">
            Go to Sign In
          </Link>
          <Link href="/" className="secondary-action">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
