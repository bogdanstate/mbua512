# Week 10 — Probability and A/B Testing, as a platform deck

The authoring seed for `mbua512-week-10-ab-testing` on the teaching platform.
Built to the 52-slide outline in
`infra/superset-grading/docs/ab-testing-lecture-research.md` §4, in the week-9
deck's format and register, and against the two real experiments loaded into
`stats_demo` (`infra/mysql/week10/README.md`).

**The platform is the source of truth once uploaded.** After the first upload
the instructor edits the deck live. Every later write must read the server copy
first — `update.sh` enforces that with a stale guard, and carries pinned
results across (see §4).

| | |
|---|---|
| **Dev deck** | https://learn-dev.datascie.nz/grading/#/decks/mbua512-week-10-ab-testing — **id 16**, `instructors`, 60 slides, 13 SQL, 8 assets |
| **Prod** | **not copied.** Blocked on the Cookie Cats licence ruling — see §5 |
| **Research doc** | `infra/superset-grading/docs/ab-testing-lecture-research.md` |
| **Format bible** | `infra/superset-grading/docs/week09-correlation-regression-deck-plan.md` and `~/mbua512/dev/week-09/deck/README.md` |
| **Data** | `infra/mysql/week10-gen.py`, `week10-marketing-gen.py`; loaded on dev, verified 2026-09-24 |

---

## 1. Files

| file | what it is |
|---|---|
| `deck.md` | **the single source.** One deck — unlike week 9 there is no split |
| `assets/` | 8 PNGs, all generated here, all well under the 4 MiB cap |
| `mbua512-week-10.css` | the deck stylesheet: the week-9 sheet verbatim, minus its height table, plus a generated week-10 one |
| `figures/make_figures.py` | draws all 8 figures — seeded simulations and one data figure |
| `figures/check_deck_sql.py` | runs every fence offline against the real rows and asserts every value the notes quote |
| `fit-sql-slides.py` | **computes every fence's `height=` and the CSS that matches it.** Run with `--write` after any query changes length |
| `build-payload.py` | bundles `deck.md` + assets + CSS into `payload.json`; refuses to build a broken one |
| `upload-deck.py` / `upload.sh` | **create** the deck. Refuses to touch an existing slug |
| `update-deck.py` / `update.sh` | **update** it, with a stale guard and pin carrying |
| `carry-pins.py` | lifts pinned results out of the live deck onto a rebuilt one, matched by SQL text |
| `payload.json` | generated, 1.5 MiB. Not worth committing |

---

## 2. Rebuilding

```bash
# 0. the generators must be current — the slides quote their numbers
cd ~/infra/mysql
python3 week10-gen.py --report && python3 week10-marketing-gen.py --report

# 1. figures (needs a venv with matplotlib + numpy; the system python has neither)
cd ~/mbua512/dev/week-10/deck/figures
<venv>/bin/python make_figures.py          # 8 PNGs into ../assets/

# 2. check every query against the real rows, offline, no database
python3 check_deck_sql.py

# 3. re-fit the slides if any query changed length, then upload (dev only)
cd ..
python3 fit-sql-slides.py            # report
python3 fit-sql-slides.py --write    # rewrite heights + CSS together
./upload.sh                          # first time only — refuses an existing slug
FORCE=1 ./update.sh                  # subsequent edits — read §4 first

# 4. verify in a browser, in the cluster
cd ~/infra/playwright
./run-in-pod.sh -n superset-dev --login-as bogdanstate \
  --env SLUG=mbua512-week-10-ab-testing \
  --env SIZES=1920x1080,1440x900,1366x768 verify-week09-deck.js
./run-in-pod.sh -n superset-dev --login-as bogdanstate \
  --env SLUG=mbua512-week-10-ab-testing --env DO_PIN=1 run-week09-sql.js
```

Both Playwright scripts are week-9's and both take `SLUG`; neither needed a
change for week 10.

**Never run node/npm/npx on the workstation.** The checks run in a cluster pod;
that is what `run-in-pod.sh` is for.

---

## 3. The SQL ladder as built

Rungs 24–36, continuing week 9's 0–23. **`ABS` is the only new built-in
function in the whole deck**, and `check_deck_sql.py` enforces both that claim
and the slide it is introduced on.

