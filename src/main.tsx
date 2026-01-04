import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Page view logging: record simple page view rows to Supabase `page_views` table
// Uses anon key and public table; the table should be created (migration added).
function setupPageViewLogging() {
  const sendView = async () => {
    try {
      // keep payload minimal and avoid storing IP addresses here
      await supabase.from('page_views').insert({
        path: location.pathname,
        url: location.href,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      });
    } catch (err) {
      // don't block the app for analytics failures
      console.debug('page view log failed', err);
    }
  };

  // log initial view
  try { sendView(); } catch (e) { /* ignore */ }

  // log SPA navigations: pushState / replaceState
  const origPush = history.pushState.bind(history);
  history.pushState = function (data: unknown, title: string, url?: string | null) {
    const ret = origPush(data as any, title, url);
    try { sendView(); } catch (e) {}
    return ret;
  } as typeof history.pushState;

  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (data: unknown, title: string, url?: string | null) {
    const ret = origReplace(data as any, title, url);
    try { sendView(); } catch (e) {}
    return ret;
  } as typeof history.replaceState;

  window.addEventListener('popstate', () => { try { sendView(); } catch (e) {} });
}

if (typeof window !== 'undefined') setupPageViewLogging();

// Register service worker for PWA support in production only
if (!import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use Vite's base URL so registration works when deployed under a subpath
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).then((reg) => {
      console.log('Service worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// Development-only instrumentation to help diagnose unexpected reloads
if (import.meta.env.DEV) {
  try {
    // Log beforeunload / unload to see reloads
    window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
      console.info('[dev-debug] beforeunload fired', { href: window.location.href, time: Date.now() });
    });

    window.addEventListener('unload', () => {
      console.info('[dev-debug] unload fired', { href: window.location.href, time: Date.now() });
    });

    // Log visibility changes
    document.addEventListener('visibilitychange', () => {
      console.info('[dev-debug] visibilitychange', { state: document.visibilityState, time: Date.now() });
    });

    // Wrap history methods to observe programmatic navigation
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (this: History, data: unknown, title: string, url?: string | null) {
      console.info('[dev-debug] history.pushState', { url, data, title, time: Date.now() });
      // pushState has an `any` param in the DOM typings; cast when forwarding
      return origPush.apply(this, [data as any, title, url]);
    } as typeof history.pushState;
    history.replaceState = function (this: History, data: unknown, title: string, url?: string | null) {
      console.info('[dev-debug] history.replaceState', { url, data, title, time: Date.now() });
      return origReplace.apply(this, [data as any, title, url]);
    } as typeof history.replaceState;

    // Observe service worker messages
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener?.('message', (ev: MessageEvent) => {
        console.info('[dev-debug] serviceWorker message', ev.data);
      });
    }
  } catch (err) {
    // ignore failures in instrumentation
    // keep silent in dev if something unexpected happens
  }
}
