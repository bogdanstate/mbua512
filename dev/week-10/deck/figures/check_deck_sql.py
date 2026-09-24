#!/usr/bin/env python3
"""Validate every SQL fence in `deck.md` — offline, against the real rows.

    python3 check_deck_sql.py

Adapted from the week-9 deck's script of the same name. Same job, same three
rules, a different ladder and a different answer key.

WHAT IT CHECKS, AND WHY EACH CHECK EXISTS
-----------------------------------------
The deck's speaker notes quote their expected answers ("Expect 14,423 buyers in
`ad`", "Expect z 7.370"). The presenter reads those out while the query runs on
the screen. So a drifted constant is not a cosmetic bug — it is a visible error,
in a lecture, in front of the class.

  1. HOUSE RULES. The week-9 rules, minus the one week 10 deliberately breaks:
     `CASE` is now ALLOWED, because `SUM(CASE WHEN … THEN 1 ELSE 0 END)` is
     rung 28 and one of the two new ideas in this deck. Everything else stands:
     no `FILTER`, no `CORR`/`REGR_*`, no bare `STDDEV`/`STD`, and — new here —
     **no `RAND()`**, because a pinned answer must be the same for every
     student and on paper.
  2. THE QUERIES RUN, AND RETURN WHAT THE NOTES CLAIM. Both tables are loaded
     into an in-memory SQLite database from the same generators the real loader
     uses, the fences are executed, and the results compared against the
     answer key.
  3. THE LADDER'S SHAPE. Every fence names `db=stats_demo`, none carries a
     `caption=` (the glosses live in speaker notes — instructor review
     2026-09-22), only agreed functions appear, and **`ABS` is the only new
     built-in in the deck**, introduced at rung 31 and not used before it.

SQLITE IS NOT MARIADB — WHAT THIS DOES AND DOES NOT PROVE
----------------------------------------------------------
Running against SQLite proves the ARITHMETIC and the query SHAPE. It does NOT
prove MariaDB accepts the syntax. That gap is covered from the other side:
rule (1) restricts the fences to a checked function list, and the deck's own
pin pass runs every fence on the real dev spoke through the platform.

One SQLite-vs-MariaDB difference matters and is handled explicitly: SQLite's
`/` on two integers is INTEGER division, MariaDB's is decimal. Every rate in
this deck would come out 0 under SQLite's rule. Rather than rewrite the slides
to dodge it (which would make the check test different SQL from the lecture),
the columns are declared REAL where a division touches them and the guard
below asserts no rate came back as an integer 0.

NOTHING HERE CONTACTS A DATABASE.
"""

from __future__ import annotations

import importlib.util
import math
import pathlib
import re
import sqlite3
import sys

HERE = pathlib.Path(__file__).resolve().parent
DECK = HERE.parent / "deck.md"
MYSQL_DIR = pathlib.Path("/home/bogdan/infra/mysql")

# MariaDB built-ins the deck is allowed to use. The ladder introduces each
# new one on its own slide; anything else is a rule violation, not a style
# note. Week 10 adds exactly ONE to week 9's list: ABS.
ALLOWED_FUNCS = {
    "count", "sum", "avg", "min", "max", "round", "sqrt",
    # the one new built-in in the whole deck (rung 31)
    "abs",
}

# The fence ordinal at which ABS is introduced. Before it, ABS must not
# appear — the deck's claim that it is "the ONE new built-in" is only true
# if it is also introduced where the notes say it is.
ABS_INTRODUCED_AT = 8

SQL_KEYWORDS = {"as", "in", "select", "from", "where", "and", "or", "not",
                "on", "by", "values", "join", "with", "union", "case",
                "when", "then", "else", "end", "group", "order", "limit"}
# The deck's CTE names, which appear as `name AS (` and `FROM name`.
CTE_NAMES = {"arms", "pooled", "rates"}