| rung | slide | fence | new on this slide |
|---:|---:|---:|---|
| 24 | 21 | 1 | nothing — `SELECT` / `LIMIT` |
| 25 | 22 | 2 | nothing — `COUNT` / `GROUP BY` |
| 26 | 23 | 3 | **IDEA:** `SUM` over a 0/1 column counts the 1s |
| 27 | 24 | 4 | nothing — division and `ROUND` |
| 28 | 26 | 5 | **IDEA:** `CASE WHEN … THEN 1 ELSE 0 END` |
| 29 | 30 | 6 | nothing — `WITH` and `CASE WHEN`, each met once |
| 30 | 32 | 7 | nothing — `SQRT` |
| 31 | 33 | 8 | **FUNCTION: `ABS`** — the deck's one new built-in |
| 32 | 37 | 9 | nothing — the literal 1.96 from the z table |
| 33 | 48 | 10 | nothing — `AVG` and `WHERE` (the confounder) |
| 34 | 52 | 11 | nothing — rung 27 pointed at Cookie Cats |
| 35 | 53 | 12 | nothing — rung 31 with the table and column changed |
| 36 | 56 | 13 | nothing — `AVG` and `MAX` (the outlier) |

Deliberately absent, and enforced by the checker:

- **no `RAND()`.** Every simulation is a seeded figure. A `RAND()` on a slide
  would give each student a different pinned answer and break the deck's
  determinism contract (research doc §4.2);
- **no window functions.** Week 9 allowed `OVER` on exactly two Spearman
  slides; week 10 needs none;
- **no `STDDEV`/`STD`** bare (population SD), no `CORR`, no `REGR_*`, no
  `FILTER` — none of which MariaDB has or the ladder wants.

`CASE` is *allowed* here, unlike week 9, because `SUM(CASE WHEN … THEN 1 ELSE
0 END)` is rung 28 and one of the deck's two new ideas.

---

## 4. Two things that will bite a later pass

**`Pin result` writes into the deck source.** It is not a side table keyed by
slide number: the rows land in the markdown, bracketed by `[//]: # (sql-live
result: …)` lines. So a plain rebuild-and-PUT silently deletes every pin, and
students — who never execute a query — are left with SQL and no data.
`update.sh` pulls the live content first and `carry-pins.py` re-applies the
pins by SQL text. `CARRY_PINS=0` skips it, and is right only for a deck with no
pins.

**The height of a SQL slide is three numbers that must agree**, and only one of
them is visible to any automated check. `height=` sizes the widget; a
`--w10-editor-lines` CSS rule sizes the textarea (which carries a hardcoded
`rows="8"` and will otherwise clip a longer query); and the pinned result
renders as a `<table>` *below* the widget at 40px + ~32.3px per row, which is
in nobody's budget unless you put it there. A clipped query does **not** show
up as overflow, because the textarea scrolls — week 9 found one cut off at
`sums AS (` only by looking at a screenshot. `fit-sql-slides.py` derives all
three from one place; run it with `--write` whenever a query changes length,
and then **look at the screenshots**.

Its budget, inherited from week 9's measurements on this stage:

```
stage                                720 px
  - top offset (data slides have no h1)  40
  - the <pre> wrapper's padding           44
  - bottom margin                         14
                                      ------
available to widget + pinned table    622 px
```

Two fences (the 15-line z-chains, slides 33 and 53) return a single row, so
their in-widget results pane is tightened to 62px to buy their editor the room
— the same trick week 9 used for its 18-line Spearman slide. The pinned table
below is what the audience reads.

---

## 5. ⚠ The Cookie Cats licence — a ruling is owed before prod

**This deck cannot go to production as it stands**, and the reason is not the
deck.

`ab_marketing` is **CC0 1.0** — a public-domain dedication, verified from the
Kaggle page's own `application/ld+json`. It carries no hold and may go to prod.

