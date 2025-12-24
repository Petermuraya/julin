import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    /**
     * Base URL
     * - Local dev → /
     * - GitHub Pages / CDN → set in .env.production
     */
    base: env.VITE_BASE_PATH || "/",

    /**
     * Dev server
     */
    server: {
      host: "localhost",
      port: 5173,
      open: true,
    },

    /**
     * Preview server (production simulation)
     */
    preview: {
      host: "localhost",
      port: 4173,
    },

    /**
     * Plugins
     */
    plugins: [
      react({
        jsxImportSource: "react",
      }),
      mode === "development" && componentTagger(),
    ].filter(Boolean),

    /**
     * Path aliases
     */
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    /**
     * Build optimizations
     */
    build: {
      target: "esnext",
      outDir: "dist",
      sourcemap: mode !== "production",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            vendor: ["@supabase/supabase-js"],
          },
        },
      },
    },

    /**
     * Dependency optimization
     */
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
  };
});
