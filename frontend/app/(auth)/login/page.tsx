"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

const currentAccess = [
  "Google sign-in",
  "Citizen dashboard",
  "Complaint submission and history",
  "Hotspots, alerts, and preferences",
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: any) {
      console.error("Authentication popup login failure:", err);
      setError(err?.message || "Failed to establish secure connection. Please try again.");
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--ink-soft)] transition hover:text-[color:var(--ink-strong)]"
        >
          <span aria-hidden="true">{"<-"}</span>
          Back to Home
        </Link>

        <div className="space-y-3">
          <p className="page-kicker">Sign In</p>
          <h2 className="page-title text-3xl">Continue into the citizen workspace</h2>
          <p className="page-copy">
            Sign in with Google to open the active CleaniSense portal. This route connects to the backend
            session flow already used across the dashboard and complaint APIs.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {currentAccess.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4 text-sm text-[color:var(--ink)]"
          >
            {item}
          </div>
        ))}
      </div>

      {error ? <div className="note-danger">{error}</div> : null}

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="primary-action w-full justify-center"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-xs font-semibold text-[color:var(--ink-strong)]">
            G
          </span>
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        <p className="fine-print text-center">
          CleaniSense currently supports Google-based access for the citizen portal.
        </p>
      </div>

      <div className="soft-divider" />

      <div className="flex flex-col gap-3 text-sm text-[color:var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        <span>Need context before signing in?</span>
        <div className="flex gap-3">
          <Link href="/register" className="ghost-action">
            Access Details
          </Link>
          <Link href="/hotspots" className="ghost-action">
            View Hotspots
          </Link>
        </div>
      </div>
    </div>
  );
}
