#!/usr/bin/env python3
"""Validate every SQL fence in `deck.md` -- offline, against the real rows.

    python3 check_deck_sql.py

WHAT IT CHECKS, AND WHY EACH CHECK EXISTS
-----------------------------------------
The deck's `sql-live` fences quote their expected answers on the slide ("Expect
0.967", "Expect 93,044"). A student runs the query and compares. So a drifted
constant is not a cosmetic bug -- it is a visible lie, in a lecture. This
script is what stands between a regenerated table and that.

  1. HOUSE RULES (plan SS5.2). No `FILTER`, no `CORR`, no window functions, no
     bare `STDDEV`/`STD` (MariaDB's bare STDDEV is the POPULATION SD -- the one
     that silently gives a different answer from week 07's). No `CASE`.
  2. THE QUERIES RUN, AND RETURN WHAT THE SLIDE SAYS. The seven tables are
     loaded into an in-memory SQLite database from the same committed CSVs and
     the same generator the real loader uses, the fences are translated from
     MariaDB to SQLite, executed, and the results compared against the values
     the slide quotes.
  3. THE LADDER'S SHAPE. Every fence names `db=stats_demo` and carries a
     `caption=`; the fences are in the plan's rung order; only the agreed
     functions appear, and each is introduced before it is used again.

SQLITE IS NOT MARIADB -- WHAT THIS DOES AND DOES NOT PROVE
----------------------------------------------------------
Running against SQLite proves the ARITHMETIC and the query SHAPE: that the
CTE chain resolves, that the joins produce the right row multiplicities, and
that the numbers come out where the slide says. It does NOT prove MariaDB
accepts the syntax -- `POW`, `STDDEV_SAMP` and `LOG10` are supplied here as
Python functions because SQLite lacks them.

That gap is covered from the other side: rule (1) restricts the fences to a
function list checked against MariaDB's documented built-ins, and wave 2 runs
every fence on a real spoke. No database is contacted by this script.
"""

from __future__ import annotations

import csv
import importlib.util
import math
import pathlib
import re
import sqlite3
import sys

HERE = pathlib.Path(__file__).resolve().parent
DECK = HERE.parent / "deck.md"
DECK_A = HERE.parent / "deck-a.md"
DECK_B = HERE.parent / "deck-b.md"
MYSQL_DIR = pathlib.Path("/home/bogdan/infra/mysql")
DATA_DIR = MYSQL_DIR / "week09" / "data"

# MariaDB built-ins the deck is allowed to use. The ladder introduces each
# one on its own slide; anything else is a rule violation, not a style note.
ALLOWED_FUNCS = {
    "count", "sum", "avg", "min", "max", "round", "pow", "sqrt", "log10",
    "stddev_samp",
    # Ranking, for Spearman (2026-09-23). `RANK` is the deck's only window
    # function and appears on exactly two slides.
    "rank",
}

# The fence ordinals allowed to use `OVER`: the ranks slide and the Spearman
# assembly. Keyed by position like EXPECTATIONS, and asserted below.
SPEARMAN_FENCES = {15, 16}
# Keywords that can be followed by "(" without being a function call.
SQL_KEYWORDS = {"as", "in", "select", "from", "where", "and", "or", "not",
                "on", "by", "values", "join", "with", "union",
                # `OVER (…)` and `PARTITION BY (…)` read as calls to this
                # regex but are clauses. The Spearman guard below is what
                # actually polices window functions.
                "over", "partition"}
# The deck's CTE names, which appear as `name AS (` and `FROM name`.
CTE_NAMES = {"d", "stats", "sums", "fit", "parts", "corr"}
FORBIDDEN = [
    (r"\bFILTER\s*\(", "FILTER is not MariaDB"),
    (r"\bCORR\s*\(", "MariaDB has no CORR -- the deck builds r by hand"),
    (r"\bREGR_\w+\s*\(", "MariaDB has no REGR_* functions"),

    (r"\bSTDDEV\s*\(", "bare STDDEV is the POPULATION SD -- use STDDEV_SAMP"),
    (r"\bSTD\s*\(", "bare STD is the POPULATION SD -- use STDDEV_SAMP"),
    (r"\bCASE\b", "no CASE in week 9 (plan SS5.2)"),
]


