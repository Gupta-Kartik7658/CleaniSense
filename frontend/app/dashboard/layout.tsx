"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center space-x-2 mb-8">
            <span className="text-xl font-bold text-emerald-600">CleaniSense</span>
          </div>
          <nav className="space-y-2">
            <Link href="/dashboard" className="block py-2.5 px-4 rounded-xl text-sm font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/complaints" className="block py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors">
              Complaints
            </Link>
            <Link href="/hotspots" className="block py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors">
              Hotspots
            </Link>
            <Link href="/profile" className="block py-2.5 px-4 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors">
              Profile
            </Link>
          </nav>
        </div>
        <div>
          <button
            onClick={() => logout()}
            className="w-full text-left block py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Municipal Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{user.name || user.email}</span>
            {user.profile_picture && (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
              />
            )}
          </div>
        </header>
        <main className="p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
