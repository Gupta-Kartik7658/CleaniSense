"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Validate session redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* Top Header Navigation */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-150">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-full flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                CS
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">CleaniSense</span>
            </Link>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest pl-2 border-l border-slate-200 dark:border-slate-800 hidden sm:inline-block">
              Citizen Portal
            </span>
          </div>

          {/* Navigation Links in Header */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Dashboard</Link>
            <Link href="/complaints" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Complaints</Link>
            <Link href="/hotspots" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Hotspots</Link>
            <Link href="/profile" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">Profile</Link>
          </nav>

          {/* Right Header items */}
          <div className="flex items-center space-x-6">
            
            {/* Notifications Badge */}
            <div className="relative cursor-pointer hover:opacity-85 transition-opacity">
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-extrabold leading-none border border-white">
                3
              </span>
            </div>

            {/* Profile Avatar and Name */}
            <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-850 pl-6">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-8 h-8 bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-full flex items-center justify-center">
                  {user.name ? user.name.substring(0, 2).toUpperCase() : "US"}
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 hidden md:inline-block">
                {user.name || user.email}
              </span>
            </div>

            {/* Sign Out Action Button */}
            <button
              onClick={() => logout()}
              className="text-xs font-bold text-slate-500 hover:text-red-650 dark:text-slate-400 dark:hover:text-red-400 transition-colors border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Panel Content Container (Centered 1400px limit) */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 md:px-8 py-8">
        {children}
      </main>

    </div>
  );
}
