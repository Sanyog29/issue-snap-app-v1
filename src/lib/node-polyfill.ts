// Polyfill for Node.js v25+ where globalThis.localStorage is instantiated as an empty object without methods.
// This prevents Next.js Turbopack dev server and 3rd party SSR libraries from crashing.

if (
  typeof globalThis !== 'undefined' &&
  (!globalThis.localStorage || typeof globalThis.localStorage.getItem !== 'function')
) {
  const memoryStore = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string): string | null => {
        return memoryStore.get(String(key)) ?? null;
      },
      setItem: (key: string, value: string): void => {
        memoryStore.set(String(key), String(value));
      },
      removeItem: (key: string): void => {
        memoryStore.delete(String(key));
      },
      clear: (): void => {
        memoryStore.clear();
      },
      key: (index: number): string | null => {
        const keys = Array.from(memoryStore.keys());
        return keys[index] ?? null;
      },
      get length(): number {
        return memoryStore.size;
      },
    },
    writable: true,
    configurable: true,
  });
}