FORBIDDEN = [
    (r"\bFILTER\s*\(", "FILTER is not MariaDB"),
    (r"\bCORR\s*\(", "MariaDB has no CORR"),
    (r"\bREGR_\w+\s*\(", "MariaDB has no REGR_* functions"),
    (r"\bSTDDEV\s*\(", "bare STDDEV is the POPULATION SD -- use STDDEV_SAMP"),
    (r"\bSTD\s*\(", "bare STD is the POPULATION SD -- use STDDEV_SAMP"),
    # New in week 10, and the reason is pedagogical rather than dialectal:
    # the simulations live in the FIGURES, where they are seeded. A RAND() on
    # a slide would give every student a different pinned answer and break
    # the deck's determinism contract (research doc SS4.2).
    (r"\bRAND\s*\(", "no RAND() on a slide -- pinned answers must be deterministic"),
    (r"\bOVER\s*\(", "no window functions in week 10"),
]


def load_generator(filename: str, modname: str):
    spec = importlib.util.spec_from_file_location(modname, MYSQL_DIR / filename)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[modname] = mod
    spec.loader.exec_module(mod)
    return mod


def build_db() -> sqlite3.Connection:
    """Both tables, from the same generators the real loader uses."""
    con = sqlite3.connect(":memory:")
    con.create_function("SQRT", 1, lambda a: None if a is None else math.sqrt(a))
    con.create_function("ABS", 1, lambda a: None if a is None else abs(a))

    cur = con.cursor()

    # REAL, not INTEGER, on every column a rate is computed from: SQLite would
    # otherwise do integer division and hand back 0 for every conversion rate
    # in the deck. MariaDB's `/` is decimal, so this makes SQLite agree with
    # the database the slides actually run against rather than changing the
    # SQL to suit SQLite.
    marketing = load_generator("week10-marketing-gen.py", "week10_marketing_gen")
    rows = marketing.marketing_rows()
    cur.execute("CREATE TABLE ab_marketing (user_id INTEGER, test_group TEXT, "
                "converted REAL, total_ads REAL, most_ads_day TEXT, "
                "most_ads_hour INTEGER)")
    cur.executemany("INSERT INTO ab_marketing VALUES (?,?,?,?,?,?)", rows)
    print(f"  ab_marketing    {len(rows):,} rows")

    cookie = load_generator("week10-gen.py", "week10_gen")
    crows = cookie.cookie_cats_rows()
    cur.execute("CREATE TABLE ab_cookie_cats (userid INTEGER, version TEXT, "
                "sum_gamerounds REAL, retention_1 REAL, retention_7 REAL)")
    cur.executemany("INSERT INTO ab_cookie_cats VALUES (?,?,?,?,?)", crows)
    print(f"  ab_cookie_cats  {len(crows):,} rows")

    con.commit()
    return con


FENCE_RE = re.compile(r"```sql-live([^\n]*)\n(.*?)```", re.S)


def parse_params(info: str) -> dict:
    out = {}
    for m in re.finditer(r'(\w+)=("([^"]*)"|\S+)', info):
        out[m.group(1)] = m.group(3) if m.group(3) is not None else m.group(2)
    return out


