#!/usr/bin/env bash
# Regenerate fonts.css: download the latin-subset woff2 files for the theme's
# fonts from Google Fonts and base64-embed them, so HTML and PDF render
# identically and the deck is self-contained (no network at render time).
#
# Run from dev/theme/fonts/ :  bash build-fonts.sh
set -euo pipefail
cd "$(dirname "$0")"

UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
GF="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;500&display=swap"

curl -sL -A "$UA" "$GF" -o gf.css

python3 - <<'PY'
import re, base64, urllib.request, pathlib
css = pathlib.Path("gf.css").read_text()
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}
parts = re.findall(r'/\*\s*([a-z-]+)\s*\*/\s*(@font-face\s*\{.*?\})', css, re.S)
out = []
for subset, block in parts:
    if subset != "latin":            # ship only the latin subset
        continue
    url = re.search(r'url\((https://[^)]+\.woff2)\)', block).group(1)
    fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    style = re.search(r'font-style:\s*(\w+)', block).group(1)
    weight = re.search(r'font-weight:\s*(\d+)', block).group(1)
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()
    b64 = base64.b64encode(data).decode()
    out.append(f"""@font-face {{
  font-family: '{fam}';
  font-style: {style};
  font-weight: {weight};
  font-display: swap;
  src: url(data:font/woff2;base64,{b64}) format('woff2');
}}""")
    print(f"  {fam} {style} {weight}  ({len(data)//1024} KB)")
header = ("/* Self-hosted, base64-embedded fonts for the mbua512 theme.\n"
          "   Generated from Google Fonts (Newsreader + IBM Plex Mono, latin subset) so\n"
          "   HTML and PDF render identically and the deck is self-contained / CSP-safe.\n"
          "   Regenerate with dev/theme/fonts/build-fonts.sh. */\n\n")
pathlib.Path("fonts.css").write_text(header + "\n".join(out) + "\n")
print(f"wrote fonts.css ({pathlib.Path('fonts.css').stat().st_size//1024} KB)")
PY

rm -f gf.css
