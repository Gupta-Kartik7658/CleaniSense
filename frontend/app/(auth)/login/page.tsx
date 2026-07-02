import React from 'react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="text-center">
      <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Sign in to CleaniSense
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Hyperlocal Community Pollution Monitoring
      </p>
      <div className="mt-8 space-y-6">
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <input
              type="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 placeholder-slate-500 text-slate-900 dark:text-white rounded-t-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm bg-transparent"
              placeholder="Email address"
            />
          </div>
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 placeholder-slate-500 text-slate-900 dark:text-white rounded-b-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm bg-transparent"
              placeholder="Password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
          Register here
        </Link>
      </p>
    </div>
  )
}
