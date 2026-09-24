# Week 9 — Correlation & Regression, as a platform deck

The authoring seed for `mbua512-week-09` on the teaching platform. The old
lecture was a single 7,276-line hand-rolled HTML file (`../index.html`) that
ran its examples through WebR; this is the port to a reveal deck, where every
R cell has become a `sql-live` query against MariaDB.

**The platform is the source of truth once uploaded.** After the first upload
the instructor edits the deck live. Every later write must read the server copy
first — `update.sh` enforces that with a stale guard (see below).

| | |
|---|---|
| **Dev deck A** | https://learn-dev.datascie.nz/grading/#/decks/mbua512-week-09a-correlation — **id 14**, `instructors`, 61 slides (48 main + 13 appendix), 18 SQL |
| **Dev deck B** | https://learn-dev.datascie.nz/grading/#/decks/mbua512-week-09b-regression — **id 15**, `instructors`, 38 slides, 9 SQL |
| **PROD deck A** | https://learn.datascie.nz/grading/#/decks/mbua512-week-09a-correlation — **id 4**, `instructors` (unpublished), 61 slides, all 18 SQL slides pinned. Copied 2026-09-23, appendix 2026-09-24 |
| **Prod deck B** | not copied — deck B stays on dev by instructor decision |
| **Plan** | `infra/superset-grading/docs/week09-correlation-regression-deck-plan.md` |
| **Data** | `infra/mysql/week09-gen.py` → `week09.sql`, loaded by `infra/mysql/load-week09.sh`. **Not loaded anywhere yet** |

---

## 1. Files

| file | what it is |
|---|---|
| `deck.md` | **the single source** — both decks are derived from it. Carries one `<!-- DECK-SPLIT: b -->` marker |
| `split-deck.py` | derives `deck-a.md` + `deck-b.md` from `deck.md` (fence-aware; adds each deck's title slide and deck B's recap) |
| `carry-pins.py` | carries pinned sql-live results from a LIVE deck onto a rebuilt one, matched by SQL text. **Run before any re-upload** — see §11 |
| `deck-a.md`, `deck-b.md` | **generated — do not edit.** Edit `deck.md` and re-run the split |
| `assets/` | 34 PNGs, all generated or rasterised here, all under the 4 MiB cap |
| `mbua512-week-09.css` | the deck stylesheet (course theme + week-09 addendum). One stylesheet per deck; `stylesheet_url` beats front-matter `css:` |
| `figures/make_figures.py` | draws all 32 generated figures from the same rows the SQL slides query |
| `figures/check_deck_sql.py` | runs every fence offline and asserts the values the slides quote |
| `build-payload.py` | bundles `deck.md` + assets + CSS into `payload.json`; refuses to build a broken one |
| `upload-deck.py` / `upload.sh` | **create** the deck. Refuses to touch an existing slug |
| `update-deck.py` / `update.sh` | **update** it, with a stale guard against the instructor's live edits |
| `payload.json` | generated, 6.7 MiB. Not worth committing |

---

## 2. Rebuilding

```bash
# 0. the data generator must be current — the slides quote its numbers
cd ~/infra && python3 mysql/week09-gen.py && python3 mysql/test_week09_gen.py

# 1. figures (needs a venv with matplotlib + numpy; the system python has neither)
cd ~/mbua512/dev/week-09/deck/figures
<venv>/bin/python make_figures.py          # 32 PNGs into ../assets/

# 2. check every query against the real rows, offline, no database
python3 check_deck_sql.py

# 3. upload (dev only) — TWO decks, one flag each
cd ..
python3 split-deck.py                       # deck.md -> deck-a.md + deck-b.md
DECK=a ./upload.sh                          # first time
DECK=b ./upload.sh
DECK=a FORCE=1 ./update.sh                  # subsequent edits — read §4 first
DECK=b FORCE=1 ./update.sh

# 4. verify in a browser, in the cluster
cd ~/infra/playwright
for S in mbua512-week-09a-correlation mbua512-week-09b-regression; do
  ./run-in-pod.sh -n superset-dev --login-as bogdanstate \
    --env SLUG=$S --env SIZES=1920x1080,1440x900,1366x768 verify-week09-deck.js
  ./run-in-pod.sh -n superset-dev --login-as bogdanstate \
    --env SLUG=$S --env DO_PIN=1 run-week09-sql.js     # pins are PER DECK
done
```

