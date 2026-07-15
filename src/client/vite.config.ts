import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import path from "path"

const root = process.cwd()

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: path.resolve(root, "src/client/routes"),
      generatedRouteTree: path.resolve(root, "src/client/routeTree.gen.ts"),
    }),
    react(),
  ],
  publicDir: path.resolve(root, "src/client/public"),
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
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
