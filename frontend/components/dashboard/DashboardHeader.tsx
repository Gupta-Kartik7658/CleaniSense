import React from "react";
import { useTranslations } from "next-intl";

export function DashboardHeader() {
  const t = useTranslations("dashboard");

  return (
    <div className="text-left border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 transition-colors duration-150">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {t("title")}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {t("subtitle")}
      </p>
    </div>
  );
}
