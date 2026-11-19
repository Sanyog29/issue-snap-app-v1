'use client';

// IssueSnap v2 — Language context provider
// Manages the current UI language, persists to storage / user profile,
// and exposes t() for components.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Language } from '@/types/database';
import { t as translate, tf as translatef } from './t';
import { getLocalStorageItem, setLocalStorageItem } from '@/lib/storage';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tf: (key: string, params: Record<string, string | number>) => string;
  tWithLang: (key: string) => { text: string; lang: string };
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'issuesnap-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = getLocalStorageItem(STORAGE_KEY) as Language | null;
    if (stored && ['en', 'hi', 'te'].includes(stored)) {
      setLanguageState(stored);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = stored;
      }
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setLocalStorageItem(STORAGE_KEY, lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, []);

  const t = useCallback(
    (key: string) => translate(key, language).text,
    [language]
  );

  const tf = useCallback(
    (key: string, params: Record<string, string | number>) =>
      translatef(key, language, params).text,
    [language]
  );

  const tWithLang = useCallback(
    (key: string) => translate(key, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tf, tWithLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
