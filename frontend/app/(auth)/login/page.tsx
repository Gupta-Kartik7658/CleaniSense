"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(err?.message || "Failed to authenticate with Google. Please try again.");
    }
  };

  return (
    <div className="text-center">
      {/* Logo/Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-extrabold text-2xl tracking-tighter">
          CS
        </div>
      </div>
      
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        CleaniSense
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
        Hyperlocal Community Pollution Monitoring & Hotspot Prediction
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-8 space-y-4">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="group relative w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.57h3.31c1.94,-1.78 3.06,-4.42 3.06,-7.47c0,-0.64 -0.06,-1.27 -0.17,-1.9Z" fill="#4285F4" />
                <path d="M12,20.7c2.43,0 4.47,-0.8 5.96,-2.19l-3.31,-2.57c-0.92,0.62 -2.1,0.98 -3.53,0.98c-2.71,0 -5.01,-1.83 -5.83,-4.29H1.89v2.66c1.49,2.97 4.56,5.01 8.11,5.01Z" fill="#34A853" />
                <path d="M6.17,12.63c-0.21,-0.62 -0.33,-1.28 -0.33,-1.96c0,-0.68 0.12,-1.34 0.33,-1.96V6.05H1.89C1.24,7.35 0.88,8.83 0.88,10.4c0,1.57 0.36,3.05 1.01,4.35l3.31,-2.66c-0.21,-0.62 -0.33,-1.28 -0.33,-1.96Z" fill="#FBBC05" />
                <path d="M12,5.2c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.42,1.6 12,1.6C8.45,1.6 5.38,3.64 3.89,6.61l4.29,3.31c0.82,-2.46 3.12,-4.29 5.83,-4.29Z" fill="#EA4335" />
              </g>
            </svg>
          )}
          <span>{loading ? "Connecting..." : "Continue with Google"}</span>
        </button>
      </div>

      <div className="mt-8 text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-xs mx-auto">
        By continuing, you agree to CleaniSense&apos;s environmental reporting and authentication terms.
      </div>
    </div>
  );
}