`ab_cookie_cats` is **licence UNSTATED**. Kaggle's metadata records
`"name": "Unknown"`; DataCamp's Terms of Use forbid redistributing content from
their service; Tactile Entertainment has published nothing; the academic survey
of public A/B datasets (arXiv:2111.10198) independently records `Licence:
Unknown`. Dev (tailnet-only, no students) is the sanctioned place for it. The
instructor's ruling is owed before it reaches the production cluster.

Full record with verbatim licence blocks and URLs:
`infra/mysql/week10/data/SOURCE.md` §1.

**If the ruling is no**, slides 50–56 (Part 7, the subtler case) lose their
data. The fallback named in the research doc is a synthetic `ab_checkout`
generator with a planted effect and an A/A pair — **not built**. Part 7 is
seven slides of sixty, and the marketing half of the deck stands without it.

---

## 6. Sources, licences and credits

Every third-party dataset has a visible credit on its slide. This table is the
audit trail.

### Data

| dataset | status | source | how used |
|---|---|---|---|
| `ab_marketing` (588,101 rows) | **REAL, CC0 1.0** | Kaggle, *"Marketing A/B Testing"*, uploaded by Favio Vázquez 2021-10-20, dataset id 1660669 — https://www.kaggle.com/datasets/faviovaz/marketing-ab-testing | the main worked example: slides 20–26, 30–37, 48–49. Credited on slide 20. **No upstream advertiser, product, country, date or paper is named** — the provenance stops at the uploader, and slide 20's notes say so |
| `ab_cookie_cats` (90,189 rows) | **REAL, licence UNSTATED** | Tactile Entertainment via the DataCamp project *"Mobile Games A/B Testing with Cookie Cats"* (Bååth & Romero), Kaggle mirror `yufengsui/mobile-games-ab-testing` | the second, subtler case: slides 51–56. Credited on slide 51, **with the licence status stated in the notes**. Fetched and loaded, never redistributed |

Full provenance for both: `infra/mysql/week10/data/SOURCE.md`.

### Figures — all eight are ours

| asset | what it is | determinism |
|---|---|---|
| `coin-runs.png` | ten runs of 100 fair flips | simulated, seed 20261010 |
| `lln.png` | the running share of heads over 5,000 flips | simulated, seed 20261011 |
| `binomial.png` | the exact binomial pmf for 100 flips, 60+ shaded | **exact arithmetic**, not sampled |
| `two-samples.png` | two dot grids from one population at 20 % | simulated, seed 20261038 (chosen — see below) |
| `null-dist.png` | 2,000 A/A tests, the outer 5 % shaded | simulated, seed 20261013 |
| `peeking.png` | one A/A test's p-value watched as it runs | simulated, seed 20261127 (chosen — see below) |
| `sample-size.png` | n per arm against detectable lift, 80 % power | closed-form, no draw |
| `marketing-rates.png` | the two conversion rates with 95 % intervals | **from the generator's rows**, not typed in |

**Two figures use a chosen seed rather than the script's default, and both say
so in the code.** `two-samples` because the default draw gave 18.0 % against
17.5 %, unreadable from the back of a theatre; the chosen pair (16.0 % / 23.0 %,
a 1.75-SE gap) is an ordinary event drawn legibly. `peeking` because the figure
needs a run that dips under 0.05 and recovers — the script searches seeded runs
for the first one that does, which is the case the slide is *about*. Choosing a
legible instance of a common event is a presentation decision; choosing a rare
one and calling it typical would not be, and neither of these is that.

### Third-party ideas, re-taught rather than reproduced

| source | licence | how it is used |
|---|---|---|
| **Evan Miller**, "How Not To Run an A/B Test" — evanmiller.org | no reuse grant | the peeking argument, **re-taught in our own words** with our own figure. Linked on slide 61 and in slide 45's notes. His sample-size calculator is named as a live demo |
| **Data 8**, *Computational and Inferential Thinking* ch. 12 — inferentialthinking.com | **CC BY-NC-ND — no derivatives** | **cited and linked only** (slide 61). Nothing is adapted or re-slid. The permutation/simulation idea is re-taught in our own words |
| **MIT 18.05** — ocw.mit.edu | CC BY-NC-SA | the inference spine (null, p, errors). Adaptable; cited on slide 61 |
| **OpenIntro Statistics** — openintro.org | CC BY-NC-SA | the two-proportion arithmetic and notation. Adaptable; cited on slide 61 |
| **Kohavi, Tang & Xu**, *Trustworthy Online Controlled Experiments* | book © Cambridge | cited on slide 61 |
| **Cassie Kozyrkov** | all rights reserved | one framing only ("the null is the default action"), **paraphrased** in slide 28's notes, not quoted |
| **R. A. Fisher** | — | the historical note on 0.05 in slide 35's notes |

