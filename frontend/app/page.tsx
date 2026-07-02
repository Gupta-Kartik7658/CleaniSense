import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-8 md:p-16">
      <header className="flex justify-between items-center max-w-7xl w-full mx-auto">
        <span className="text-2xl font-bold tracking-tight text-emerald-400">CleaniSense</span>
        <div className="space-x-4">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white px-4 py-2 rounded-xl transition-colors">
            Register
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto text-center space-y-8 my-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-350 to-cyan-400">
          Hyperlocal Pollution Monitoring & Hotspot Detection
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Empowering communities to report local pollution hazards, using computer vision and environmental analytics to help cities prioritize response efforts.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/register" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-555 py-3 px-8 rounded-xl font-medium text-lg shadow-lg hover:shadow-emerald-500/20 transition-all">
            Get Started
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 py-3 px-8 rounded-xl font-medium text-lg border border-slate-700 transition-colors">
            View Live Map
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 max-w-7xl w-full mx-auto">
        &copy; {new Date().getFullYear()} CleaniSense. Built for modern municipal intelligence.
      </footer>
    </div>
  )
}
