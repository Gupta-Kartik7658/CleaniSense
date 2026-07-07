"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function Home() {
  const { login, loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Monitor scroll offset to transition header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Navigation Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white border-b border-slate-200 shadow-sm py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md text-white font-extrabold text-lg">
              CS
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CleaniSense</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#home" className="hover:text-emerald-600 transition-colors">Home</a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">About</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#contact" className="hover:text-emerald-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                href={
                  user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'municipality_admin' || user.role === 'municipality_officer')
                    ? "/admin"
                    : "/dashboard"
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <button
                onClick={handleLogin}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-36 pb-24 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left panel info */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Every Street Deserves Clean Air.<br />
              <span className="text-emerald-600 text-3xl sm:text-4xl lg:text-5xl font-bold block mt-2">
                Help Build Cleaner and Healthier Communities.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Report environmental issues in your neighborhood in minutes and enable local authorities to identify priority areas through transparent, structured analysis.
            </p>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium max-w-md">
                {authError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              {isAuthenticated ? (
                <Link
                  href={
                    user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'municipality_admin' || user.role === 'municipality_officer')
                      ? "/admin"
                      : "/dashboard"
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-center font-bold text-white py-3.5 px-8 rounded-xl shadow-md transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-center font-bold text-white py-3.5 px-8 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Login</span>
                </button>
              )}
              <a
                href="#how-it-works"
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-center font-bold py-3.5 px-8 rounded-xl transition-all duration-200"
              >
                Explore the Platform
              </a>
            </div>
          </div>

          {/* Right panel - Civic Illustration Mockup */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Public Service Reporting Flow</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              
              {/* Civic Map Blocks Illustration */}
              <div className="h-56 bg-slate-50 rounded-xl relative border border-slate-200 overflow-hidden p-4 flex flex-col justify-between">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Block outlines */}
                <div className="absolute top-6 left-6 w-20 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-bold">Residential</span>
                </div>
                <div className="absolute top-6 right-6 w-24 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-bold">Municipal Hub</span>
                </div>
                <div className="absolute bottom-6 left-12 w-28 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-bold">Green Park 🌱</span>
                </div>

                {/* Flow lines and status pins */}
                <div className="absolute top-[40%] left-[30%] text-xl">👤</div>
                <div className="absolute top-[35%] left-[45%] text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                  Report File ➔
                </div>
                <div className="absolute top-[50%] right-[35%] text-lg">📍</div>
                
                {/* Action card */}
                <div className="z-10 bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-sm text-left max-w-xs mt-auto">
                  <p className="text-[11px] font-bold text-slate-800">Local Waste Dump Logged</p>
                  <p className="text-[9px] text-slate-500">Coordinates Verified • Sent to Municipal Office</p>
                </div>
              </div>

              {/* Progress nodes */}
              <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold text-slate-500">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-xs">1</p>
                  <p>Report</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-xs">2</p>
                  <p>Verify</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-xs">3</p>
                  <p>Alert</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-xs">4</p>
                  <p>Resolve</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-y border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-2xl">🇮🇳</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Built for India</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="text-2xl">🤖</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Assisted</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="text-2xl">📍</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hyperlocal</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="text-2xl">☁️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Google Firebase</span>
          </div>
        </div>
      </section>

      {/* Why This Matters (Problem Statement) */}
      <section className="py-24 px-6 md:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-12 text-left">
          <div className="border-l-4 border-emerald-600 pl-6 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Why This Matters</h2>
            <p className="text-xl text-slate-700 leading-relaxed font-medium">
              Environmental issues often remain unnoticed because local authorities receive delayed or incomplete reports.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 text-sm leading-relaxed">
            <p>
              Citizens observe problems in their neighborhoods every single day—unmanaged trash accumulation, open burning, or local smoke hazards. However, there has historically been no simple, transparent, and structured way to communicate these observations directly to the municipal bodies responsible for resolving them.
            </p>
            <p>
              CleaniSense bridges this gap. By connecting local communities with municipal authorities through a unified, location-verified reporting platform, we transform observations into actionable logs, enabling faster resource allocation and accountability.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center">
            <p className="text-sm font-semibold text-slate-700">
              "With smartphones and public collaboration, local environmental issues can now be logged and resolved faster than ever before."
            </p>
          </div>
        </div>
      </section>

      {/* How CleaniSense Benefits Everyone */}
      <section id="about" className="py-24 px-6 md:px-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">How CleaniSense Benefits Everyone</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Creating mutual value across all civic stakeholders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Citizens card */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl space-y-4 text-left">
              <span className="text-3xl">👤</span>
              <h3 className="text-xl font-bold text-slate-900">Citizens</h3>
              <ul className="space-y-2 text-slate-600 text-xs leading-relaxed">
                <li>• Report environmental issues in minutes</li>
                <li>• Track complaint progress in real-time</li>
                <li>• Receive automatic resolution status updates</li>
                <li>• Actively contribute to a cleaner neighbourhood</li>
              </ul>
            </div>

            {/* Municipal Authorities card */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl space-y-4 text-left">
              <span className="text-3xl">🏛️</span>
              <h3 className="text-xl font-bold text-slate-900">Municipal Authorities</h3>
              <ul className="space-y-2 text-slate-600 text-xs leading-relaxed">
                <li>• Receive structured, coordinate-verified reports</li>
                <li>• Prioritize critical hotspots and safety alerts</li>
                <li>• Monitor recurring neighborhood complaints</li>
                <li>• Significantly improve operational efficiency</li>
              </ul>
            </div>

            {/* Communities & Organizations card */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl space-y-4 text-left">
              <span className="text-3xl">🌱</span>
              <h3 className="text-xl font-bold text-slate-900">Communities & NGOs</h3>
              <ul className="space-y-2 text-slate-600 text-xs leading-relaxed">
                <li>• Identify environmental and safety trends</li>
                <li>• Support local ecological awareness initiatives</li>
                <li>• Promote collaborative local clean-up actions</li>
                <li>• Strengthen overall civic participation and trust</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* From Report to Resolution (Process Section) */}
      <section id="how-it-works" className="py-24 px-6 md:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">From Report to Resolution</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Our 7-step pipeline guarantees verification, structured priority scoring, and municipal dispatch accountability.
            </p>
          </div>

          {/* Horizontal Stepper */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-center">
            {[
              { num: "01", step: "Report Issue" },
              { num: "02", step: "Location Verified" },
              { num: "03", step: "Incident Reviewed" },
              { num: "04", step: "Priority Assessment" },
              { num: "05", step: "Assigned to Municipality" },
              { num: "06", step: "Resolution Updates" },
              { num: "07", step: "Issue Closed" }
            ].map((node, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[90px] relative text-left">
                <span className="text-[10px] font-bold text-slate-400 block">{node.num}</span>
                <p className="text-xs font-extrabold text-slate-800 leading-tight mt-2">{node.step}</p>
                {idx < 6 && (
                  <span className="hidden md:block absolute top-[40%] -right-3 text-slate-300 z-10 font-bold">➔</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Previews Section */}
      <section className="py-24 px-6 md:px-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Previews</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Review live mockups showing actual layout interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Citizen Dashboard Mock */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>Citizen Dashboard Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Active Session</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Submitted</span>
                  <span className="text-xl font-bold text-slate-800">4</span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">In Progress</span>
                  <span className="text-xl font-bold text-slate-800">1</span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Resolved</span>
                  <span className="text-xl font-bold text-emerald-600">3</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-2">
                <p className="text-[10px] font-bold text-slate-700">My Active Incidents</p>
                <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-slate-100 pb-1">
                  <span>Waste Dump #084</span>
                  <span className="text-amber-700">Assigned to Ward-3</span>
                </div>
              </div>
            </div>

            {/* Report Issue Form Mock */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Report Issue Form Preview
              </h3>
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">1. UPLOAD IMAGE</span>
                  <div className="h-10 border border-dashed border-slate-350 rounded flex items-center justify-center text-[9px] text-slate-500 bg-slate-50">
                    📎 Attachment Selected: trash_incident.jpg
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">2. DESCRIPTION</span>
                  <div className="h-8 border border-slate-200 rounded px-2 text-[9px] text-slate-700 bg-slate-50 flex items-center">
                    Garbage piled up near main park gateway...
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Tracking Stepper Mock */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Issue Tracking Status Preview
              </h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center space-x-3 text-[10px] font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">✓</span>
                  <span className="text-slate-800">1. Report Received (Jul 02)</span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">✓</span>
                  <span className="text-slate-800">2. Coordinates & Image Verified</span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-bold">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">⚙</span>
                  <span className="text-blue-800">3. Assigned to Sanitary Officer</span>
                </div>
              </div>
            </div>

            {/* Hotspots Map Mock */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Hotspot Map Pins Preview
              </h3>
              <div className="h-36 bg-white border border-slate-200 rounded-xl relative overflow-hidden p-4 flex flex-col justify-end">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px]"></div>
                
                <div className="absolute top-[25%] left-[30%] flex items-center space-x-1">
                  <span className="text-lg">📍</span>
                  <span className="bg-red-100 text-red-800 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-200">New Delhi #12</span>
                </div>

                <div className="absolute bottom-[20%] right-[25%] flex items-center space-x-1">
                  <span className="text-lg">📍</span>
                  <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-200">Delhi East #05</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* What You Can Do (Capabilities Section) */}
      <section id="features" className="py-24 px-6 md:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">What You Can Do</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Explore your capabilities on the unified CleaniSense dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📝",
                title: "Report Pollution",
                desc: "Upload local environmental incidents with coordinate tracking and details."
              },
              {
                icon: "⏱️",
                title: "Track Complaint Status",
                desc: "Monitor status logs on submitted tickets from intake to municipal closure."
              },
              {
                icon: "🗺️",
                title: "View Environmental Hotspots",
                desc: "Identify critical active pollution clusters dynamically mapped across the city."
              },
              {
                icon: "🔔",
                title: "Receive Resolution Updates",
                desc: "Get automated alerts when municipal teams assign and resolve logged issues."
              },
              {
                icon: "🤝",
                title: "Community Participation",
                desc: "Collaborate with nearby residential associations to manage neighborhood sanitation."
              },
              {
                icon: "📍",
                title: "Location-Based Reporting",
                desc: "Ensure pin-point dispatch accuracy through localized mobile GPS tagging."
              }
            ].map((cap, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl text-left hover:-translate-y-1 transition-all duration-300 space-y-3 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-3xl block mb-2">{cap.icon}</span>
                  <h4 className="text-base font-extrabold text-slate-900 mb-1">{cap.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built Around Transparency (Trust Section) */}
      <section className="py-24 px-6 md:px-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Built Around Transparency</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Features engineered to foster accountability and public trust.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Verified User Authentication", desc: "Every report is linked to a verified citizen account to maintain credibility." },
              { title: "Location Verification", desc: "Reports are processed with precise geographical tags for exact mapping." },
              { title: "Progress Tracking", desc: "Track assignments and resolution notes at every administrative stage." },
              { title: "Priority Based Response", desc: "Critical indicators trigger alert prioritization on authority dashboard feeds." },
              { title: "Community Participation", desc: "Citizens actively contribute to and review local community outcomes." }
            ].map((trust, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-left space-y-2">
                <span className="text-emerald-600 text-lg font-bold block">✓</span>
                <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{trust.title}</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">{trust.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Indicators (Impact Section) */}
      <section className="py-16 bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <span className="text-3xl md:text-4xl font-extrabold block text-emerald-400">1,240+</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mt-2">Reports Submitted</span>
          </div>
          <div>
            <span className="text-3xl md:text-4xl font-extrabold block text-emerald-400">84</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mt-2">Active Hotspots</span>
          </div>
          <div>
            <span className="text-3xl md:text-4xl font-extrabold block text-emerald-400">12</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mt-2">Municipal Zones</span>
          </div>
          <div>
            <span className="text-3xl md:text-4xl font-extrabold block text-emerald-400">1,126</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mt-2">Issues Resolved</span>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-6 md:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Why CleaniSense is Different</h2>
            <p className="text-slate-500 text-sm">
              Contrasting modern digitized community action with traditional legacy systems.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-4 sm:p-6">Feature</th>
                  <th className="p-4 sm:p-6">Traditional Reporting</th>
                  <th className="p-4 sm:p-6 text-emerald-700">CleaniSense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {[
                  { name: "Reporting Interface", old: "Phone Calls / In-Person Paper", new: "Digital Instant Reporting" },
                  { title: "Verification", old: "Manual Inspections Required", new: "Precise GPS Location Verified" },
                  { name: "Tracking Status", old: "No Customer/Public Visibility", new: "Transparent Progress Steppers" },
                  { name: "Prioritization", old: "FIFO (First In First Out)", new: "Automated Priority Score Alerts" },
                  { name: "Telemetry Monitoring", old: "Disconnected Silos", new: "Centralized Municipal Dashboard" }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 sm:p-6 font-bold text-slate-900">{row.name || row.title}</td>
                    <td className="p-4 sm:p-6 text-slate-400">{row.old}</td>
                    <td className="p-4 sm:p-6 font-semibold text-emerald-700 bg-emerald-50/10">{row.new}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white border-t border-slate-200/80 pt-16 pb-12 text-slate-600">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-slate-200 pb-12">
            {/* Branding Column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                  CS
                </div>
                <span className="text-lg font-bold text-slate-900">CleaniSense</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                CleaniSense is a civic platform designed to strengthen collaboration between citizens and municipal authorities by making environmental reporting more transparent, structured, and accessible.
              </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-left">
              <div>
                <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[10px]">Information</h4>
                <ul className="space-y-2">
                  <li><a href="#home" className="hover:underline">Home</a></li>
                  <li><a href="#about" className="hover:underline">About Us</a></li>
                  <li><a href="#how-it-works" className="hover:underline">How It Works</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[10px]">Legal & Trust</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                  <li><a href="#" className="hover:underline">Accessibility</a></li>
                  <li><a href="#" className="hover:underline">Terms of Service</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[10px]">Contact</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>Support: contact@cleanisense.gov.in</li>
                  <li>Municipal Helpline: 1800-XXX-XXXX</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400">
            <p>&copy; {new Date().getFullYear()} CleaniSense. Indian Municipal Public Service Platform.</p>
            <p>Designed for public municipal accountability.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
