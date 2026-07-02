import React from 'react'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar Placeholder */}
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
          <Link href="/login" className="block py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Municipal Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Authorized User</span>
          </div>
        </header>
        <main className="p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
