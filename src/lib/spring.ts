// IssueSnap v2 — Shared spring configurations (DESIGN.md section 9)

// Spring presets
export const SPRINGS = {
  brackets: { tension: 260, friction: 26 },
  vlmText: { tension: 220, friction: 28 },
  reportSent: { tension: 240, friction: 24 },
  realtimeUpdate: { tension: 300, friction: 30 },
  sheet: { tension: 280, friction: 30 },
  languageSwap: { duration: 100 },
} as const;

/**
 * Checks if reduced motion is preferred.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns spring config with immediate: true when reduced motion is preferred.
 */
export function getSpringConfig<T extends keyof typeof SPRINGS>(preset: T) {
  const config = SPRINGS[preset];
  if (prefersReducedMotion()) {
    return { ...config, immediate: true };
  }
  return config;
}
