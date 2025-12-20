import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Register service worker for PWA support in production
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
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
