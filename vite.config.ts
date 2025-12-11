import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // When serving locally we want `/` as the base; when deploying to GitHub
  // Pages for this repo, use the repository name as base so assets load from
  // `https://<username>.github.io/julin-real-estate-hub/`.
  base: mode === "development" ? "/" : "/julin-real-estate-hub/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
