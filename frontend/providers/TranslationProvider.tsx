"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";

interface TranslationContextType {
  locale: string;
  changeLanguage: (newLocale: string) => Promise<void>;
  loading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState("en");
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMessages = async (lang: string) => {
    try {
      const msgs = await import(`../locales/${lang}.json`);
      return msgs.default;
    } catch (err) {
      console.warn(`Failed to load locale '${lang}', falling back to 'en'`, err);
      const fallbackMsgs = await import("../locales/en.json");
      return fallbackMsgs.default;
    }
  };

  useEffect(() => {
    const initializeTranslation = async () => {
      const savedLang = localStorage.getItem("cleanisense_lang") || "en";
      setLocale(savedLang);
      const msgs = await loadMessages(savedLang);
      setMessages(msgs);
      setLoading(false);
    };

    initializeTranslation();
  }, []);

  const changeLanguage = async (newLocale: string) => {
    setLoading(true);
    setLocale(newLocale);
    localStorage.setItem("cleanisense_lang", newLocale);
    const msgs = await loadMessages(newLocale);
    setMessages(msgs);
    setLoading(false);
  };

  if (loading || !messages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <TranslationContext.Provider value={{ locale, changeLanguage, loading }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </TranslationContext.Provider>
  );
}

export function useTranslationUtility() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslationUtility must be used within a TranslationProvider");
  }
  return context;
}
