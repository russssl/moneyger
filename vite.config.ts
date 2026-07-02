import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import path from "path"

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "src/client/routes",
      generatedRouteTree: "src/client/routeTree.gen.ts",
    }),
    react(),
  ],
  publicDir: "src/public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.PUBLIC_ENVIRONMENT": JSON.stringify(process.env.PUBLIC_ENVIRONMENT || "development"),
    "process.env.PUBLIC_APP_URL": JSON.stringify(process.env.PUBLIC_APP_URL || "http://localhost:3000"),
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
})
