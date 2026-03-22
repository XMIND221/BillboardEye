import path from "node:path"
import { fileURLToPath } from "node:url"

// Évite l’avertissement « multiple lockfiles » quand ce dossier est dans un repo avec package-lock à la racine
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: turbopackRoot,
  },
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
