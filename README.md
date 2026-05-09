# Baby Shape Matcher 🎨

A progressive web app (PWA) for babies and toddlers to learn shapes, numbers, and words through drag-and-drop matching. Features colorful shapes with friendly faces, sound effects, speech synthesis, haptic feedback, and fireworks celebrations.

## Features

### Gameplay
- **3-Phase Progression** — Shapes → Numbers → Words, difficulty increases each level
  - **Shapes (L1–5):** Circle, Square, Triangle, Star, Heart — 1 to 5 shapes per level
  - **Numbers (L6–11):** Match digits 0–10 — 2 to 6 number tiles per level
  - **Words (L12+):** Spell words by matching individual letters (cat, dog, sun, etc.)
- **Randomized Layout** — Targets and items randomly placed on opposite sides (top/bottom or left/right)
- **Pulsing Rainbow Targets** — Unmatched target holes glow and cycle through colors
- **Female Voice** — Says the shape/number/letter name on match; announces full word on completion
- **Progressive Difficulty** — Levels auto-advance with fireworks celebrations

### Sensory Feedback
- **Web Audio API** — Procedural pickup, drop, match, and win sound effects
- **Speech Synthesis** — Spoken names reinforce learning
- **Haptic Vibration** — Tactile feedback on touch devices
- **Sparkle Trails** — Particle effects follow dragged items
- **Fireworks** — Explode on match and level completion

### Child Safety
- **Parent Gate** — Fullscreen exit requires solving a math problem (e.g., "What is 11 + 5?")
- **Back Button Trap** — Prevents accidental navigation via browser back
- **Fullscreen Lock** — 🔒 icon indicates child-lock mode is active

### Android Screen Pinning (Recommended)
For true device-level locking (prevents app switching, home button, etc.):
1. Open **Settings → Security → Screen Pinning** (or search "pin" in Settings)
2. Enable Screen Pinning
3. Open the app and enter fullscreen mode
4. Open Recent Apps, tap the app's icon → **Pin this app**
5. To unpin: press Back + Overview simultaneously, then enter your device PIN

### iOS Guided Access (Recommended)
1. Open **Settings → Accessibility → Guided Access** and enable it
2. Set a passcode
3. Open the app, triple-click the Side/Home button → **Start**
4. Triple-click again and enter passcode to exit

## Tech Stack

- **HTML/CSS/JS** — No build step, no framework dependencies
- **Canvas 2D** — All rendering via `<canvas>` element
- **Web Audio API** — Procedural sound effects (no audio files)
- **Web Speech API** — `speechSynthesis` for spoken names
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

## Project Structure

```
baby-shapes/
├── index.html        # Main app shell — HTML, CSS, parent gate UI
├── js/
│   ├── engine.js     # Audio, voice, drawing primitives, particles
│   ├── levels.js     # Level config, layout engine, level creation
│   └── main.js       # Game state, render loop, input, parent gate, init
├── manifest.json     # PWA manifest
├── sw.js             # Service worker — offline caching
├── netlify.toml      # Netlify deploy config
├── icons/
│   ├── icon-192.png  # PWA icon (192×192)
│   └── icon-512.png  # PWA icon (512×512)
├── .gitignore
└── README.md
```

## Local Development

```bash
# Python
python -m http.server 8000

# Node.js (npx, no install)
npx serve .

# VS Code — use the "Live Server" extension
```

> **Note:** Service workers require HTTPS or `localhost`. Opening `index.html` directly as a `file://` URL will prevent SW registration and speech synthesis.
