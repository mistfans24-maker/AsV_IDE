# AsV_IDE

**A local-first maker workspace for ESP32, Arduino, Python, web projects, and creative code.**

AsV_IDE is an early public build. It combines a project welcome screen, notebook-style coding workspace, editable project files, theme settings, a visual canvas, and a macOS wrapper app.

## Run it on your computer

You need [Node.js 22 or newer](https://nodejs.org/).

```bash
git clone https://github.com/mistfans24-maker/AsV_IDE.git
cd AsV_IDE
npm install
npm run dev
```

Open the local address shown in the terminal (normally `http://localhost:3000`). Press `Ctrl + C` in the terminal when you want to stop it.

## Run the macOS app

The native wrapper starts the local workspace for you.

```bash
bash scripts/build-macos-app.sh
open outputs/AsV_IDE.app
```

The first build needs Xcode Command Line Tools and Node.js. The app stays local to your computer; it is not a cloud IDE.

## Check before changing code

```bash
npm test
npm run build
```

## What works today

- Local project creation and saved workspace preferences
- Colab-inspired notebook/editor interface with syntax colouring
- Project README/start screen, themes, animated public welcome screen, and visual canvas
- Local code execution bridge in the macOS wrapper for supported installed runtimes
- Private backend repository prepared for future OAuth work

## Important safety notes

- Never commit `.env` files, OAuth client secrets, SSH keys, or API keys. They are ignored by default.
- Google/GitHub sign-in is intentionally not live yet. Real OAuth needs a deployed private backend, server-side session handling, and registered callback URLs.
- GitHub Pages can host static sites, but it cannot safely run the OAuth backend or the current server-rendered app by itself.
- This project is not yet a replacement for Arduino IDE/PlatformIO for board flashing. Treat ESP32/Arduino integration as work in progress.

## Contribute

1. Create a branch: `git checkout -b AsV/your-feature`
2. Make your changes.
3. Run `npm test`.
4. Open a pull request with a short explanation and screenshots for UI changes.

Built by AsV. Community contributors are welcome.
