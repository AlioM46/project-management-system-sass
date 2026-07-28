"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "../translations/en";
import { ar } from "../translations/ar";
import { setCookie, getCookie } from "@/shared/utils/cookies";

type Locale = "en" | "ar";

interface LanguageContextProps {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof en, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const savedLocale = (getCookie("locale") || localStorage.getItem("locale") || "en") as Locale;
    if (savedLocale === "ar" || savedLocale === "en") {
      setLocaleState(savedLocale);
      applyLanguageSettings(savedLocale);
    }
  }, []);

  const applyLanguageSettings = (newLocale: Locale) => {
    const direction = newLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = direction;
    document.documentElement.lang = newLocale;
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setCookie("locale", newLocale, 365);
    localStorage.setItem("locale", newLocale);
    applyLanguageSettings(newLocale);
    window.location.reload();
  };

  const dir = locale === "ar" ? "rtl" : "ltr";

  const t = (key: keyof typeof en, replacements?: Record<string, string | number>): string => {
    const dictionary = locale === "ar" ? ar : en;
    let translation = dictionary[key] || en[key] || String(key);
    
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, String(value));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
