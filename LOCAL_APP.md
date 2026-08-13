# Run AsV_IDE locally

AsV_IDE is designed to run on your own computer. Its interface, project files, USB serial connection, plugin settings, and build tools can stay local.

## Use it as an app

1. Start it with `npm run dev`.
2. Visit `http://localhost:3000` using Chrome or Edge.
3. In the browser menu, choose **Install AsV_IDE** (or **Install app**). It opens in its own desktop window afterwards.

No hosting or paid server is needed. Keep the project on your computer or in a private GitHub repository.

## Device access

- **USB:** Click **Connect USB**, choose the ESP32 serial port, then grant the browser's local permission.
- **Bluetooth:** Pair through **Bluetooth flash**. The ESP32 needs a BLE OTA receiver installed by USB first; Bluetooth cannot replace the very first flash.
- Keep OTA updates authenticated and signed. Do not make an OTA receiver openly accessible.

## Storage target

- AsV_IDE interface: about 18 MB in Featherweight mode.
- One ESP32 board toolchain plus its compiler: typically 150–300 MB.
- Extra boards, plugins, examples, and offline docs: downloaded only when you choose them.

## AI without mandatory payment

The app works without AI. Gemini is optional and needs your own Gemini API key, subject to Google's limits. For fully local AI, connect an installed local model runner such as Ollama in a later AsV_IDE plugin; no code leaves your computer.
