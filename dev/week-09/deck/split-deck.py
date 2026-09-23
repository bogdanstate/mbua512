#!/usr/bin/env python3
"""Derive the two week-9 decks from the single source `deck.md`.

    python3 split-deck.py            # write deck-a.md and deck-b.md
    python3 split-deck.py --check    # exit 1 if they are stale

WHY ONE SOURCE AND NOT TWO FILES
--------------------------------
Instructor, 2026-09-23: split week 9 into a correlation deck and a
regression/ML deck. The obvious way is to cut `deck.md` in half and keep two
files. This keeps ONE source instead, because the two decks are not
independent: they share a stylesheet, a figure set, a house style for the SQL
fences, and — most importantly — a LADDER. The ladder's rungs run 0..23 across
both decks (plan SS5.3), so a change to how rung 12 builds r has to be visible
to whoever is editing rung 16 in the other deck. Two files make that a
cross-file edit nobody remembers to do.

So `deck.md` stays the single source and carries ONE marker line:

    <!-- DECK-SPLIT: b -->

Everything before it is deck A, everything from that block on is deck B. The
marker sits on the "Regression Analysis" SECTION slide, which is deck B's
natural opener.

WHAT THIS SCRIPT ADDS THAT A PLAIN CUT DOES NOT
-----------------------------------------------
1. **Each deck gets its own front matter and title.** The combined deck's
   title ("Correlation & Regression") is wrong for both halves.

2. **Each deck gets its own title slide**, carrying the deck title and
   "MBUA 512" only (the repo rule), rather than deck B inheriting deck A's.

3. **Deck B gets a RECAP slide.** Deck B opens after the SQL ladder has
   already built r from plain aggregates over six slides, and its first
   regression rung (slope = r * sy/sx) has nothing to stand on without it. The
   recap re-shows deck A's final r query so the slope slide has something to
   build from. It is the same query, not a retyped one: it is lifted from the
   source by its marker.

4. **Assets are reported per deck**, so each upload carries only what its own
   slides reference (the platform scopes assets to a deck).
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
SOURCE = HERE / "deck.md"
OUT_A = HERE / "deck-a.md"
OUT_B = HERE / "deck-b.md"

MARKER = "<!-- DECK-SPLIT: b -->"

DECKS = {
    "a": {
        "slug": "mbua512-week-09a-correlation",
        "title": "Multivariate Relationships and Correlation",
        "out": OUT_A,
    },
    "b": {
        "slug": "mbua512-week-09b-regression",
        "title": "Regression and Prediction",
        "out": OUT_B,
    },
}

# The block in deck A whose query deck B recaps: the "point it at anything"
# slide, i.e. the last rung of the r ladder. Matched by a distinctive line
# rather than an index, so inserting a slide in deck A does not silently
# recap the wrong query.
RECAP_ANCHOR = "-- <- change only this block"


def front_matter(title: str) -> str:
    return (
        "---\n"
        "marp: true\n"
        "theme: mbua512\n"
        "paginate: true\n"
        f'title: "MBUA512 — {title}"\n'
        "---\n"
    )


def title_slide(title: str) -> str:
    return (
        "\n<!-- _class: title -->\n\n"
        f"# {title}\n\n"
        "## MBUA 512\n"
    )


def build_recap(blocks: list[str]) -> str:
    """Deck B's opening recap: deck A's final r query, re-shown.

    Deck B's first new idea is `slope = r * sy / sx`, which is meaningless
    unless the audience has r. In the combined deck r was built over six
    slides immediately before; split apart, deck B needs to carry the finished
    article with it. Query and pinned result only, like every other data slide
    — the explanation is in the speaker notes.
    """
    src = next((b for b in blocks if RECAP_ANCHOR in b), None)
    if src is None:
        raise SystemExit(
            "could not find the r-ladder payoff slide to recap "
            f"(looked for {RECAP_ANCHOR!r} in deck.md)"
        )
    fence = re.search(r"```sql-live([^\n]*)\n(.*?)```", src, re.S)
    if not fence:
        raise SystemExit("the recap source slide has no sql-live fence")
    info, sql = fence.group(1), fence.group(2)
    # Point the recap at the dataset the REST of deck B uses (housing), not
    # fire_incidents: deck B is about the regression on floor area and price,
    # and the slope rung two slides later fits exactly these rows.
    sql = sql.replace(
        "SELECT meters_run AS x, opinion AS y      -- <- change only this block\n"
        "  FROM   marathon_opinion",
        "SELECT sqm AS x, price_k AS y\n  FROM   housing",
    )
    return (
        "```sql-live" + info + "\n" + sql + "```\n\n"
        "<!-- r in SQL — where we got to -->\n"
        "<!-- The correlation deck built this query one piece at a time: "
        "deviations, their products, their squares, then a square root. "
        "This is the finished article, pointed at the housing data the rest of "
        "this deck uses. Expect r = 0.939. -->\n"
        "<!-- Everything that follows turns this single number into a LINE: "
        "the slope is r rescaled from SD units into real ones, and the "
        "intercept follows from the means. -->\n"
    )


def split_blocks(source: str) -> list[str]:
    """Split on slide separators, IGNORING any `---` inside a fenced block.

    A bare `---` inside a fence is CONTENT, not a separator — the platform's
    own parser tracks fence state for exactly this reason, and this deck is
    the case that proves it: the `annotated-code` exhibit holds R's
    `summary(lm)` output, which prints a literal `---` line before
    `Signif. codes`. A naive `source.split("\\n---\\n")` cuts that exhibit in
    half, and the two halves then travel into different slides.

    That is not hypothetical: the first version of this script did exactly
    that, and it took a slide-count mismatch (39 source blocks, 38 rendered)
    to notice, because the platform rejoins them into one slide and renders
    something that looks almost right.
    """
    lines = source.replace("\r\n", "\n").split("\n")
    blocks: list[list[str]] = [[]]
    fence: str | None = None
    for line in lines:
        m = re.match(r"^\s*(`{3,}|~{3,})(.*)$", line)
        if m:
            marker, info = m.group(1), m.group(2)
            if fence is None:
                fence = marker
            elif marker[0] == fence[0] and len(marker) >= len(fence) and not info.strip():
                fence = None
            blocks[-1].append(line)
            continue
        if fence is None and line.strip() == "---":
            blocks.append([])
            continue
        blocks[-1].append(line)
    return ["\n".join(b).strip("\n") for b in blocks]


def split(source: str) -> dict[str, str]:
    blocks = split_blocks(source)
    # With fence-aware splitting the leading `---` of the front matter yields
    # an empty block 0; block 1 is the front matter, block 2 the title slide.
    while blocks and not blocks[0].strip():
        blocks.pop(0)
    assert blocks[0].lstrip().startswith("marp:"), blocks[0][:60]
    body = blocks[1:]
    cut = next((i for i, b in enumerate(body) if MARKER in b), None)
    if cut is None:
        raise SystemExit(f"no {MARKER!r} in {SOURCE.name}")

    a_body = [b for b in body[:cut] if "_class: title" not in b]
    b_body = [b.replace(MARKER, "").lstrip("\n") for b in body[cut:]]

    out = {}
    out["a"] = (
        front_matter(DECKS["a"]["title"])
        + title_slide(DECKS["a"]["title"])
        + "\n---\n"
        + "\n---\n".join(a_body)
    )
    out["b"] = (
        front_matter(DECKS["b"]["title"])
        + title_slide(DECKS["b"]["title"])
        + "\n---\n"
        + b_body[0]
        + "\n---\n"
        + build_recap(body)
        + "\n---\n"
        + "\n---\n".join(b_body[1:])
    )
    return out


def assets_of(text: str) -> set[str]:
    return set(re.findall(r"asset:([\w.-]+)", text))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if the derived decks are stale")
    args = ap.parse_args()

    source = SOURCE.read_text()
    built = split(source)

    if args.check:
        for key, text in built.items():
            path = DECKS[key]["out"]
            if not path.exists() or path.read_text() != text:
                print(f"STALE: {path.name} — re-run: python3 split-deck.py",
                      file=sys.stderr)
                return 1
        print("ok — deck-a.md and deck-b.md match deck.md")
        return 0

    total_assets = assets_of(source)
    for key, text in built.items():
        path = DECKS[key]["out"]
        path.write_text(text)
        n = len(text.split("\n---\n")) - 1
        used = assets_of(text)
        fences = text.count("```sql-live")
        print(f"wrote {path.name}")
        print(f"  slug     {DECKS[key]['slug']}")
        print(f"  title    {DECKS[key]['title']}")
        print(f"  slides   {n}")
        print(f"  sql      {fences} fence(s)")
        print(f"  assets   {len(used)}")

    a, b = assets_of(built["a"]), assets_of(built["b"])
    shared = a & b
    orphan = total_assets - a - b
    print(f"\nassets: {len(a)} in A, {len(b)} in B, "
          f"{len(shared)} shared, {len(orphan)} unused")
    if shared:
        print(f"  shared: {', '.join(sorted(shared))}")
    if orphan:
        print(f"  UNUSED BY EITHER DECK: {', '.join(sorted(orphan))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
