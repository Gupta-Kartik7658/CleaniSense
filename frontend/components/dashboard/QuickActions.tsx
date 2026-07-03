import React from "react";

interface ActionItem {
  icon: string;
  title: string;
  desc: string;
  link: string;
}

export function QuickActions() {
  const actions: ActionItem[] = [
    {
      icon: "📝",
      title: "Report Issue",
      desc: "Log a new local pollution incident",
      link: "/complaints",
    },
    {
      icon: "📁",
      title: "Reports",
      desc: "Track status logs of submitted complaints",
      link: "/complaints",
    },
    {
      icon: "🗺️",
      title: "Nearby Hotspots",
      desc: "Check active environmental threat coordinates",
      link: "/hotspots",
    },
    {
      icon: "👤",
      title: "Profile",
      desc: "Review your account role credentials",
      link: "/profile",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((item, idx) => (
        <a
          key={idx}
          href={item.link}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-slate-600 transition-all duration-150 text-left space-y-2 block cursor-pointer"
        >
          <span className="text-2xl block">{item.icon}</span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {item.desc}
          </p>
        </a>
      ))}
    </div>
  );
}
