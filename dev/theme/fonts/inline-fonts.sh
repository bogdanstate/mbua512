#!/usr/bin/env bash
# Inline the @font-face blocks from fonts.css directly into mbua512.css,
# replacing whatever font block is currently between the two markers below.
# MARP does not resolve a nested @import inside a theme file, so the faces
# must live in the theme CSS itself.
#
# Run after regenerating fonts.css:  bash build-fonts.sh && bash inline-fonts.sh
set -euo pipefail
cd "$(dirname "$0")/.."   # dev/theme

python3 - <<'PY'
import pathlib, re
theme = pathlib.Path("mbua512.css").read_text()
faces = pathlib.Path("fonts/fonts.css").read_text().split("*/", 1)[1].strip()

BEGIN = "/* FONTS:BEGIN */"
END = "/* FONTS:END */"
block = f"{BEGIN}\n{faces}\n{END}"

if BEGIN in theme and END in theme:
    theme = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), block, theme, flags=re.S)
else:
    raise SystemExit("markers not found — add /* FONTS:BEGIN */ and /* FONTS:END */ "
                     "around the @font-face section of mbua512.css first")
pathlib.Path("mbua512.css").write_text(theme)
print("re-inlined fonts into mbua512.css")
PY
