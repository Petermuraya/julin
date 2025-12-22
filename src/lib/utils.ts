import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fetch with timeout helper to avoid hanging requests
export async function fetchWithTimeout(input: RequestInfo, init: RequestInit | undefined = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Robust session storage helpers (guard JSON and unavailable storage)
export function safeSessionSet(key: string, value: unknown) {
  try {
    if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // swallow storage errors to avoid crashing the app
    console.warn('safeSessionSet failed', e);
  }
}

export function safeSessionGet<T = unknown>(key: string): T | null {
  try {
    if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('safeSessionGet failed', e);
    return null;
  }
}

// Generic retry helper with exponential backoff
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 300): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastErr;
}
