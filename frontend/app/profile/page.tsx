import React from 'react'

export default function ProfilePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User Profile</h2>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 text-xl font-bold">
            U
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Authorized User</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">admin@cleanisense.org</p>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
          <div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Organization Role</span>
            <p className="text-slate-900 dark:text-white font-medium">Municipal Administrator</p>
          </div>
          <div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Account Status</span>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">Active</p>
          </div>
        </div>
      </div>
    </div>
  )
}