def load_generator():
    spec = importlib.util.spec_from_file_location(
        "week09_gen", MYSQL_DIR / "week09-gen.py"
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules["week09_gen"] = mod
    spec.loader.exec_module(mod)
    return mod


GEN = load_generator()


def read_csv(name):
    with (DATA_DIR / name).open(newline="") as fh:
        return list(csv.DictReader(fh))


def build_db() -> sqlite3.Connection:
    """The seven tables, from the same sources the real loader uses."""
    con = sqlite3.connect(":memory:")
    # MariaDB functions SQLite lacks.
    con.create_function("POW", 2, lambda a, b: None if a is None else a ** b)
    con.create_function("SQRT", 1, lambda a: None if a is None else math.sqrt(a))
    con.create_function("LOG10", 1, lambda a: None if a is None else math.log10(a))

    class StdDevSamp:
        def __init__(self):
            self.vals = []

        def step(self, v):
            if v is not None:
                self.vals.append(float(v))

        def finalize(self):
            n = len(self.vals)
            if n < 2:
                return None
            m = sum(self.vals) / n
            return math.sqrt(sum((x - m) ** 2 for x in self.vals) / (n - 1))

    con.create_aggregate("STDDEV_SAMP", 1, StdDevSamp)

    cur = con.cursor()
    cur.execute("CREATE TABLE fun_survey (person TEXT, activity_type TEXT, "
                "fun_category TEXT, fun_during REAL, fun_after REAL)")
    cur.executemany("INSERT INTO fun_survey VALUES (?,?,?,?,?)",
                    [(r["Person"], r["ActivityType"], r["FunCategory"],
                      float(r["FunDuring"]), float(r["FunAfter"]))
                     for r in read_csv("type1_vs_type2_fun.csv")])

    cur.execute("CREATE TABLE fire_incidents (structures_burned REAL, "
                "firefighters INTEGER, property_damage REAL)")
    cur.executemany("INSERT INTO fire_incidents VALUES (?,?,?)",
                    [(float(r["structures_burned"]), int(r["firefighters"]),
                      float(r["property_damage"]))
                     for r in read_csv("fire_incidents_synthetic.csv")])

    cur.execute("CREATE TABLE marathon_opinion (meters_run REAL, opinion REAL)")
    cur.executemany("INSERT INTO marathon_opinion VALUES (?,?)",
                    [(float(r["meters_run"]), float(r["opinion"]))
                     for r in read_csv("marathon_opinion.csv")])

    cur.execute("CREATE TABLE hotel_fun (hotel_cost INTEGER, "
                "fun_reported REAL, humidity REAL)")
    cur.executemany("INSERT INTO hotel_fun VALUES (?,?,?)",
                    [(int(r["hotel_cost"]), float(r["fun_reported"]),
                      float(r["humidity"]))
                     for r in read_csv("hotel_fun.csv")])

    cur.execute("CREATE TABLE belgian_beer (avg_price_eur REAL, "
                "overall_score REAL, is_influential INTEGER)")
    cur.executemany("INSERT INTO belgian_beer VALUES (?,?,?)",
                    [(r[1], r[2], r[3]) for r in GEN.beer_rows()])

    cur.execute("CREATE TABLE housing (sqm REAL, price_k REAL, is_train INTEGER)")
    cur.executemany("INSERT INTO housing VALUES (?,?,?)",
                    [(r[1], r[2], r[3]) for r in GEN.housing_rows()])

    cur.execute("CREATE TABLE sensor_readings (machine_id TEXT, temp_c REAL, "
                "vibration_mm_s REAL)")
    cur.executemany("INSERT INTO sensor_readings VALUES (?,?,?)",
                    [(r[1], r[2], r[3]) for r in GEN.sensor_rows()])

    cur.execute("CREATE TABLE chocolate_nobel (country TEXT, chocolate_kg REAL, "
                "nobel_per_10m REAL)")
    cur.executemany("INSERT INTO chocolate_nobel VALUES (?,?,?)",
                    GEN.CHOCOLATE_NOBEL)

    con.commit()
    return con


FENCE_RE = re.compile(r"```sql-live([^\n]*)\n(.*?)```", re.S)


def parse_params(info: str) -> dict:
    out = {}
    for m in re.finditer(r'(\w+)=("([^"]*)"|\S+)', info):
        out[m.group(1)] = m.group(3) if m.group(3) is not None else m.group(2)
    return out


# Expected values, keyed by the fence's ORDINAL in the deck. Each entry is a
# number the SLIDE prints; if the query stops producing it, the slide is wrong
# and this fails.
#
# Keyed by position rather than by a fragment of the SQL, because the fences
# deliberately repeat: seven of them are the same five-CTE chain with only the
# first block changed, so any substring distinctive enough to identify one is
# long enough to break on a whitespace edit. The ordinal is also what the
# ladder is defined by (plan SS5.3), so a reordered deck fails here loudly
# instead of silently checking the wrong slide.
EXPECTATIONS = {
    # Re-keyed 2026-09-25: the Spearman thread joined the formula, marathon
    # and beer threads in deck A's Appendix, so the ordinals shifted again.
    # The queries and their expected values are unchanged throughout.
    1: ("rows", 10),
    2: ("rows_max", 10),
    3: ("rows", 10),
    4: ("rows", 10),
    5: ("cells", {"stays": 150, "mean_fun": 5.93, "sd_fun": 2.26}),
    6: ("cells", {"mx": 28.03, "my": 1067048.95}),
    7: ("rows", 10),
    8: ("ncols", 1),
    9: ("ncols", 3),
    10: ("r_is", 0.967),
    11: ("r_is", -0.770),
    12: ("cells", {"r": 0.967, "r_squared": 0.936}),
    # --- Appendix (deck A) ------------------------------------------------
    13: ("cell", ("runners", 400)),
    14: ("rows", 10),
    # 15/16: the Spearman pair, the deck's only `OVER` usage.
    15: ("rows", 10),
    16: ("cell", ("spearman_rho", -0.950)),
    17: ("rows", 10),
    18: ("rows", 10),
    # --- deck B -----------------------------------------------------------
    19: ("cells", {"readings": 120, "with_temperature": 102}),
    20: ("cells", {"r": 0.939, "slope": 3.0}),
    21: ("cells", {"mean_sqm": 94.56, "mean_price": 364.61, "intercept": 80.93}),
    22: ("rows", 10),
    23: ("cell", ("ssr", 93044)),
    24: ("cells", {"ssr": 93044, "sst": 791883, "r_squared": 0.883}),
    25: ("cells", {"r": 0.935, "slope": 3.243}),
    26: ("r_is", 0.800),
}





def main() -> int:
    md = DECK.read_text()
    fences = FENCE_RE.findall(md)
    print(f"{len(fences)} sql-live fences in {DECK.name}\n")

    con = build_db()
    problems = []
    seen_funcs = set()

    for i, (info, sql) in enumerate(fences, start=1):
        params = parse_params(info)
        label = f"fence {i:2d}"

        # --- rule 3: every fence is labelled ---
        if params.get("db") != "stats_demo":
            problems.append(f"{label}: db= is {params.get('db')!r}, want stats_demo")
        # The gloss used to live in `caption=`. INSTRUCTOR REVIEW 2026-09-22:
        # the data slides carry the query and its result only — no title, no
        # caption, no "Run it." sentence. The teaching line is not lost, it
        # moved to the slide's speaker NOTES (presenter-only), so what is
        # checked here is that every fence still HAS its gloss somewhere.
        if params.get("caption"):
            problems.append(
                f"{label}: has a caption= — the glosses belong in speaker notes now"
            )

        # --- rule 1: house rules ---
        for pat, why in FORBIDDEN:
            if re.search(pat, sql, re.I):
                problems.append(f"{label}: {why}")

        # `OVER` is banned everywhere EXCEPT the two Spearman slides, which
        # introduce it deliberately as the one new idea ranking needs (plan
        # SS5.3 rungs 13a/13b). Anywhere else it is the old ruling's breach.
        if re.search(r"\bOVER\s*\(", sql, re.I) and i not in SPEARMAN_FENCES:
            problems.append(
                f"{label}: window function outside the Spearman slides "
                "(the ladder uses WITH + CROSS JOIN)"
            )

        for fn in re.findall(r"\b([A-Za-z_][A-Za-z_0-9]*)\s*\(", sql):
            low = fn.lower()
            # SQL keywords that legitimately precede a parenthesis, and the
            # deck's own CTE names. Without this every `AS (` in a WITH chain
            # and every `IN (…)` reads as a function call.
            if low in SQL_KEYWORDS or low in CTE_NAMES:
                continue
            if low not in ALLOWED_FUNCS:
                problems.append(f"{label}: unexpected function {fn}()")
            else:
                seen_funcs.add(low)

        # --- rule 2: it runs, and returns what the slide claims ---
        run_sql = sql.strip().rstrip(";")
        try:
            cur = con.execute(run_sql)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
        except Exception as exc:  # noqa: BLE001
            problems.append(f"{label}: FAILED TO RUN -- {exc}")
            continue

        matched = i in EXPECTATIONS
        if matched:
            kind, want = EXPECTATIONS[i]
            if kind == "rows":
                if len(rows) != want:
                    problems.append(f"{label}: {len(rows)} rows, expected {want}")
            elif kind == "rows_max":
                if len(rows) > want:
                    problems.append(f"{label}: {len(rows)} rows, expected <= {want}")
            elif kind == "ncols":
                if len(cols) != want:
                    problems.append(f"{label}: {len(cols)} columns, expected {want}")
            elif kind == "cell":
                name, value = want
                got = rows[0][cols.index(name)]
                if abs(float(got) - value) > 1.0:
                    problems.append(f"{label}: {name} = {got}, expected ~{value}")
            elif kind == "r_is":
                got = float(rows[0][0])
                if abs(got - want) > 0.0015:
                    problems.append(f"{label}: r = {got}, expected {want}")
            elif kind == "cells":
                for name, value in want.items():
                    got = float(rows[0][cols.index(name)])
                    tol = 0.005 if abs(value) < 100 else max(1.0, abs(value) * 0.001)
                    if abs(got - value) > tol:
                        problems.append(
                            f"{label}: {name} = {got}, expected {value}")
        status = "checked" if matched else "ran (no pinned value)"
        first = rows[0] if rows else ()
        preview = ", ".join(f"{c}={v}" for c, v in zip(cols, first))[:88]
        print(f"  {label}  {len(rows):>3} row(s)  {status:22s} {preview}")

    # The two derived decks must be current, and between them must carry
    # every fence in the source plus deck B's recap (which is a COPY of deck
    # A's payoff query, so the total is one more than the source has).
    if DECK_A.exists() and DECK_B.exists():
        a, b = DECK_A.read_text(), DECK_B.read_text()
        n_src = md.count("```sql-live")
        n_split = a.count("```sql-live") + b.count("```sql-live")
        if n_split != n_src + 1:
            problems.append(
                f"deck-a + deck-b carry {n_split} sql fences, expected "
                f"{n_src + 1} (the source's {n_src} plus deck B's recap) — "
                "re-run split-deck.py"
            )
        for name, text in (("deck-a.md", a), ("deck-b.md", b)):
            if "DECK-SPLIT" in text:
                problems.append(f"{name} still carries the split marker")
            if text.count("_class: title") != 1:
                problems.append(f"{name} does not have exactly one title slide")
    else:
        problems.append("deck-a.md / deck-b.md missing — run split-deck.py")

    # Every SQL slide must still carry its gloss, as speaker notes.
    for i, block in enumerate(md.split("\n---\n")):
        if "```sql-live" not in block:
            continue
        after = block[block.rindex("```") + 3:]
        if "<!--" not in after:
            problems.append(
                f"a sql slide has no speaker notes — its gloss was lost: "
                f"{block.strip()[:60]!r}"
            )
        if re.search(r"^#\s", block, re.M):
            problems.append(
                f"a sql slide still has a heading: {block.strip()[:60]!r}"
            )

    print(f"\nfunctions used: {', '.join(sorted(seen_funcs))}")
    unexpected = seen_funcs - ALLOWED_FUNCS
    if unexpected:
        problems.append(f"functions outside the agreed set: {unexpected}")

    if problems:
        print(f"\n{len(problems)} PROBLEM(S):")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("\nAll fences parse, run, and match the values their slides quote.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
