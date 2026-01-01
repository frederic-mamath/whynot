import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    root: "./client",
    build: {
      outDir: "../dist/public",
      emptyOutDir: true,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client/src"),
      },
    },
    css: {
      modules: false,
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
    },
    server: {
      port: 5173,
      proxy: {
        "/trpc": {
          target: env.VITE_API_URL || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
