// app/(auth)/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async (requestedRole?: string) => {
    setError(null);
    try {
      await login(requestedRole);
    } catch (err: any) {
      console.error("Authentication popup login failure:", err);
      setError(err?.message || "Failed to establish secure connection. Please try again.");
    }
  };

  const GoogleIcon = () => (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <g transform="matrix(1, 0, 0, 1, 0, 0)">
        <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.57h3.31c1.94,-1.78 3.06,-4.42 3.06,-7.47c0,-0.64 -0.06,-1.27 -0.17,-1.9Z" fill="#4285F4" />
        <path d="M12,20.7c2.43,0 4.47,-0.8 5.96,-2.19l-3.31,-2.57c-0.92,0.62 -2.1,0.98 -3.53,0.98c-2.71,0 -5.01,-1.83 -5.83,-4.29H1.89v2.66c1.49,2.97 4.56,5.01 8.11,5.01Z" fill="#34A853" />
        <path d="M6.17,12.63c-0.21,-0.62 -0.33,-1.28 -0.33,-1.96c0,-0.68 0.12,-1.34 0.33,-1.96V6.05H1.89C1.24,7.35 0.88,8.83 0.88,10.4c0,1.57 0.36,3.05 1.01,4.35l3.31,-2.66c-0.21,-0.62 -0.33,-1.28 -0.33,-1.96Z" fill="#FBBC05" />
        <path d="M12,5.2c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.42,1.6 12,1.6C8.45,1.6 5.38,3.64 3.89,6.61l4.29,3.31c0.82,-2.46 3.12,-4.29 5.83,-4.29Z" fill="#EA4335" />
      </g>
    </svg>
  );

  return (
    <div className="w-full space-y-6 text-slate-900 relative">
      
      {/* Top Header / Back Link & Small Admin login button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>←</span>
          <span>Back to Home</span>
        </Link>
        
        <button
          onClick={() => handleGoogleLogin("super_admin")}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
        >
          {loading ? "Please wait..." : "Login as Admin"}
        </button>
      </div>

      {/* Logo/Icon */}
      <div className="text-center space-y-4 pt-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md text-white font-extrabold text-xl">
            CS
          </div>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Sign in to CleaniSense
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
            Every Street Deserves Clean Air. Help build cleaner and healthier communities.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650 font-medium text-center">
          {error}
        </div>
      )}

      {/* Main Login Trigger Container */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => handleGoogleLogin("citizen")}
          disabled={loading}
          type="button"
          className="group w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <GoogleIcon />
          <span>{loading ? "Connecting..." : "Continue with Google"}</span>
        </button>
        <Link
          href="/forgot-password"
          className="block text-center text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <div className="text-[10px] text-slate-400 text-center leading-relaxed">
        This is a secure connection verified by Google Identity Services.<br />
        By signing in, you help build environmental accountability.
      </div>
    </div>
  );
}
