import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves project sites from /<repo-name>/, so the base path
// must match the repo name in production. Override with BASE_PATH env var
// for other static hosts (Cloudflare Pages, Netlify serve from /).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
