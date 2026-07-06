# MBUA 512 slide theme

An understated, minimalist MARP theme for the MBUA 512 lecture decks, grounded
in the visual language of Te Herenga Waka — Victoria University of Wellington.

## Files

| File | What it is |
|---|---|
| `mbua512.css` | The MARP theme. All colour, type, and layout live here. |
| `STYLE-GUIDE.md` | The house style — the rules the theme is built to serve. |
| `TEMPLATE.md` | A starter deck demonstrating every slide type. Copy it. |

## Starting a new deck

Copy `TEMPLATE.md` and edit. Every deck's front-matter is:

```yaml
---
marp: true
theme: mbua512
paginate: true
---
```

## Rendering

### The easy way — build all decks

`dev/build-slides.sh` finds every deck that declares `theme: mbua512` (any
`dev/**/mbua512-*.md`) and renders it to HTML + PDF beside the source. New class
folders are picked up automatically.

```bash
./dev/build-slides.sh            # render every mbua512-themed deck
./dev/build-slides.sh class-01   # render only decks under dev/class-01
```

It uses `marp` if installed, otherwise falls back to `npx @marp-team/marp-cli`.

### Auto-render on push (CI)

You don't have to remember to run the build. The **Render slides** workflow
(`.github/workflows/render-slides.yml`) re-renders and commits the HTML/PDF on
every push to `main` that touches a deck's `.md`, the theme, or the build
script — so the repo and the deployed site never drift from the Markdown. It
skips itself when only generated files change, so there's no loop. You can also
trigger it manually from the Actions tab (**Run workflow**).

### By hand (single deck)

The theme must be registered with MARP. Pass it on the command line:

```bash
# HTML
marp --theme dev/theme/mbua512.css --allow-local-files \
     dev/class-01/mbua512-01.md -o dev/class-01/mbua512-01.html

# PDF (needs a headless Chrome available to marp)
marp --theme dev/theme/mbua512.css --allow-local-files --pdf \
     dev/class-01/mbua512-01.md -o dev/class-01/mbua512-01.pdf
```

If you don't have the MARP CLI, run it via `npx`:

```bash
npx @marp-team/marp-cli@latest --theme dev/theme/mbua512.css \
    --allow-local-files dev/class-01/mbua512-01.md -o dev/class-01/mbua512-01.html
```

### While authoring — live watch

`marp --watch` re-renders instantly and live-reloads a browser preview as you
edit:

```bash
marp --watch --theme dev/theme/mbua512.css --allow-local-files \
     dev/class-01/mbua512-01.md -o dev/class-01/mbua512-01.html
```

## Fonts

The deck is set in a single serif — **Newsreader**, used for both headings and
body — with **IBM Plex Mono** for code. Newsreader is the closest open-licence
stand-in for VUW's brand serif, **Feijoa** (Klim Type Foundry), which is
commercial and can't be redistributed.

Both fonts are **self-hosted**: the latin-subset `.woff2` files are base64-embedded
as `@font-face` blocks directly inside `mbua512.css` (between the `FONTS:BEGIN`
/ `FONTS:END` markers). This is deliberate — MARP's PDF export via headless
Chrome does *not* reliably wait for a remote `@import`, so a Google Fonts import
gives Newsreader in the browser but a **Georgia fallback in the PDF**. Embedding
the fonts makes HTML and PDF identical, needs no network at render time, and
keeps the HTML self-contained.

To regenerate the fonts (e.g. to add a weight):

```bash
bash dev/theme/fonts/build-fonts.sh    # download + base64 the woff2 into fonts/fonts.css
bash dev/theme/fonts/inline-fonts.sh   # splice them into mbua512.css between the markers
```

If your unit has a licensed copy of Feijoa, swap the `--serif` token at the top
of `mbua512.css` to use it — every heading and paragraph follows automatically.

## Notes

- The theme's internal name (`/* @theme mbua512 */`) is what `theme: mbua512`
  in a deck's front-matter refers to — it is independent of the filename, but
  we keep them the same on purpose.
- Read `STYLE-GUIDE.md` before writing content. The theme can only do half the
  work; the other half is restraint in the markdown.
