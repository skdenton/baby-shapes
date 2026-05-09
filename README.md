# Baby Shape Matcher 🎨

A progressive web app (PWA) for babies and toddlers to learn shapes through drag-and-drop matching. Features colorful shapes with friendly faces, sound effects, haptic feedback, and fireworks celebrations.

## Features

- **Shape Matching** — Drag colorful shapes (circle, square, triangle, star) to matching outlines
- **Progressive Difficulty** — Levels scale from 1 shape up to 4
- **Sensory Feedback** — Web Audio API tones, haptic vibration, sparkle particles
- **Fireworks Celebrations** — Particle fireworks on match and level completion
- **Interactive Background** — Draggable parallax grid with sparkle trail
- **Fullscreen Mode** — Immersive play via fullscreen toggle button
- **Offline Support** — Service worker caches the app shell for offline play
- **Installable PWA** — Add to home screen on iOS and Android

## Tech Stack

- **Single-file HTML/CSS/JS** — No build step, no framework dependencies
- **Canvas 2D** — All rendering via `<canvas>` element
- **Web Audio API** — Procedural sound effects (no audio files needed)
- **Service Worker** — Cache-first offline strategy (`sw.js`)
- **PWA Manifest** — Standalone display, themed chrome (`manifest.json`)

## Deploying to Netlify

### Option A: Git-based Deploy (Recommended)

1. Push this repo to GitHub/GitLab/Bitbucket
2. Log in to [Netlify](https://app.netlify.com)
3. Click **"Add new site"** → **"Import an existing project"**
4. Select the repository
5. **Build settings** (auto-detected from `netlify.toml`):
   - **Publish directory:** `.` (repo root)
   - **Build command:** *(leave empty — no build step)*
6. Click **Deploy site**

### Option B: Manual Deploy (Drag & Drop)

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the entire project folder onto the page
3. Netlify will deploy immediately

### Custom Domain (Optional)

1. In Netlify dashboard → **Domain settings** → **Add custom domain**
2. Follow DNS configuration instructions
3. Netlify automatically provisions a free SSL certificate

## Project Structure

```
baby-shapes/
├── index.html        # Main app — HTML, CSS, and game logic (single file)
├── manifest.json     # PWA manifest — app name, icons, theme
├── sw.js             # Service worker — offline caching strategy
├── netlify.toml      # Netlify deploy config — headers, caching
├── icons/
│   ├── icon-192.png  # PWA icon (192x192)
│   └── icon-512.png  # PWA icon (512x512)
├── .gitignore
└── README.md
```

## Local Development

Since this is a static site, you can serve it with any local HTTP server:

```bash
# Python
python -m http.server 8000

# Node.js (npx, no install)
npx serve .

# VS Code — use the "Live Server" extension
```

> **Note:** Service workers require HTTPS or `localhost`. Opening `index.html` directly as a `file://` URL will prevent SW registration.
