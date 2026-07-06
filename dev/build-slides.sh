#!/usr/bin/env bash
# Render every MARP deck in dev/ to HTML + PDF using the mbua512 theme.
#
# Discovers decks automatically: any dev/**/mbua512-*.md is rendered in place
# (deck.md -> deck.html + deck.pdf beside it). New class folders are picked up
# with no edits to this script.
#
#   ./dev/build-slides.sh              # render all decks
#   ./dev/build-slides.sh class-01     # render only decks under dev/class-01
#
# Requires the MARP CLI on PATH (`marp`) or falls back to `npx @marp-team/marp-cli`.
set -euo pipefail

# repo-root-relative: this script lives in dev/, so its parent is the repo root
DEV_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$DEV_DIR")"
THEME="$DEV_DIR/theme/mbua512.css"

# marp binary (fall back to npx if not installed globally)
if command -v marp >/dev/null 2>&1; then
  MARP=(marp)
else
  MARP=(npx --yes @marp-team/marp-cli@latest)
fi

# which decks: everything, or only those under the given subpath
FILTER="${1:-}"
SEARCH_DIR="$DEV_DIR"
[ -n "$FILTER" ] && SEARCH_DIR="$DEV_DIR/$FILTER"

# Only render decks that declare `theme: mbua512` in their front-matter, so we
# don't force our theme onto other decks (e.g. week-03 uses theme: default).
mapfile -t DECKS < <(
  find "$SEARCH_DIR" -type f -name 'mbua512-*.md' -print0 \
    | xargs -0 grep -lE '^theme:[[:space:]]*mbua512[[:space:]]*$' 2>/dev/null \
    | sort
)

if [ "${#DECKS[@]}" -eq 0 ]; then
  echo "No mbua512-themed decks found under $SEARCH_DIR" >&2
  exit 1
fi

echo "Rendering ${#DECKS[@]} deck(s) with theme $THEME"
for md in "${DECKS[@]}"; do
  base="${md%.md}"
  rel="${md#"$REPO"/}"
  echo "  → $rel"
  "${MARP[@]}" --theme "$THEME" --allow-local-files "$md" -o "$base.html"
  "${MARP[@]}" --theme "$THEME" --allow-local-files --pdf "$md" -o "$base.pdf"
done
echo "Done."
