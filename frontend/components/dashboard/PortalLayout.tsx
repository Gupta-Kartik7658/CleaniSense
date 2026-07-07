"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTranslationUtility } from "@/providers/TranslationProvider";
import { useTranslations } from "next-intl";

import { useProfile } from "@/hooks/useProfile";

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { preferences, updatePreferences } = useProfile();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale: currentLocale, changeLanguage } = useTranslationUtility();

  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preferences) {
      setNotifEnabled(preferences.notifications_enabled);
    }
  }, [preferences]);

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
    void updatePreferences({ language: code }).catch(() => undefined);
  };

  const toggleNotifications = () => {
    const newState = !notifEnabled;
    setNotifEnabled(newState);
    void updatePreferences({ notifications_enabled: newState }).catch(() => undefined);
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

  const navigation = [
    { href: "/dashboard", label: tNav("dashboard"), note: "Overview and activity" },
    { href: "/complaints", label: "Report Issue", note: "Submit a new complaint" },
    { href: "/complaints/history", label: tNav("complaints"), note: "Track submissions" },
    { href: "/hotspots", label: tNav("hotspots"), note: "Review nearby clusters" },
    { href: "/profile", label: tNav("profile"), note: "Account and preferences" },
  ];

  const currentSection =
    navigation.find((item) =>
      item.href === "/complaints"
        ? pathname === "/complaints"
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) ?? navigation[0];

  const initials = user.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CS";

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1520px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden lg:block lg:w-[290px]">
          <div className="sticky top-4 space-y-4">
            <div className="glass-panel space-y-5 p-5">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--surface-strong)]">
                  CS
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight text-[color:var(--foreground)]">CleaniSense</p>
                  <p className="fine-print">{tNav("portal")}</p>
                </div>
              </Link>

              <div className="section-card space-y-4 p-5">
                <span className="page-kicker">Citizen Workspace</span>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">
                    Report local pollution and follow every update
                  </h2>
                  <p className="fine-print">
                    This workspace is focused on the live citizen features already implemented in the product.
                  </p>
                </div>
                <Link href="/complaints" className="primary-action w-full">
                  Report New Issue
                </Link>
              </div>
            </div>

            <div className="glass-panel p-4">
              <p className="metric-label px-2 pb-3">Navigation</p>
              <nav className="space-y-1.5">
                {navigation.map((item) => {
                  const active =
                    item.href === "/complaints"
                      ? pathname === "/complaints"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-start justify-between gap-3 rounded-[18px] px-4 py-3 ${
                        active
                          ? "border border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                          : "border border-transparent hover:bg-[color:var(--surface-muted)]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className={`text-xs ${active ? "text-[color:var(--accent-strong)]" : "text-[color:var(--foreground-soft)]"}`}>
                          {item.note}
                        </p>
                      </div>
                      <span className={`mt-1 text-xs ${active ? "text-[color:var(--accent-strong)]" : "text-[color:var(--foreground-soft)]"}`}>
                        →
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="section-card space-y-3">
              <div className="flex items-center justify-between">
                <p className="metric-label">Synced Preferences</p>
                <span className="pill-badge tone-accent">{currentLocale.toUpperCase()}</span>
              </div>
              <p className="fine-print">
                Theme: {theme}. Notifications: {notifEnabled ? "enabled" : "muted"}.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <header className="glass-panel sticky top-4 z-40 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--surface-strong)] lg:hidden">
                  CS
                </Link>
                <div className="space-y-1">
                  <p className="metric-label">{currentSection.label}</p>
                  <h1 className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
                    {currentSection.note}
                  </h1>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="hidden md:flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-2">
                  <span className="text-xs font-semibold text-[color:var(--foreground)]">{user.name || user.email}</span>
                  <span className="pill-badge">{user.role || "citizen"}</span>
                </div>
                <NotificationBell />

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                    aria-label="User preferences menu"
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt="Profile Avatar"
                        className="h-9 w-9 rounded-full border border-[color:var(--line)] object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-xs font-semibold text-[color:var(--accent-strong)]">
                        {initials}
                      </div>
                    )}
                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{user.name || "Citizen"}</p>
                      <p className="text-xs text-[color:var(--foreground-soft)]">{preferences?.theme || theme}</p>
                    </div>
                    <span className="text-xs text-[color:var(--foreground-soft)]">▼</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-[320px] overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow-pop)]">
                      <div className="flex items-center gap-3 border-b border-[color:var(--line)] pb-4">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt="Profile Avatar"
                            className="h-11 w-11 rounded-full border border-[color:var(--line)] object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-sm font-semibold text-[color:var(--accent-strong)]">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">{user.name || "Citizen"}</p>
                          <p className="truncate text-xs text-[color:var(--foreground-soft)]">{user.email}</p>
                        </div>
                        <span className="pill-badge">{user.role || "citizen"}</span>
                      </div>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="field-label">Language</label>
                          <div className="grid grid-cols-3 gap-2">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => selectLanguage(lang.code)}
                                className={`rounded-[14px] border px-2 py-2 text-[0.72rem] font-semibold ${
                                  currentLocale === lang.code
                                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                                    : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground-soft)]"
                                }`}
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="field-label">Appearance</label>
                          <div className="grid grid-cols-3 gap-2">
                            {themes.map((themeOption) => (
                              <button
                                key={themeOption.value}
                                onClick={() => {
                                  setTheme(themeOption.value as "light" | "dark" | "system");
                                  void updatePreferences({ theme: themeOption.value }).catch(() => undefined);
                                }}
                                className={`rounded-[14px] border px-2 py-2 text-[0.72rem] font-semibold ${
                                  theme === themeOption.value
                                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                                    : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground-soft)]"
                                }`}
                              >
                                {themeOption.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-[color:var(--foreground)]">Notifications</p>
                            <p className="text-xs text-[color:var(--foreground-soft)]">
                              {notifEnabled ? "Alert feed enabled" : "Alert feed muted"}
                            </p>
                          </div>
                          <button
                            onClick={toggleNotifications}
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full ${
                              notifEnabled ? "bg-[color:var(--foreground)]" : "bg-[color:var(--surface-muted)]"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-[color:var(--surface-strong)] shadow-sm transition-transform ${
                                notifEnabled ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-[color:var(--line)] pt-4">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="secondary-action w-full justify-between"
                        >
                          {tCommon("accountSettings")}
                          <span aria-hidden="true">→</span>
                        </Link>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            void logout();
                          }}
                          className="ghost-action w-full justify-between text-[color:var(--danger)]"
                        >
                          {tCommon("signOut")}
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <nav className="glass-panel flex gap-2 overflow-x-auto px-3 py-3 lg:hidden">
            {navigation.map((item) => {
              const active =
                item.href === "/complaints"
                  ? pathname === "/complaints"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                    active
                      ? "border border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                      : "border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground-soft)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="page-shell pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
