"use client";

import React, { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent. Check your inbox for the secure link.");
    } catch (err: any) {
      setError(err?.message || "Unable to send reset email. Please check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-900">
      <div className="flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>←</span>
          <span>Back to Sign In</span>
        </Link>
      </div>

      <div className="text-center space-y-2 pt-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Reset Password
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
          Enter your registered email and Firebase will send a secure reset link.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650 font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="text-xs font-bold text-slate-700 block">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@example.com"
          className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors text-xs cursor-pointer"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