# Expected values, keyed by the fence's ORDINAL in the deck, exactly as week 9
# does and for the same reason: the fences deliberately repeat (the marketing
# z-chain and the Cookie Cats z-chain differ only in the table and the column),
# so any SQL substring distinctive enough to identify one is long enough to
# break on a whitespace edit. The ordinal is also what the ladder is defined
# by, so a reordered deck fails loudly here instead of silently checking the
# wrong slide.
#
# Every value below comes from `mysql/week10/README.md` SS3, which is itself
# re-derived from the generated rows by `week10-gen.py --report` and
# `week10-marketing-gen.py --report` and asserted by their test suites.
EXPECTATIONS = {
    #  rung 24 — one row per person
    1: ("rows", 10),
    #  rung 25 — arm sizes
    2: ("arm_cells", {"ad": {"people": 564577}, "psa": {"people": 23524}}),
    #  rung 26 — SUM of a 0/1 column
    3: ("arm_cells", {"ad": {"people": 564577, "buyers": 14423},
                      "psa": {"people": 23524, "buyers": 420}}),
    #  rung 27 — the conversion rate per arm
    4: ("arm_cells", {"ad": {"rate": 0.0255}, "psa": {"rate": 0.0179}}),
    #  rung 28 — CASE WHEN as a counter
    5: ("cells", {"ad_people": 564577, "psa_people": 23524,
                  "everyone": 588101}),
    #  rung 29 — four counts and the pooled rate
    6: ("cells", {"k_ad": 14423, "n_ad": 564577, "k_psa": 420,
                  "n_psa": 23524, "pooled": 0.025239}),
    #  rung 30 — the standard error
    7: ("cells", {"pooled": 0.025239, "se": 0.001044}),
    #  rung 31 — z  (ABS introduced here)
    8: ("cells", {"rate_ad": 0.0255, "rate_psa": 0.0179, "z": 7.370}),
    #  rung 32 — a 95 % interval per arm
    9: ("arm_cells", {"ad": {"rate": 0.0255, "lo": 0.0251, "hi": 0.0260},
                      "psa": {"rate": 0.0179, "lo": 0.0162, "hi": 0.0195}}),
    # rung 33 — the confounder, within the ad arm
    10: ("conv_cells", {0: {"mean_ads": 23.3}, 1: {"mean_ads": 83.9}}),
    # rung 34 — day-7 retention by arm (Cookie Cats)
    11: ("arm_cells", {"gate_30": {"players": 44700, "returned": 8502,
                                   "rate": 0.1902},
                       "gate_40": {"players": 45489, "returned": 8279,
                                   "rate": 0.1820}}),
    # rung 35 — the same z chain, the other experiment
    12: ("cells", {"rate_30": 0.1902, "rate_40": 0.1820, "z": 3.164}),
    # rung 36 — the outlier, in the data
    13: ("arm_cells", {"gate_30": {"players": 44700, "mean_rounds": 52.46,
                                   "most_rounds": 49854},
                       "gate_40": {"players": 45489, "mean_rounds": 51.30,
                                   "most_rounds": 2640}}),
}

# The ladder, as built. Fence ordinal -> (rung, what is new on that slide).
# Printed at the end so a reader can see the ladder without opening the deck,
# and so that a fence added without a rung shows up as a gap.
LADDER = {
    1: (24, "nothing — SELECT / LIMIT"),
    2: (25, "nothing — COUNT / GROUP BY"),
    3: (26, "IDEA: SUM over a 0/1 column counts the 1s"),
    4: (27, "nothing — division and ROUND"),
    5: (28, "IDEA: CASE WHEN … THEN 1 ELSE 0 END"),
    6: (29, "nothing — WITH and CASE WHEN, each met once"),
    7: (30, "nothing — SQRT"),
    8: (31, "FUNCTION: ABS — the only new built-in in the deck"),
    9: (32, "nothing — the literal 1.96 from the z table"),
    10: (33, "nothing — AVG and WHERE"),
    11: (34, "nothing — rung 27 pointed at another table"),
    12: (35, "nothing — rung 31 with the table and column changed"),
    13: (36, "nothing — AVG and MAX"),
}


def approx(got, want) -> bool:
    got, want = float(got), float(want)
    if abs(want) < 1:
        tol = 0.00051 if abs(want) < 0.01 else 0.0001 + abs(want) * 0.002
    elif abs(want) < 1000:
        tol = max(0.011, abs(want) * 0.001)
    else:
        tol = max(1.0, abs(want) * 0.0005)
    return abs(got - want) <= tol


