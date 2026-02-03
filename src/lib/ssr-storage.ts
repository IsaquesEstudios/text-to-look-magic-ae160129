// SSR-safe storage implementation
// Uses localStorage in browser, no-op storage during SSR/SSG

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  length: number;
  key: (index: number) => string | null;
}

// No-op storage for SSR environment
const noopStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};

// Returns localStorage in browser, no-op storage during SSR
export const ssrSafeStorage: StorageLike =
  typeof window !== "undefined" ? window.localStorage : noopStorage;

// Helper to check if we're in a browser environment
export const isBrowser = typeof window !== "undefined";