**No image on any slide is third-party, and nothing is hot-linked.** Every
figure is ours and served as a deck asset from our own origin — the platform
refuses remote images at pin time anyway, and hot-linking leaks viewer IPs.

---

## 7. Every number a slide quotes, and where it comes from

All of these are asserted by `figures/check_deck_sql.py` against the generated
rows, and all were confirmed against the **loaded dev database** by the pin
pass on 2026-09-24. Source column references `infra/mysql/week10/README.md`.

| slide | number | source |
|---|---|---|
| 5 | conversion rate 0.0255 | README §3b (`ad` 2.5547 %) |
| 9 | coin runs 45–54 | the figure's own printed output |
| 11 | 60+ heads ≈ 2.8 %; exactly 50 ≈ 8 %; 70+ ≈ 4 in 100,000 | exact binomial, recomputed |
| 14 | ±1.6 pp; 5.3 % outside 1.96 SE | the figure's printed output (SE 0.80 pp) |
| 15, 34 | z table: 32 %, 5 %, 1 %, 0.3 %, 1 in 1,000 | `erfc(z/√2)`, recomputed |
| 20, 22 | 588,101 people; 564,577 / 23,524 | README §3b |
| 23 | 14,423 and 420 buyers | README §3b |
| 24, 25 | 2.5547 % vs 1.7854 %; gap 0.7692 pp | README §3b |
| 29, 30 | pooled 0.025239 | README §3b |
| 32 | se 0.001044 | README §3b (0.00104374) |
| 33, 34, 35 | **z 7.370**, p 1.7 × 10⁻¹³, ≈ 1 in 6 trillion | README §3b (z 7.3701, p 1.705e-13; 1/p = 5.87e12) |
| 37 | ad 0.0251–0.0260, psa 0.0162–0.0195 | recomputed; confirmed by the pin |
| 40 | +0.77 pp, +43 % | README §3b (+0.7692 pp, +43.09 %) |
| 42 | 80,681 / 21,108 / 5,031 per arm | the figure's closed-form output |
| 46, 47 | 24:1; ads 24.82 vs 24.76 | README §3b, §2.5 |
| 48, 49 | 83.9 vs 23.3 ads | README §3b (83.8878 / 23.2915) |
| 51 | 90,189 players | README §3a |
| 52 | gate_30 0.1902, gate_40 0.1820 | README §3a (19.0201 % / 18.2000 %) |
| 53, 54 | **z 3.164**, p 0.0016; day 1 z 1.78, p 0.074 | README §3a |
| 54 | 44.82 % / 44.23 %; −0.59 pp, −0.82 pp | README §3a |
| 55 | 49,854 rounds; 52.46 → 51.34; median 17 | README §4 |
| 56 | gate_40 max 2,640 | confirmed on the dev database by the pin pass |

One number on slide 55 is worth flagging because it reads oddly next to §4 of
the data README: the **second-largest** value in `gate_30` is 2,961, while
`gate_40`'s maximum is **2,640**. Both are right — they are different arms.

---

## 8. What this deck does NOT include

- **No interactive widgets.** The research doc's `stat-lab kind=ab` (coin
  flips, the null distribution, a live z→p calculator, a peeking simulator) is
  a platform change that depends on `stat-lab` itself, which is week 9's
  unshipped wave 3. Every one of those four modes is a static figure here, and
  these PNGs are the widget's eventual fallback and print form.
- **No `ab_checkout`.** The synthetic companion with a planted effect and an
  A/A pair is not built. The A/A idea is taught with a figure (slide 44 and the
  null-distribution slide) rather than with a table students can query.
- **No workshop.** §4.3 of the research doc proposes five exercises; none is
  built.
- **No prod copy.** See §5.
