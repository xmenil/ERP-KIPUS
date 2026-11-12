import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared", "./node_modules"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    proxy: {
      "/api/v1": {
        target: "http://localhost:3002",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:3002",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Permitir que las peticiones a /api/v1 y /socket.io pasen directo al proxy sin que Express intercepte el body stream
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.startsWith("/api/v1") || req.url.startsWith("/socket.io"))) {
          return next();
        }
        app(req, res, next);
      });
    },
  };
}
