# Generic Generative UI

A lightweight, browser-only front-end for [Runware](https://runware.ai)'s API, styled to
feel familiar to people coming from Civitai's on-site generator.

## 🌐 Live — no build required

**You don't need to build or run anything to use this.** The app is deployed and ready to
use right now — just open one of the links below, paste in your Runware API key, and
generate. The rest of this README (build/deploy instructions) is only relevant if you
want to run your own instance or contribute to the code.

- **[generic-generative-ui.pages.dev](https://generic-generative-ui.pages.dev/)** (Cloudflare Pages)
- **[theallyprompts.github.io/GGUI](https://theallyprompts.github.io/GGUI/)** (GitHub Pages)

## What this is

- **Client-only.** There is no backend. The app runs entirely in your browser and talks
  directly to Runware's API (`https://api.runware.ai/v1`) over HTTPS.
- **BYO API key.** You bring your own Runware API key. It's stored in `localStorage` in
  your browser and is never sent anywhere except directly to Runware. We don't have a
  server, so we can't see it even if we wanted to.
- **No payments here.** This app doesn't handle billing. Create an account and buy
  credits directly at [my.runware.ai](https://my.runware.ai).
- **Not affiliated with Civitai.** No Civitai code is used — this project is an
  independent UI built to feel familiar to Civitai generator users, pointed at
  Runware's API instead.

Supports several image models (Z-Image Turbo, FLUX.1 [dev], FLUX.2 [klein], Seedream
4.5, Illustrious, AutismMix Pony, SD1.5 Realistic Vision/ChilloutMix), a video model
(MiniMax H3), and a growing set of utilities (Upscale, Background Removal, Extract
Metadata, Upload Model, Manage Media) — see [docs/CHANGELOG.md](docs/CHANGELOG.md) for
the full history. Model definitions live under
[src/lib/models/](src/lib/models/), one file per model, registered in
[src/lib/models/registry.ts](src/lib/models/registry.ts); each model's form UI lives
under [src/components/models/](src/components/models/), dispatched by task type in
[src/components/models/registry.tsx](src/components/models/registry.tsx).

## Why this exists

Civitai's generator is well known and loved, but recent payment-processor restrictions
pushed Civitai toward crypto-only payment for adult content. Runware hosts many of the
same open models and supports card payments for NSFW generation, but Runware is an API
provider (B2B), not a consumer product — there's no polished web UI for end users. This
project is that missing UI: familiar layout, Runware colors, Runware backend.

## Getting started (development)

```bash
npm install
npm run dev
```

Open the printed local URL, paste in a Runware API key, and generate.

## Building

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploying

This is a static site — any static host works (GitHub Pages, Cloudflare Pages, Netlify,
Vercel). No custom domain is required; free subdomains from any of these hosts are fine
since the app has no server-side dependency on a specific domain.

### GitHub Pages (included, zero-config)

A workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and
deploys to GitHub Pages automatically on every push to `main`. To enable it:

1. Push this repo to GitHub.
2. In the repo settings, go to **Pages** and set the source to **GitHub Actions**.
3. Push to `main` — the site will publish to `https://<org>.github.io/<repo-name>/`.

### Cloudflare Pages (alternative)

1. Connect the GitHub repo in the Cloudflare dashboard.
2. Build command: `npm run build`. Build output directory: `dist`.
3. Set the environment variable `BASE_PATH` to `/` (Cloudflare Pages serves from the
   domain root, unlike GitHub Pages' `/repo-name/` subpath).

## Branding

Runware's brand tokens (green accent on a dark background, per
[brand.runware.ai/colors](https://brand.runware.ai/colors)) are defined once in
[src/index.css](src/index.css) as Tailwind v4 `@theme` variables and used throughout
[src/components](src/components).

## License

MIT — see [LICENSE](LICENSE).
