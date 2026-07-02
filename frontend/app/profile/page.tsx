"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading } = useAuth();
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
    <div className="max-w-2xl space-y-6 p-8">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User Profile</h2>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
        <div className="flex items-center space-x-4">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="Profile"
              className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 text-xl font-bold">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{user.name || "Authorized User"}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
          <div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Organization Role</span>
            <p className="text-slate-900 dark:text-white font-medium capitalize">{user.role}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Account Status</span>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              {user.is_active ? "Active" : "Suspended"}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Member Since</span>
            <p className="text-slate-900 dark:text-white font-medium">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
