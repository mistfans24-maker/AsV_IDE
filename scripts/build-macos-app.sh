#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/outputs/AsV_IDE.app"
rm -rf "$OUT"
mkdir -p "$OUT/Contents/MacOS" "$OUT/Contents/Resources" "$ROOT/work"
ICONSET="$ROOT/work/AsV_IDE.iconset"
rm -rf "$ICONSET"
mkdir -p "$ICONSET"
sips -s format png "$ROOT/public/asv-logo.png" --resampleWidth 920 --out "$ICONSET/source.png" >/dev/null
sips --padToHeightWidth 1024 1024 --padColor 0A1B20 "$ICONSET/source.png" --out "$ICONSET/master.png" >/dev/null
for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$ICONSET/master.png" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  doubled=$((size * 2))
  sips -z "$doubled" "$doubled" "$ICONSET/master.png" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$OUT/Contents/Resources/AsV_IDE.icns"
sed "s|__PROJECT_ROOT__|$ROOT|g" "$ROOT/native/macos/AsVIDE.swift" > "$ROOT/work/AsVIDE.swift"
swiftc "$ROOT/work/AsVIDE.swift" -framework Cocoa -framework WebKit -framework Security -o "$OUT/Contents/MacOS/AsV_IDE"
cat > "$OUT/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>AsV_IDE</string><key>CFBundleIconFile</key><string>AsV_IDE</string><key>CFBundleIdentifier</key><string>local.asvide.app</string><key>CFBundleName</key><string>AsV_IDE</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>0.1.0</string><key>LSMinimumSystemVersion</key><string>13.0</string></dict></plist>
PLIST
echo "Built $OUT"
