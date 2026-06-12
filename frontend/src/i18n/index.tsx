"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import en from "./en";
import tw from "./tw";
import fr from "./fr";

type Translations = typeof en;
type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & string];

type TranslationKey = NestedKeyOf<Translations>;

const translations: Record<string, Translations> = { en, tw, fr };

interface I18nContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split(".");
  let current: any = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>("en");

  useEffect(() => {
    const saved = localStorage.getItem("campusconnect-language");
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem("campusconnect-language", lang);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const currentLang = translations[language];
      const value = getNestedValue(currentLang as Record<string, any>, key);
      if (value !== undefined) return value;

      const fallback = translations.en;
      const fallbackValue = getNestedValue(fallback as Record<string, any>, key);
      if (fallbackValue !== undefined) return fallbackValue;

      return key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}

export type { TranslationKey };
