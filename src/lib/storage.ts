// Safe browser storage helper to protect against Node.js v22/v23/v25 global localStorage issues

export function getLocalStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    if (window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
  }
  return null;
}

export function setLocalStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`Error setting localStorage key "${key}":`, e);
  }
}

export function removeLocalStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage && typeof window.localStorage.removeItem === 'function') {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`Error removing localStorage key "${key}":`, e);
  }
}

export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage && typeof window.localStorage.clear === 'function') {
      window.localStorage.clear();
    }
  } catch (e) {
    console.warn('Error clearing localStorage:', e);
  }
}

export function getSessionStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    if (window.sessionStorage && typeof window.sessionStorage.getItem === 'function') {
      return window.sessionStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`Error reading sessionStorage key "${key}":`, e);
  }
  return null;
}

export function setSessionStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage && typeof window.sessionStorage.setItem === 'function') {
      window.sessionStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`Error setting sessionStorage key "${key}":`, e);
  }
}

export function removeSessionStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage && typeof window.sessionStorage.removeItem === 'function') {
      window.sessionStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`Error removing sessionStorage key "${key}":`, e);
  }
}

export function clearSessionStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage && typeof window.sessionStorage.clear === 'function') {
      window.sessionStorage.clear();
    }
  } catch (e) {
    console.warn('Error clearing sessionStorage:', e);
  }
}