def main() -> int:
    md = DECK.read_text()
    fences = FENCE_RE.findall(md)
    print(f"{len(fences)} sql-live fences in {DECK.name}")
    print("building the tables from the generators ...")
    con = build_db()
    print()

    problems = []
    seen_funcs = set()

    for i, (info, sql) in enumerate(fences, start=1):
        params = parse_params(info)
        label = f"fence {i:2d}"

        # --- rule 3: every fence is labelled, and carries no caption ---
        if params.get("db") != "stats_demo":
            problems.append(
                f"{label}: db= is {params.get('db')!r}, want stats_demo")
        if params.get("caption"):
            problems.append(
                f"{label}: has a caption= — glosses belong in speaker notes")
        if "height" not in params:
            problems.append(f"{label}: no height= (the widget needs one)")

        # --- rule 1: house rules ---
        for pat, why in FORBIDDEN:
            if re.search(pat, sql, re.I):
                problems.append(f"{label}: {why}")

        for fn in re.findall(r"\b([A-Za-z_][A-Za-z_0-9]*)\s*\(", sql):
            low = fn.lower()
            if low in SQL_KEYWORDS or low in CTE_NAMES:
                continue
            if low not in ALLOWED_FUNCS:
                problems.append(f"{label}: unexpected function {fn}()")
            else:
                seen_funcs.add(low)

        # ABS is the deck's one new built-in, and the notes say where it
        # arrives. Using it earlier would make that claim false.
        if re.search(r"\bABS\s*\(", sql, re.I) and i < ABS_INTRODUCED_AT:
            problems.append(
                f"{label}: ABS used before it is introduced "
                f"(fence {ABS_INTRODUCED_AT})")

        # --- rule 2: it runs, and returns what the notes claim ---
        run_sql = sql.strip().rstrip(";")
        try:
            cur = con.execute(run_sql)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
        except Exception as exc:  # noqa: BLE001
            problems.append(f"{label}: FAILED TO RUN — {exc}")
            continue

        # The integer-division guard. If a column named like a rate comes back
        # as exactly 0 or exactly 1, SQLite divided two integers and every
        # number downstream is wrong — silently, and in a way that would look
        # like a real disagreement with the answer key.
        for r in rows:
            for name, val in zip(cols, r):
                if name in ("rate", "pooled", "se") and isinstance(val, int):
                    problems.append(
                        f"{label}: {name} came back as an INTEGER ({val}) — "
                        "integer division; a column needs REAL in build_db()")

        matched = i in EXPECTATIONS
        if matched:
            kind, want = EXPECTATIONS[i]
            if kind == "rows":
                if len(rows) != want:
                    problems.append(
                        f"{label}: {len(rows)} rows, expected {want}")
            elif kind == "cells":
                for name, value in want.items():
                    if name not in cols:
                        problems.append(f"{label}: no column {name!r}")
                        continue
                    got = rows[0][cols.index(name)]
                    if not approx(got, value):
                        problems.append(
                            f"{label}: {name} = {got}, expected {value}")
            elif kind in ("arm_cells", "conv_cells"):
                # Keyed by the first column's value (the arm label, or 0/1).
                key_col = 0
                index = {r[key_col]: r for r in rows}
                for key, wants in want.items():
                    if key not in index:
                        problems.append(
                            f"{label}: no row for {key!r} "
                            f"(got {sorted(index)})")
                        continue
                    row = index[key]
                    for name, value in wants.items():
                        if name not in cols:
                            problems.append(f"{label}: no column {name!r}")
                            continue
                        got = row[cols.index(name)]
                        if not approx(got, value):
                            problems.append(
                                f"{label}: {key} {name} = {got}, "
                                f"expected {value}")

        rung, whats_new = LADDER.get(i, ("?", "NOT IN THE LADDER"))
        status = "checked" if matched else "ran (no pinned value)"
        print(f"  {label}  rung {rung}  {len(rows):>3} rows, "
              f"{len(cols)} cols  [{status}]")
        print(f"            new: {whats_new}")

    # Ladder completeness: every fence has a rung, and the rungs are in order.
    rungs = [LADDER[i][0] for i in sorted(LADDER) if i <= len(fences)]
    if rungs != sorted(rungs):
        problems.append(f"the ladder is out of order: {rungs}")
    for i in range(1, len(fences) + 1):
        if i not in LADDER:
            problems.append(f"fence {i} has no rung in LADDER")

    print()
    print(f"functions used across the deck: {', '.join(sorted(seen_funcs))}")
    new_builtins = seen_funcs - {
        "count", "sum", "avg", "min", "max", "round", "sqrt"}
    print(f"new built-ins vs week 9:        "
          f"{', '.join(sorted(new_builtins)) or '(none)'}")
    if new_builtins != {"abs"}:
        problems.append(
            f"the deck claims ABS is its ONE new built-in, but the new set is "
            f"{sorted(new_builtins)}")

    print()
    if problems:
        print(f"PROBLEMS ({len(problems)}):")
        for p in problems:
            print(f"  - {p}")
        return 1
    print(f"OK — {len(fences)} fences, all run, "
          f"{len(EXPECTATIONS)} with pinned values, all match.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
