"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("cleanisense_theme") as Theme) || "system";
    setThemeState(savedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const applyTheme = (currentTheme: Theme) => {
      if (currentTheme === "dark" || (currentTheme === "system" && mediaQuery.matches)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme(savedTheme);

    const handleSystemThemeChange = () => {
      // Re-apply if system theme preference is currently selected
      const currentSaved = localStorage.getItem("cleanisense_theme") as Theme;
      if (!currentSaved || currentSaved === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("cleanisense_theme", newTheme);

    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (newTheme === "dark" || (newTheme === "system" && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
