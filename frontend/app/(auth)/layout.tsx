import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.7fr)]">
        <section className="hidden space-y-6 lg:block">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--brand-strong)] text-sm font-semibold text-white">
              CS
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--ink-strong)]">CleaniSense</p>
              <p className="text-xs text-[color:var(--ink-soft)]">Citizen reporting portal</p>
            </div>
          </Link>

          <div className="space-y-4">
            <p className="page-kicker">Access</p>
            <h1 className="page-title max-w-xl text-4xl">A calmer interface for real local reporting.</h1>
            <p className="page-copy max-w-xl">
              The active frontend is focused on complaint submission, status tracking, nearby hotspots,
              notifications, and personal preferences. Sign in and continue directly into those working screens.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="section-card">
              <p className="metric-label">What works</p>
              <p className="mt-3 text-base font-semibold text-[color:var(--ink-strong)]">Citizen complaint workflow</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                Create reports, attach evidence, track the audit trail, and review resolution outcomes.
              </p>
            </div>
            <div className="section-card">
              <p className="metric-label">What changed</p>
              <p className="mt-3 text-base font-semibold text-[color:var(--ink-strong)]">Only implemented flows are surfaced</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                No placeholder municipal dashboards or speculative prediction screens are shown here yet.
              </p>
            </div>
          </div>
        </section>

        <section className="auth-card border-[color:var(--line)] bg-[color:var(--surface)] p-8">{children}</section>
      </div>
    </div>
  );
}
