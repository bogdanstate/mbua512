#!/usr/bin/env python3
"""Carry pinned sql-live results from a LIVE deck onto a rebuilt one.

    python3 carry-pins.py --live live.md --into deck.md [--out deck.md]

WHY THIS EXISTS
---------------
`Pin result` does not store rows in a side table keyed by slide number. It
writes them INTO THE DECK SOURCE, straight after the fence, bracketed by two
invisible link-definition lines:

    [//]: # (sql-live result: …provenance…)
    | col | col |
    | --- | --- |
    …
    [//]: # (end sql-live result)

That is a good design — the pinned table is ordinary markdown that students,
the MARP render and a PR all carry. But it has a consequence that is easy to
miss and expensive to get wrong: **the pins live only in the deployed deck.**
The authoring source in this repo has never carried them, because pinning
happens in the browser against a running tier.

So a plain re-upload of a rebuilt `deck.md` REPLACES the deployed content and
silently deletes every pin. On prod that matters more than anywhere else:
students never execute a query, so a pinned table is the only data their
browser ever sees. A slide whose pin has been wiped shows them SQL and nothing.

Caught on 2026-09-24 while moving three threads into an appendix: prod carried
18 pin blocks, dev carried 0, and the local source carried 0.

HOW IT MATCHES
--------------
By the SQL text of the fence, normalised for whitespace — never by position,
because the whole point of the operation that needs this script is that slides
moved. A pin is carried only when exactly one fence in each deck has that SQL;
anything ambiguous or unmatched is reported and left alone rather than guessed.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

FENCE_RE = re.compile(r"```sql-live([^\n]*)\n(.*?)```", re.S)
PIN_RE = re.compile(
    r"\n*\[//\]: # \(sql-live result:.*?\[//\]: # \(end sql-live result\)",
    re.S,
)


def norm(sql: str) -> str:
    """Whitespace-insensitive key for a query."""
    return re.sub(r"\s+", " ", sql.strip())


def pins_by_sql(text: str) -> dict[str, str]:
    """Map normalised SQL -> the pin block that follows its fence."""
    out: dict[str, list[str]] = {}
    for m in FENCE_RE.finditer(text):
        after = text[m.end():]
        pm = PIN_RE.match(after)
        if not pm:
            continue
        out.setdefault(norm(m.group(2)), []).append(pm.group(0).strip("\n"))
    # Only unambiguous matches are usable.
    return {k: v[0] for k, v in out.items() if len(v) == 1}


def strip_pins(text: str) -> str:
    return PIN_RE.sub("", text)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--live", required=True, help="deck content pulled from the tier")
    ap.add_argument("--into", required=True, help="the rebuilt local deck")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    live = pathlib.Path(args.live).read_text()
    into = pathlib.Path(args.into).read_text()
    out_path = pathlib.Path(args.out or args.into)

    pins = pins_by_sql(live)
    print(f"{len(pins)} pinned result(s) found in {args.live}")

    into = strip_pins(into)

    carried, missing = 0, []
    pieces: list[str] = []
    last = 0
    for m in FENCE_RE.finditer(into):
        key = norm(m.group(2))
        pieces.append(into[last:m.end()])
        last = m.end()
        if key in pins:
            pieces.append("\n\n" + pins.pop(key))
            carried += 1
        else:
            first = m.group(2).strip().split("\n")[0][:56]
            missing.append(first)
    pieces.append(into[last:])
    out_path.write_text("".join(pieces))

    print(f"carried {carried} pin(s) onto {out_path.name}")
    if missing:
        print(f"\n{len(missing)} fence(s) with NO pin to carry "
              f"(they need a fresh Run+Pin on the tier):")
        for s in missing:
            print(f"  - {s}")
    if pins:
        print(f"\n{len(pins)} pin(s) in the live deck matched NO fence here "
              "(their query changed, or the slide is gone):")
        for k in pins:
            print(f"  - {k[:70]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
