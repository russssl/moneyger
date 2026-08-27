import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

try {
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, "index.ts")],
    bundle: true,
    platform: "node",
    target: "node22",
    outdir: path.resolve(__dirname, "../../dist-server"),
    format: "esm",
    outExtension: { ".js": ".mjs" },
    sourcemap: true,
    alias: {
      "@": path.resolve(__dirname, ".."),
    },
    packages: "external",
  })
  console.log("Server built to dist-server/")
} catch (e) {
  console.error("Server build failed:", e)
  process.exit(1)
}
