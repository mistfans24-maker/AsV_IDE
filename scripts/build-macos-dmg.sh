#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/outputs/AsV_IDE.app"
WORK="$ROOT/work/dmg"
RW_IMAGE="$WORK/AsV_IDE-rw.dmg"
MOUNT=""
OUTPUT="$ROOT/outputs/AsV_IDE-macOS.dmg"
VOLUME="Install AsV_IDE"

cleanup() {
  if [ -n "$MOUNT" ] && mount | /usr/bin/grep -Fq " $MOUNT "; then hdiutil detach "$MOUNT" -quiet || true; fi
}
trap cleanup EXIT

bash "$ROOT/scripts/build-macos-app.sh"
rm -rf "$WORK"
mkdir -p "$WORK"
rm -f "$OUTPUT" "$RW_IMAGE"
# The standalone runtime has many small files; allow enough uncompressed space
# before hdiutil compresses the final distributable image.
hdiutil create -size 900m -fs HFS+ -volname "$VOLUME" "$RW_IMAGE" -quiet
hdiutil attach "$RW_IMAGE" -noverify -quiet
MOUNT="/Volumes/$VOLUME"
cp -R "$APP" "$MOUNT/AsV_IDE.app"
ln -s /Applications "$MOUNT/Applications"

# Finder metadata makes the mounted image immediately understandable: drag the
# large app icon onto Applications. If Finder is unavailable (for example CI),
# the image remains completely usable with the default layout.
osascript <<APPLESCRIPT || true
tell application "Finder"
  tell disk "$VOLUME"
    open
    set current view of container window to icon view
    set toolbar visible of container window to false
    set statusbar visible of container window to false
    set bounds of container window to {160, 160, 950, 610}
    set icon size of icon view options of container window to 150
    set arrangement of icon view options of container window to not arranged
    set position of item "AsV_IDE.app" of container window to {210, 235}
    set position of item "Applications" of container window to {585, 235}
    close
  end tell
end tell
APPLESCRIPT

sync
hdiutil detach "$MOUNT" -quiet
hdiutil convert "$RW_IMAGE" -format UDZO -imagekey zlib-level=9 -o "$OUTPUT" -quiet
echo "Built $OUTPUT"
