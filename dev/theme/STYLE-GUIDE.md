# MBUA 512 Slide Style Guide

A house style for the MBUA 512 lecture decks. The aim is a set of slides that
look like they belong to a serious methods class at Te Herenga Waka — Victoria
University of Wellington: **quiet, legible, and confident, with nothing on the
slide that isn't doing work.**

The rules below are opinionated on purpose. Consistency is what makes a deck
feel considered; the constraints are the point.

---

## 1. First principles

1. **The slide supports the speaker; it is not the handout.** One idea per
   slide. If a slide has two ideas, it is two slides.
2. **Whitespace is a design element.** A slide that feels empty is usually
   correct. Resist the urge to fill it.
3. **Ornament must earn its place.** Every rule, colour, and mark should carry
   meaning. When in doubt, take it out.
4. **Restraint reads as authority.** In a methods class, a plain, well-set
   slide signals that the content is what matters.

---

## 2. What we are moving away from

The previous decks were plain but heavily emoji-laden (📊 💡 ⏰ 😃 👉 ❓). That
reads as informal and dates quickly. We are replacing it with **typographic
signalling** — weight, a hairline rule, a single accent colour — which does the
same signposting work without the noise.

| Old habit | Replace with |
|---|---|
| 📊 / 💡 in a heading | Nothing. The heading stands on its own. |
| ⏰ to flag an activity | The `activity` convention (§7) — a labelled panel. |
| ❓ before a question | A `> ` blockquote, or a `quote` slide. |
| 😃 / 👉 for tone/pointing | Cut. Let the words carry it. |
| Emoji as bullets | Real list markers. |

> **The one rule that overrides the rest:** no *decorative* emoji. A literal
> glyph standing in for a real object in the content (a keyboard key, say) is
> fine; emoji as decoration or emphasis is not.

**The semantic exception.** ✅ and ❌ are permitted when they carry real
meaning — correct vs. incorrect, keep vs. avoid, do vs. don't — because the pair
does genuine signposting work that colour alone can't (and reads at a glance in
greyscale). Likewise ❓ may mark a genuine question prompt. Use them only for
that contrast, never as bullets or decoration, and don't mix them with the
sienna accent on the same line.

---

## 3. Grid, spacing, and altitude

- **One padding value** governs every slide edge (`--pad`, 72px). Don't fight it.
- **Line length is capped** at ~62 characters (`--measure`). Long paragraphs
  wrap early on purpose — it keeps text scannable and leaves the right margin
  as breathing room.
- **Vertical rhythm:** headings own the top; content sits below with a single
  clear gap. Don't centre body text vertically on content slides — align to the
  top so slides in a sequence line up.
- **Never more than ~6 lines of body text** on a content slide. If it doesn't
  fit, it's two slides or it belongs in the speaker notes.

---

## 4. Typography

