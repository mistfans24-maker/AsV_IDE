#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/outputs/AsV_IDE.app"
STAGE="$ROOT/work/installer"
PACKAGE_DIR="$STAGE/packages"
OUTPUT="$ROOT/outputs/AsV_IDE-Installer.pkg"

bash "$ROOT/scripts/build-macos-app.sh"
RUNTIME="$APP/Contents/Resources/runtime"
mkdir -p "$RUNTIME"
cp "$(command -v node)" "$RUNTIME/node"
rsync -a --delete --exclude='.env*' --exclude='.git' --exclude='outputs' --exclude='work' --exclude='docs' --exclude='.DS_Store' --exclude='._*' --exclude='node_modules/.cache' "$ROOT/" "$RUNTIME/"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict --verbose=2 "$APP"
rm -rf "$STAGE"
mkdir -p "$PACKAGE_DIR"
pkgbuild --component "$APP" --install-location /Applications --scripts "$ROOT/installer/scripts" --identifier local.asvide.app --version 0.1.0 "$PACKAGE_DIR/AsV_IDE.pkg"
productbuild --distribution "$ROOT/installer/distribution.xml" --resources "$ROOT/installer/resources" --package-path "$PACKAGE_DIR" "$OUTPUT"
pkgutil --check-signature "$OUTPUT"
echo "Built $OUTPUT"
