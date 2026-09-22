#!/usr/bin/env python3
"""Build the JSON payload `upload-deck.py` consumes, from the local tree.

    python3 build-payload.py [--out payload.json]

It reads `deck.md`, every PNG in `assets/`, and the stylesheet, and writes one
JSON file carrying all three. Nothing here talks to a cluster.

TITLE COMES FROM THE FRONT MATTER, NEVER FROM A CONSTANT HERE.
The uploader PUTs whatever title the payload carries, and a hardcoded title in
a payload builder once silently renamed a live deck ("MBUA512 — Effective data
graphics" became "Effective Data Graphics"). So the title is parsed out of
`deck.md`'s front matter and nowhere else.

It also refuses to build a payload that would be broken on arrival:

  * every `asset:<file>` referenced by the markdown must exist in `assets/`,
    and every file in `assets/` should be referenced (an unreferenced asset is
    usually a renamed figure);
  * no asset may exceed the platform's 4 MiB cap;
  * the stylesheet's `/*` and `*/` counts must match — an unbalanced comment
    silently swallows every rule after it, and has done so on this platform
    before (memory `data-graphics-deck`).
"""

from __future__ import annotations

import argparse
import base64
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
DECK_MD = HERE / "deck.md"
ASSET_DIR = HERE / "assets"
CSS_PATH = HERE / "mbua512-week-09.css"

MAX_ASSET_BYTES = 4 * 1024 * 1024


def parse_front_matter(md: str) -> dict:
    if not md.startswith("---\n"):
        return {}
    end = md.index("\n---\n", 4)
    out = {}
    for line in md[4:end].split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default=str(HERE / "payload.json"))
    ap.add_argument("--slug", default="mbua512-week-09")
    ap.add_argument("--visibility", default="instructors")
    args = ap.parse_args()

    md = DECK_MD.read_text()
    fm = parse_front_matter(md)
    title = fm.get("title")
    if not title:
        print("ERROR: deck.md front matter has no title:", file=sys.stderr)
        return 1

    referenced = set(re.findall(r"asset:([\w.-]+)", md))
    on_disk = {p.name for p in ASSET_DIR.glob("*.png")}

    problems = []
    for name in sorted(referenced - on_disk):
        problems.append(f"markdown references {name}, which is not in assets/")
    for name in sorted(on_disk - referenced):
        problems.append(f"assets/{name} is never referenced by the markdown")

    assets = {}
    for name in sorted(referenced & on_disk):
        raw = (ASSET_DIR / name).read_bytes()
        if len(raw) > MAX_ASSET_BYTES:
            problems.append(
                f"{name} is {len(raw) / 1024 / 1024:.2f} MiB, over the 4 MiB cap"
            )
        assets[name] = base64.b64encode(raw).decode()

    css = ""
    if CSS_PATH.exists():
        css = CSS_PATH.read_text()
        if css.count("/*") != css.count("*/"):
            problems.append(
                f"stylesheet comment imbalance: {css.count('/*')} '/*' vs "
                f"{css.count('*/')} '*/' — every rule after the unclosed one "
                "would be swallowed"
            )
    else:
        problems.append(f"no stylesheet at {CSS_PATH}")

    if problems:
        print("REFUSING TO BUILD A BROKEN PAYLOAD:", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    payload = {
        "slug": args.slug,
        "title": title,
        "visibility": args.visibility,
        "content": md,
        "assets": assets,
        "css_content": css,
    }
    out = pathlib.Path(args.out)
    out.write_text(json.dumps(payload))

    blocks = md.split("\n---\n")
    print(f"wrote {out}")
    print(f"  title       {title}")
    print(f"  slug        {args.slug}  ({args.visibility})")
    print(f"  slides      {len(blocks) - 1}  ({len(blocks)} markdown blocks)")
    print(f"  assets      {len(assets)}")
    print(f"  stylesheet  {len(css):,} bytes")
    print(f"  payload     {out.stat().st_size / 1024 / 1024:.2f} MiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