**Never run node/npm/npx on the workstation.** The Playwright checks run in a
cluster pod; that is what `run-in-pod.sh` is for.

---

## 3. What wave 1 does NOT include

- **The data is not loaded.** Every `sql-live` slide will say the table does
  not exist until `infra/mysql/load-week09.sh` runs. That is expected and
  gated on the instructor's go. The checks verify the fences *parse and
  render*, not that they return rows.
- **No interactive widgets.** The ρ slider, the R² Venn and the six
  least-squares slides are static PNGs. The `stat-lab` widget is wave 3; these
  PNGs are its fallback and its print form.
- **No pinned results.** Pinning happens in wave 2, after the load.

---

## 4. The stale guard, and why it exists

On 2026-09-14 an uploader on this platform PUT a whole local `deck.md` over
three slides the instructor had just rewritten in the live editor. Recovery
needed a revision-table restore.

So `update.sh` reads the server's `updated_at` first, stamps it into the
payload, and the in-pod script refuses if the server has moved since. `FORCE=1`
skips the guard and is only correct immediately after reading the server copy.

`upload.sh` cannot clobber anything: it stops if the slug exists.

---

## 5. Sources, licences and credits

Every third-party figure or dataset has a visible credit on its slide. This
table is the audit trail.

### Data

| dataset | status | source | how used |
|---|---|---|---|
| `belgian_beer` (228 rows) | **REAL**, **CC BY 4.0** | Schreurs, M., Piampongsant, S., Roncoroni, M., et al. (2024). Predicting and improving complex beer flavor through machine learning. *Nature Communications*, **15**, 2368. [doi:10.1038/s41467-024-46346-0](https://doi.org/10.1038/s41467-024-46346-0) (PMC10966102) | price vs sensory score, cited on each slide as a clickable DOI. Extracted from the CSV embedded in the course's own previous deck, not re-downloaded. **The title previously recorded here was WRONG** ("The blind men and the elephant…") — corrected 2026-09-25 against Europe PMC and NCBI eutils, which agree. Licence CC BY 4.0 confirmed from the same record |
| `chocolate_nobel` (23 rows) | **REAL** | Messerli, F.H. (2012), *"Chocolate Consumption, Cognitive Function, and Nobel Laureates"*, NEJM 367:1562–1564 | the closing correlation-is-not-causation slide; cited. Widely reproduced as a teaching dataset (Triola 2018) |
| `fun_survey`, `fire_incidents`, `marathon_opinion`, `hotel_fun` | synthetic | authored for this lecture; recovered verbatim from the course repo at commit `5049bf2` | unchanged. Slides say "synthetic data, authored for this lecture" |
| `housing` (50 rows) | synthetic | regenerated from the old deck's own seeded LCG (seed 456) | the regression dataset. Same 50 points the old slides drew |
| `sensor_readings` (120 rows) | synthetic | generated here, seed 90210 | the `COUNT(col)` vs `COUNT(*)` lesson. **Labelled synthetic on its own slide** |

Full provenance: `infra/mysql/week09/data/SOURCE.md`.

### Figures

| asset | origin |
|---|---|
| `rasinski-1989-table2.png`, `rasinski-1989-table2-welfare.png` | **Rasinski, K. A. (1989).** *The effect of question wording on public support for government spending.* **Public Opinion Quarterly 53(3), 388–394, Table 2.** © 1989 Oxford University Press / AAPOR, all rights reserved; obtained via JSTOR. Reproduced as a **single table** for classroom teaching under educational fair dealing (**NZ Copyright Act 1994, s 44**), at the instructor's request 2026-09-25. **Not hot-linked** — rendered from the PDF at 220 dpi and uploaded as a deck asset; the welfare version is a crop of the same table. **The source PDF is deliberately NOT in this repo.** Cited in full on both slides |
| `spurious-correlation.png` | **Tyler Vigen, "Spurious Correlations"** (tylervigen.com/spurious/correlation/1248). Rasterised from the SVG in `../assets/`. Credit line on the slide; the chart carries its own attribution (Box Office Mojo, FBI CJIS) inside the image |
| `confusion-matrix.png` | **ours.** Replaces the Devopedia/Medium figure the old slide hot-linked (plan Q6) |
| the other 32 | **ours**, drawn by `figures/make_figures.py` from the datasets above |

### Dropped for copyright

- The **tenor GIF** on old slide 13 ("are we having fun yet") — a copyrighted clip, hot-linked.
- The **STONKS meme** on old slide 66 — copyrighted, hot-linked from `i.kym-cdn.com`. The *idea* survives as `r2-inflation.png`, which fits real regressions on real noise instead of asserting invented R² values.
- The **Devopedia confusion-matrix image** on old slide 74 — replaced with our own.
- Three **Unsplash photographs** on old slides 52–54 and the section-lead photos: dropped rather than re-hosted, to keep the deck's asset budget for figures. The "Examples" slides are merged into one text slide; split them again and re-add credited photos if the instructor wants the pictures back.

**No remote image is hot-linked.** Every image is a deck asset served from our
own origin — the platform refuses remote images at pin time anyway, and
hot-linking leaks viewer IPs.

### Settled

**The beer data is CC BY 4.0** — confirmed 2026-09-25 from the Europe PMC
record for PMC10966102 (`"license": "cc by"`, `"isOpenAccess": "Y"`). Q6 is
closed; redistribution with attribution is fine, and every slide that uses the
data carries the attribution as a clickable DOI.

The same check found the **title recorded against that PMCID was wrong**. See
`infra/mysql/week09/data/SOURCE.md` for the correction and the two sources that
agree on the right one.

---

## 6. Things that bit, recorded so they do not bite twice

**A deck stylesheet cannot retune a platform widget through `:root`.**
`deck.css` says `--deck-sql-em` is "a course stylesheet can retune it like any
other deck variable". It is not: the deck sheet is served *before* the
platform's, so a `:root` custom property here is overwritten later in the
cascade. Setting `--deck-sql-em: 1.0` and `--deck-widget-em: 0.62` both
computed correctly and changed nothing — the widget kept rendering at
`20.8px × 1.3`. The fix is a rule on the element
(`.reveal .slides section .deck-widget.deck-sql { font-size: 16px }`). Two
upload cycles were spent proving this; the reasoning is in the stylesheet.

**`annotated-code` splits on the FIRST `---`, and R output contains one.**
An R `summary(lm)` prints a `---` line before `Signif. codes`. That was eaten
as the code/annotation separator, silently truncating the exhibit and
splitting the slide. The fence now uses the documented escape hatch,
`sep=@@@`. Any fenced content with an internal `---` needs it.

**`height=` on a tall fence sets the widget's height directly.** Shrinking the
font alone did not help while `height=680` stood; the seven five-CTE slides
needed `height=470` *and* the font rule. Both together took overflow from 12
slides to 0.

**The asset model's column is `size_bytes`, not `byte_size`**, and both
`GradingSlideDeck` and `GradingSlideAsset` need a non-nullable
`created_by_id`, which `superset shell` has no request context to supply. The
uploader resolves a FAB user explicitly.

**stdout through `superset shell` is unreliable.** Every script here writes
its result to a file in the pod and the caller `cat`s it back. Piping a script
*into* the REPL rather than `exec(open(...).read())` silently drops compound
statements.

**The sql-live textarea has a hardcoded `rows="8"`, and the overflow metric
cannot see it.** On a `layout=rows` fence the editor came out 201px tall
(8 × 23.2px) whatever the query's length, while the 22-line chain needs 526px.
The textarea scrolls, so the *slide* fits and every automated height check
passes — but the query is **cut off mid-line on the slide a student reads**.
It was caught only by looking at a screenshot of slide 43, which stopped at
`sums AS (`. The fix sets an explicit textarea height per query length, keyed
off the widget's inline `height` (`.deck-sql[style*="664px"]`), because CSS
beats the `rows` default. Look at the screenshots; do not trust "0 overflow".

**The height budget, measured rather than guessed.** On a 720px stage a SQL
slide spends 108px on the top offset and h1, **44px on the `<pre>` wrapper**
around the widget, 35px on a one-line Run/Change note (70px if it wraps), and
~22px of bottom margin. That leaves the widget **511px** with a one-line note,
**476px** with a two-line one, and **450px** on the one slide that also carries
a source line. Those are the only three `height=` values in the deck, and the
CSS maps each to an editor line count. Three earlier attempts failed: computing
`height=` from the query's line count (ignores the `<pre>` and the note),
raising it further (hits the platform's 680px ceiling), and trusting the
overflow metric (see above).

**One query still scrolls, by design.** The 20-line train/test query on slide
85 shows 18 lines; its last two (`SELECT ROUND(...) FROM sums CROSS JOIN
stats;`) scroll. Fitting it would need a 706px widget against a 680px ceiling.
The slide's teaching point is the `WHERE is_train = 1` on line 4, which is
fully visible, and students have already read this chain five times by then.

**Wave 2 must re-measure the results pane.** Capping it at 130px was what made
room for the editor, and on the tallest slides it now sits at 60–83px. With no
data loaded there are no results to show, so this is invisible today. Once
results are pinned, either raise those fences' `height=` or lift the cap.


---

## 7. Instructor review, 2026-09-22

Three changes after the deck was reviewed on dev, with the data now loaded.

**1. The NASA photo credit.** The title slide carried *"Photo by NASA on
Unsplash"* — but not the photograph. The old deck used it as a full-bleed
background from a hot-linked Unsplash URL, and the port could not bring it
across (the platform refuses remote images). The credit outlived its picture,
which is why it "no longer made sense". Removed. To restore: add the photo as a
deck asset, set `data-background-image`, and bring the credit back with it.

**2. The "Confusing Question" slide.** Two defects, one root cause each:

- *The arrow pointed down.* It was a literal `⇓` (DOWNWARDS DOUBLE ARROW),
  inherited from the old deck, which stacked "Confusing Question / ⇓ /
  Confusing Answer" vertically. Here the three parts are one line, so it is
  now `⇒`.
- *The stray blue bar* was the theme's `callout` class:
  `border-left: 6px solid #0b6bcb` down the whole section. On a slide holding
  one short sentence that reads as a stray rule rather than emphasis. The class
  is dropped from this slide (the three other callouts keep it — they are long
  enough for the bar to read as intended).

**3. The data slides carry the query and its result only.** No heading, no
`caption=`, no "Run it. …" sentence. Every gloss moved to the slide's
**speaker notes** (the `Notes` button — presenter-only), so the ladder's
teaching line is intact: each note carries the old title, the old caption and
the old Run/Change instruction, in that order.

That freed most of the stage, and the heights were re-measured from scratch
with results **pinned** (see the pinned-results note in the stylesheet). The
row-listing slides now carry `limit=5` rather than 10: a 10-row pinned table is
363px, which left only 259px for the widget — not enough for the query plus its
result pane. Five rows still show the shape of the data.

All 24 queries were run against the loaded dev tables and **pinned**; every
value matches the answer key (r 0.967, slope 3.000, SSR 93,044, SST 791,883,
R² 0.883, train r 0.935 / slope 3.243, sensors 120/102, chocolate 0.800).

**Trap for the next pass:** `Pin result` does not grow the widget — it renders
the rows as a `<table>` **sibling below it**. Eight slides overran on the first
pin pass while every widget still reported exactly its requested height. Budget
`height=` for what will sit under it, and re-run the pin pass after any change.


---

## 8. The split into two decks (instructor, 2026-09-23)

*"could we split the Week 9 deck into two decks — one for multivariate
relationships and correlations and one on regression / ML?"*

| | deck A | deck B |
|---|---|---|
| slug | `mbua512-week-09a-correlation` | `mbua512-week-09b-regression` |
| title | Multivariate Relationships and Correlation | Regression and Prediction |
| slides | 61 | 38 |
| SQL fences | 18 (ladder rungs 0–14, incl. 13a/13b) | 9 (rungs 15–23) |
| assets | 19 | 15 |

**The cut is at "Regression Analysis"**, the section slide that opened the
regression half of the combined deck. Deck A ends on the four
when-to-use-correlation assumptions; deck B opens on that section header.

**`R² is the shared variation` stays in deck A**, as the instructor leaned.
The deck treats R² twice, and the two treatments are genuinely different
lessons: deck A's is *R² as shared variation* — the Venn figure and
`POW(r, 2)`, a property of a correlation, needing no line. Deck B's is
*R² as 1 − SSR/TSS* ("Two roads, one number"), which cannot be stated before
there is a fitted line to produce an SSR. Splitting them across the two decks
is right, and the pairing is a nice callback when deck B shows the two roads
meet.

**Nothing else moved.** One slide was ADDED to deck B: a recap of deck A's
finished r query, re-pointed at `housing`, because deck B's first rung is
`slope = r · sy / sx` and that is meaningless without an r in the room. It is
generated from deck A's own payoff slide, not retyped.

**One source, two outputs.** `deck.md` stays authoritative and carries a
single `<!-- DECK-SPLIT: b -->` marker; `split-deck.py` derives both files.
That keeps the ladder visible as one thing while it is edited — the rungs run
0–23 across both decks, so a change to how rung 12 builds r has to be legible
to whoever is editing rung 16.

**Trap found doing this.** The first split used `source.split("\n---\n")`,
which is wrong: the `annotated-code` exhibit contains R's `summary(lm)`
output, and R prints a literal `---` line before `Signif. codes`. That cut the
exhibit in half and sent the halves into different slides. The platform then
rejoined them and rendered something that looked almost right — it showed up
only as a slide-count mismatch (39 source blocks, 38 rendered). `split-deck.py`
now tracks fence state exactly as the platform's own parser does.


---

## 9. Pearson and Spearman in SQL (instructor, 2026-09-23)

*"could we also add slides re: computing the Pearson and Spearman correlation
coefficients in MySQL / MariaDB?"*

Deck A already **built** Pearson's r across rungs 8–13 without ever naming it.
Three slides added after the r payoff ("Now point it at anything"), before
"The same points, at five values of ρ" — i.e. the ladder finishes correlation
in SQL before moving to the pictures:

| # | slide | what it adds |
|---|---|---|
| 43 | *(existing)* "Step 5 — and there is r" | **renamed, not duplicated**: its notes now say this is **Pearson's** r |
| 45 | Ranks | rung **13a** — `RANK() OVER (ORDER BY x)`, the deck's FIRST window function |
| 46 | Spearman's ρ | rung **13b** — the Pearson chain with `d` replaced by the ranks |
| 47 | Pearson or Spearman? | a plain two-column comparison table |

**The dataset is `marathon_opinion`, and the reason is the whole lesson.**
Pearson on the raw distances is **−0.770**; it only reaches **−0.948** after a
`LOG10`. Spearman on the *same raw column* is **−0.950** — it lands where
Pearson needed a transform to get, because it never required a straight line,
only a one-way relationship.

**Ties: handled properly, not dodged.** The `opinion` column has **315 tied
rows out of 400**, so plain `RANK()` is not defensible here. The slide computes
true average ranks:

```sql
RANK() OVER (ORDER BY v) + (COUNT(*) OVER (PARTITION BY v) - 1) / 2
```

(Plain `RANK()` happens to give −0.9503 against the correct −0.9502 on this
data — but relying on a coincidence in a teaching query would be dishonest.)
Tie-free alternatives were measured and rejected on pedagogy: `housing` has no
ties at all, but its Spearman (0.889) is *lower* than its Pearson (0.939),
which teaches nothing.

**`OVER` is the one exception to the no-window-functions ruling.** Ranking is
the single thing plain aggregates cannot express, and the alternative (a
correlated subquery counting smaller rows) is harder to read for no gain. It
appears on exactly two slides, introduced as one new idea, and
`check_deck_sql.py` enforces that it appears nowhere else in the deck.

Values asserted in `mysql/test_week09_gen.py` against `scipy.stats.spearmanr`
and `pearsonr`, including that the SQL average-rank identity matches
`scipy.stats.rankdata`.


---

## 10. Instructor edits and the prod copy (2026-09-23)

**Two deletions plus a register sweep** (see the hand-off report for the full
list with slide numbers — every removed line is listed so it can be vetoed).
The rule applied: a line earns its place on a slide if it teaches something the
slide does not already show. Lines that narrate what the deck is about to do,
or restate the bullets directly above them, moved to the speaker notes or went.
**SQL slides, notes and figures were not touched.** Deck A 62 → **61 slides**.

**Deck A copied to PROD** as a new deck, same slug, `instructors` /
unpublished, deck id **4**. The three decks the instructor edits live on prod
(`week-7-data-quality`, `mbua512-week-07`, `mbua512-data-graphics`) were
verified untouched before and after — their `updated_at` did not move.

Prod has all eight week-9 tables in `stats_demo` with row counts matching the
generator (100/500/400/300/228/50/120/23), so all 18 SQL slides were run and
pinned on prod and **every pinned value equals dev's**.

To re-upload deck A to prod later, the payload builder and in-pod script are
tier-agnostic — copy `payload-a.json` + `upload-deck.py` into the prod web pod
and run the same one-liner. `upload.sh`/`update.sh` deliberately refuse prod.


---

## 11. The Appendix, and the pin trap (2026-09-24)

*"let's move the following slides on prod to an appendix: (1) any slides with
formulae, (2) the log axis slide and marathon example, (3) the beer example."*

Deck A ends with an **Appendix** section of nine slides, each thread in its
original internal order. Deck A 61 → **64 slides** (52 main + appendix header +
9 moved + 2 replacement figures). Deck B untouched.

**PINS ARE STORED IN THE DECK SOURCE, AND A REBUILD WIPES THEM.**
`Pin result` does not keep rows in a side table keyed by slide — it writes them
into the deck markdown right after the fence, between two invisible
`[//]: # (…)` lines. The authoring source in this repo has never carried them,
because pinning happens in a browser against a running tier. So a plain
`split-deck.py` + PUT **deletes every pinned result**, and on prod that is the
only data students ever see: a slide with no pin shows them SQL and nothing.

Found the hard way here — prod carried 18 pin blocks, dev carried 0, the local
source carried 0, and the first dev re-upload duly wiped dev's. Fixed by:

- `carry-pins.py`, which lifts pins from the live deck onto the rebuilt one
  **matched by SQL text, never by position** (the whole point of an appendix
  move is that slides move). It refuses to guess: anything ambiguous or
  unmatched is reported and left alone.
- `upload.sh` / `update.sh` now do this automatically — they pull the tier's
  current content and carry its pins before building the payload.
  `CARRY_PINS=0` opts out for a genuinely new deck.

All 18 pins survived onto both tiers, so no re-pinning was needed after the
move.


---

## 12. Instructor edits, 2026-09-25

**1. Rasinski (1989) Table 2 on "Confusing Question ⇒ Confusing Answer".**
The full table is portrait (1081×1359) and rendered **173×217 device pixels at
1366** in the split layout — the body text, which is the entire point of
showing a table, was unreadable. Taking the pre-authorised fallback, the slide
now carries the **Welfare block alone** (1081×445 landscape → **667×275 at
1366, legible**) and the full table follows on its own slide, "(full table)",
at 0.63 of the stage. Citation under both figures; the teaching point (same
respondents, same year: "assistance to the poor" ≈64% vs "welfare" ≈20–25%,
one word, ~40 points) is in the speaker notes.

**2. The Spearman thread moved to the Appendix** — Ranks, Spearman's ρ,
Pearson or Spearman? — placed after the marathon thread it reads on from, so
the "see the appendix" pointer was removed and replaced with a "follows on
from the marathon slides above" note. Main-body ladder re-checked: zero
one-new-idea violations, and **`OVER` no longer appears in the main body at
all**.

**3. Five "interpreting" one-liners merged** into one slide, **"Reading ρ"**,
three bullets, with all five slides' speaker notes folded in.

**Deck A: 61 slides = 48 main + Appendix header + 12 appendix.** All 18 pins
carried through every step.

**CSS trap found here:** the uploader rewrites `asset:name.png` to a
**content-hash URL**, so a rule keyed on `img[src*="name"]` matches nothing
once deployed. Key deck CSS off the **alt text** instead. A second rule then
lost a specificity tie to this stylesheet's own generic figure bound and had to
be doubled (`:has(...):has(> img)`) to win — both are commented in the
stylesheet.
