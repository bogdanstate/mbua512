---
marp: true
theme: mbua512
paginate: true
---

<!-- _class: title -->

# The distinctiveness of methods

MBUA 512

<!--
TITLE SLIDE — per house style, title and course line only.
No subtitle, no date, no author list unless explicitly wanted.
The green field and niho taniwha band come from `_class: title`.
-->

---

<!-- _class: section -->

# 1 — Where we're going

<!--
SECTION DIVIDER — one line. Use these to break a lecture into parts.
The short rule under the heading is the sienna accent; it's the only
place the accent appears automatically.
-->

---

# Today

1. What makes a measure trustworthy
2. Reliability and validity
3. An activity — auditing a metric
4. Where this goes next

<!--
STANDARD CONTENT SLIDE — the default (no class).
Headings are sentence case, no trailing full stop. Parallel list items.
The corner niho taniwha mark and the green rule under the h1 are automatic.
-->

---

# One idea per slide

A slide carries a single claim. The speaker carries the rest.

If a slide needs two headings to be understood, it is really two slides —
split it and let each breathe.

<span class="accent">Whitespace is not wasted space.</span> It's what makes the
one idea land.

<!--
Note the accent: exactly one phrase, once. That's the rule.
Body text stays under ~6 lines and wraps early by design.
-->

---

<!-- _class: callout -->

A trustworthy measure is both reliable and valid — and the two come apart.

<!--
CALLOUT SLIDE — one short takeaway on VUW's warm cream field. No heading; write
the message as a single short paragraph. Use sparingly, at the beats that
matter. Distinct from `quote` (a cited statement, on paper) and `section` (a
green divider).
-->

---

# Reliability and validity

> **Reliability** is consistency: the same instrument gives the same reading
> under the same conditions.

> **Validity** is aptness: the instrument measures the thing you actually mean
> to measure.

A measure can be reliable without being valid — a bathroom scale that always
reads two kilos heavy is perfectly consistent, and perfectly wrong.

<!--
DEFINITIONS — use blockquotes. The **strong** term renders in brand green:
it's the word to remember. The left rule replaces any quotation-mark ornament.
-->

---

<!-- _class: quote -->

> If you can't say how you'd be wrong, you're not doing methods yet.

<!--
QUOTE SLIDE — a single statement, definition, or question given the whole
frame. Serif, large, green. No attribution ornament; add a plain line below
if you need a source.
-->

---

# Activity — audit a metric

In groups of three to four, pick one metric your organisation reports on.

1. What decision is it meant to inform?
2. What would make it *unreliable*? What would make it *invalid*?
3. What's one cheaper measure that might do the same job?

**Ten minutes**, then we compare notes.

<!--
ACTIVITY SLIDE — heading opens with "Activity —" (em dash), no clock emoji.
Short numbered task. The time cue is bold text, not an icon.
-->

---

# A worked example

```sql
select region,
       count(*)            as n,
       avg(response_days)  as mean_days
from   support_tickets
group  by region
order  by mean_days desc;
```

The query is short on purpose: it shows the *shape* of the answer, not a wall
of output. Discuss the result live rather than pasting it onto the slide.

<!--
CODE — IBM Plex Mono on a pale green panel. Keep examples short.
Inline `code` (like `count(*)`) uses the same panel colour.
-->

---

# Reading a result

| Region | n | Mean days | Read |
|---|---:|---:|---|
| North | 412 | 3.1 | within target |
| Central | 388 | 4.6 | watch |
| South | 205 | 7.9 | investigate |

Hairlines only — no zebra fill, no boxes. The eye follows the numbers, not the
grid.

<!--
TABLE — right-align numeric columns. The header rule is green; body rows are
separated by hairlines only.
-->

---

<!-- _class: plain -->

![bg right:55% contain](../../correlation_data.json)

# Figure-and-text

Use MARP's split background (`bg right contain`) for one figure beside a short
reading of it. `_class: plain` drops the corner mark so it doesn't fight the
figure.

Replace the path above with a real image. Charts follow the deck palette:
green primary, ink axes, sienna for the one series worth the eye.

<!--
FIGURE SLIDE — swap the bg image for a real PNG/SVG. The `plain` class keeps
the field clean. This slide's bg path is illustrative only.
-->

---

# Crediting an image

![bg cover](../../ricardo-gomez-angel-7RuhOrZO-1g-unsplash.jpg)

<p class="credit">Photo by Ricardo Gómez Ángel on Unsplash</p>

<!--
CREDIT LINE — every borrowed image is credited. The `.credit` class pins a
small soft-ink line to the lower-left, over dark or light backgrounds.
-->

---

<!-- _class: section -->

# 2 — Where this goes next

---

# Key takeaways

- A trustworthy measure is both **reliable** and **valid** — and the two come
  apart.
- The slide holds one idea; you hold the rest.
- Restraint is a choice, and it reads as authority.

*Next week: sampling, and why a big sample of the wrong thing is still the
wrong thing.*

<!--
CLOSING — a short, parallel recap. The forward look is set in light italic,
not a new heading. No "Thank you" slide, no emoji sign-off.
-->
