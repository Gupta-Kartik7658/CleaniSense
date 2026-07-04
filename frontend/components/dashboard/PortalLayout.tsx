"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTranslationUtility } from "@/providers/TranslationProvider";
import { useTranslations } from "next-intl";

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { locale: currentLocale, changeLanguage } = useTranslationUtility();

  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Validate session redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load stored preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNotif = localStorage.getItem("cleanisense_notif_enabled");
      setNotifEnabled(savedNotif !== "false");
    }
  }, []);

  // Handle click outside & keyboard accessibility
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const selectLanguage = (code: string) => {
    changeLanguage(code);
  };

  const toggleNotifications = () => {
    const newState = !notifEnabled;
    setNotifEnabled(newState);
    localStorage.setItem("cleanisense_notif_enabled", String(newState));
  };

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

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी" },
    { code: "gu", name: "ગુજરાતી" },
    { code: "bn", name: "বাংলা" },
    { code: "ta", name: "தமிழ்" },
    { code: "te", name: "తెలుగు" },
  ];

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

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
              {tNav("portal")}
            </span>
          </div>

          {/* Navigation Links in Header */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">{tNav("dashboard")}</Link>
            <Link href="/complaints/history" className="hover:text-emerald-600 dark:hover:text-emerald-455 transition-colors">{tNav("complaints")}</Link>
            <Link href="/hotspots" className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">{tNav("hotspots")}</Link>
            <Link href="/profile" className="hover:text-emerald-600 dark:hover:text-emerald-455 transition-colors">{tNav("profile")}</Link>
          </nav>

          {/* Right Header items */}
          <div className="flex items-center space-x-6">
            
            {/* Notifications Bell */}
            <NotificationBell />

            {/* Profile Avatar and Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-6 focus:outline-none rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                aria-label="User preferences menu"
              >
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile Avatar"
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
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {/* Quick Preferences Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-[310px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-4 z-50 text-left transition-all duration-150 ease-in-out">
                  
                  {/* Account Header */}
                  <div className="px-4 pb-3 flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800">
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt="Profile Avatar"
                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-sm rounded-full flex items-center justify-center">
                        {user.name ? user.name.substring(0, 2).toUpperCase() : "US"}
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.name || "User"}
                        </h4>
                        <span className="text-[9px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {user.role || "Citizen"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Preferences Options */}
                  <div className="px-4 py-3 space-y-4">
                    <h5 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Quick Preferences
                    </h5>

                    {/* Language Selector */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
                        <span>🌐</span> Language
                      </label>
                      <div className="grid grid-cols-3 gap-1 text-[9px]">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => selectLanguage(lang.code)}
                            className={`py-1 rounded border font-bold cursor-pointer transition-all ${
                              currentLocale === lang.code
                                ? "border-emerald-600 bg-emerald-50/10 text-emerald-700 dark:text-emerald-450"
                                : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Appearance (Theme Mode) Selector */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
                        <span>🎨</span> Appearance
                      </label>
                      <div className="grid grid-cols-3 gap-1 text-[9px]">
                        {themes.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setTheme(t.value as any)}
                            className={`py-1 rounded border font-bold cursor-pointer transition-all ${
                              theme === t.value
                                ? "border-emerald-600 bg-emerald-50/10 text-emerald-700 dark:text-emerald-450"
                                : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notifications Switch toggle */}
                    <div className="flex justify-between items-center text-left">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>🔔</span> Notifications
                      </label>
                      <button
                        onClick={toggleNotifications}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          notifEnabled ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-205 ease-in-out ${
                            notifEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Accessibility option panel */}
                    <div className="flex justify-between items-center text-left">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-405 flex items-center gap-1.5 opacity-60">
                        <span>♿</span> Accessibility
                      </span>
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {tCommon("comingSoon")}
                      </span>
                    </div>
                  </div>

                  {/* Account Settings Link */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 px-2">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>⚙</span> {tCommon("accountSettings")}
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 px-2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <span>🚪</span> {tCommon("signOut")}
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Main Panel Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 md:px-8 py-8">
        {children}
      </main>

    </div>
  );
}