One serif carries the whole deck — headings and body alike. This is deliberate:
a single family reads as calmer and more considered than a serif/sans pairing,
and it echoes VUW's own use of its brand serif, **Feijoa**. We can't ship Feijoa
(it's a commercial Klim Type Foundry face), so the theme substitutes
**Newsreader**, the closest open-licence match — warm, humanist, low-contrast.

| Role | Typeface | Notes |
|---|---|---|
| Headings **and** body | **Newsreader** (serif) | Feijoa-alike. Weight 400–600; italic for light stress. |
| Code / data | **IBM Plex Mono** | Queries, output, variable names — the one place a monospace is unavoidable. |

- The hierarchy is carried by **size, weight, and colour** — never by switching
  to a second family. Headings are heavier and green; body is regular-weight ink.
- Set headings in **green**, body in **near-black ink** — never pure `#000`.
- Use **weight and colour** for emphasis, not italics-plus-bold-plus-underline
  stacked together. Pick one.
- `**strong**` renders in brand green and means *"this is the term to remember."*
  Use it for the key noun in a definition, not for whole sentences.
- `*emphasis*` is ordinary italic. Fine for a light stress or a title of a work.

---

## 5. Colour

The palette is small on purpose. Full tokens live in `mbua512.css` (§2).

| Token | Hex | Use |
|---|---|---|
| `--vuw-green` | `#003824` | Headings, title/section fields, the mark. |
| `--vuw-green-mid` | `#005c3c` | Rules, links, list markers, sub-heads. |
| `--vuw-green-tint` | `#eef2ef` | Code blocks, quiet panels. |
| `--ink` | `#1c211e` | Body text. |
| `--ink-soft` | `#5c655f` | Captions, credits, page numbers. |
| `--paper` | `#fbfaf7` | Background (warm off-white). |
| `--cream` | `#fef9f0` | Callout-slide field (VUW's warm cream neutral). |
| `--accent` | `#b8552e` | **One** emphasised idea per slide, at most. |

**The accent rule:** burnt sienna is the only warm colour in the system. Use it
for at most one element on a slide, and not on every slide. Its power comes from
scarcity — if it's everywhere it means nothing.

---

## 6. Ornament

The deck carries **no standing ornament**. Identity comes from the deep green
field, the serif type, and the single sienna accent — nothing more. The one
recurring mark is the short green rule beneath an h1, which signals the top of a
content slide.

- Don't add decorative shapes, icons, dividers, or corner marks.
- On a full-bleed diagram slide where even the h1 rule is distracting, suppress
  it with `_class: plain`.

---

## 7. Slide types (classes)

Set a slide's type with an HTML comment on its first line: `<!-- _class: NAME -->`.

| Class | When to use |
|---|---|
| *(none)* | Standard content slide. The default. |
| `title` | Opening slide. **Title and course line only** (see CLAUDE.md). |
| `section` | Divider between major parts of a lecture. One line of text. |
| `callout` | One short takeaway — dark green on VUW's warm cream field. |
| `quote` | A slide given over to a single definition, statement, or question. |
| `plain` | Suppress the h1 rule — for a full-bleed figure. |

**`callout` vs. `quote` vs. `section`.** All three are single-message slides, so
keep them distinct: `callout` is the *takeaway* — a claim or reassurance you
want to land, on cream; `quote` is a *cited or declamatory statement/question*,
on paper; `section` is a *structural divider*, on green. Use `callout`
sparingly — two or three in a lecture, at the beats that matter. Write the
message as a single short paragraph (no heading), one or two lines.

**Control the line breaks.** Don't leave callout wrapping to chance — a lone
last word ("…You can do / this.") looks bad. Put an explicit `<br>` at the
clause or sentence boundary where the line should break; the box grows to fit
each line, so keep whole sentences together where they fit. One sentence per
line for a two-sentence takeaway; a natural clause break for a long single one.

Keep the `<br>` **inline** — text on both sides on the *same source line*
(`…system<br>that enables…`). A `<br>` followed by a real newline makes MARP
emit `<br><br>` and you get a blank line in the middle of the callout.

Two conventions that are styling patterns rather than classes:

- **Activity slides.** Open the heading with `Activity —` (an em dash, no ⏰).
  Keep the task to a short numbered list. This replaces the old clock emoji.
- **Accent callout.** Wrap the one word or phrase worth emphasising in
  `<span class="accent">…</span>`, sparingly (§5).

---

## 8. Images, figures, and data

- Prefer **one figure per slide**, sized to sit comfortably inside the margins.
  Use MARP's `bg right`/`bg left contain` split-layout for figure-plus-text.
- **Every borrowed image is credited.** Unsplash images get a
  `<p class="credit">Photo by NAME on Unsplash</p>` line (per CLAUDE.md). Other
  sources get an inline attribution in `--ink-soft`.
- **Charts follow the same palette:** green as the primary series, ink for axes
  and labels, sienna reserved for the one series you want to draw the eye to.
  No rainbow categorical palettes, no 3-D, no drop shadows.
- **Data and code** go in `mono`. Keep query examples short; show the shape of
  the answer rather than a wall of output.

---

## 9. Writing on slides

- **Headlines are phrases, not sentences.** No terminal full stop on a heading.
- **Sentence case** for headings, not Title Case.
- **Parallel structure** in lists — start every item the same grammatical way.
- Cut filler: "In this slide we will look at…" → just show it.
- New Zealand English spelling throughout (*normalisation*, *behaviour*,
  *organisation*).

---

## 10. Rendering

The theme is a MARP CSS theme. See `dev/theme/README.md` for the exact CLI and
`.marprc.yml` setup. In brief:

```bash
marp --theme dev/theme/mbua512.css --allow-local-files \
     dev/week-01/mbua512-01.md -o out/mbua512-01.html
# add --pdf for a PDF, --pptx for PowerPoint
```

Every deck's front-matter should read:

```yaml
---
marp: true
theme: mbua512
paginate: true
---
```

---

## 11. The two-minute checklist

Before a deck ships, skim it once against this:

- [ ] No decorative emoji. (✅ / ❌ / ❓ only where they carry real meaning.)
- [ ] One idea per slide; nothing over ~6 body lines.
- [ ] The accent colour appears rarely, never twice on one slide.
- [ ] Headings are green, sentence case, no trailing full stop.
- [ ] Every borrowed image is credited.
- [ ] Lists are parallel; NZ spelling; no `Title Case` headings.
- [ ] The deck still makes sense with the speaker absent *only where it must*
      (i.e. it's slides, not a document).
