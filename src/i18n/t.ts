// IssueSnap v2 — i18n resolution function
// Fallback chain: chosen language → Hindi → English

import type { Catalogue } from './catalogue';
import { en } from './en';
import { hi } from './hi';
import { te } from './te';
import type { Language } from '@/types/database';

const catalogues: Record<string, Partial<Catalogue>> = { en, hi, te };

const CHAIN = (lang: Language): string[] =>
  lang === 'en' ? ['en'] : lang === 'hi' ? ['hi', 'en'] : ['te', 'hi', 'en'];

/**
 * Resolve a string key in the given language.
 * Returns the text and the language it was found in (for setting lang attributes
 * on fallback strings so screen readers pronounce them correctly).
 */
export function t(key: string, lang: Language): { text: string; lang: string } {
  for (const l of CHAIN(lang)) {
    const s = catalogues[l]?.[key];
    if (s) return { text: s, lang: l };
  }
  return { text: key, lang: 'en' };
}

/**
 * Interpolate parameters into a translated string.
 * Replaces {param} with the value from the params object.
 */
export function tf(
  key: string,
  lang: Language,
  params: Record<string, string | number>
): { text: string; lang: string } {
  const resolved = t(key, lang);
  let text = resolved.text;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return { text, lang: resolved.lang };
}
