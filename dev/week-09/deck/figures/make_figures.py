#!/usr/bin/env python3
"""Draw every static figure in the week-09 deck, deterministically.

    ../../../../infra/... no -- run it from this directory with a venv that has
    matplotlib + numpy:

        python3 make_figures.py [--only NAME] [--out ../assets]

WHY THESE ARE DRAWN, NOT SCREENSHOTTED
--------------------------------------
The old week-09 deck drew these pictures in hand-rolled Canvas 2D, from data
it generated in JavaScript at parse time. Screenshotting those canvases would
carry their bugs forward and, worse, would show numbers that no longer match
what a student's SQL query returns.

So every figure here is REDRAWN from the same rows the `sql-live` slides query
-- the committed CSVs and the regenerated `housing` points in
`infra/mysql/week09-gen.py`. A figure and its slide's SQL cannot disagree,
because they read the same data through the same code.

DEFECTS FIXED RATHER THAN PORTED (each was in the old deck)
-----------------------------------------------------------
1. R^2 Venn (old slide 36): the circle separation was LINEAR in R^2, so at
   R^2 = 0.5 the lens was 0.39 of a circle while the caption claimed the area
   WAS R^2. Here the distance is solved numerically so lens/circle == R^2.
2. rho slider (old 34): resampled unseeded on every tick, so the cloud
   "boiled" and the printed rho was the slider's, never the sample's. Here the
   x and z draws are FIXED and each panel prints its own sample r.
3. "Gradient descent" (old 64): was an easeOutCubic lerp to the closed-form
   answer, i.e. not descent at all. Here the SSR curve is drawn honestly as a
   function of the slope, with the least-squares minimum marked.
4. Two groups (old 50): the "same intercept" dot sat at x=10, where the two
   lines differ by 25 units. Drawn at x=0, where an intercept actually lives.
5. Prediction (old 51): a decorative sin() wobble stood in for uncertainty.
   Replaced with a real 95% prediction interval.
6. STONKS (old 66): the R^2 values were typed in; nothing was fitted. Here
   junk predictors are actually fitted and R^2 vs adjusted R^2 are measured.

DETERMINISM
-----------
No figure uses an unseeded random draw. Re-running this produces
byte-comparable PNGs (matplotlib metadata is pinned off). 1600x900 at the
deck's aspect unless a figure says otherwise; PNG, well under the 4 MiB cap.
"""

from __future__ import annotations

import argparse
import csv
import math
import pathlib
import random
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
# The generator and its committed CSVs are the single source of truth for
# every number on a slide.
MYSQL_DIR = pathlib.Path("/home/bogdan/infra/mysql")
DATA_DIR = MYSQL_DIR / "week09" / "data"

# --- course palette --------------------------------------------------------
# Te Herenga Waka-ish, matching the deck theme's ink rather than the old
# deck's saturated primaries.
INK = "#1a1a1a"
SOFT = "#5d655f"
BLUE = "#1f5c8b"
RED = "#a8322d"
GREEN = "#2f6d४f".replace("४", "4")  # keep it ascii-safe
GREEN = "#2f6d4f"
PURPLE = "#6b4a7d"
AMBER = "#b8860b"
GRID = "#d8dcd9"

FIGSIZE = (16, 9)
DPI = 100


def style_axes(ax, *, grid=True):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(SOFT)
    ax.tick_params(colors=SOFT, labelsize=15)
    ax.xaxis.label.set_color(INK)
    ax.yaxis.label.set_color(INK)
    ax.xaxis.label.set_size(18)
    ax.yaxis.label.set_size(18)
    if grid:
        ax.grid(True, color=GRID, linewidth=0.8, alpha=0.9)
        ax.set_axisbelow(True)


def new_fig(figsize=FIGSIZE):
    fig = plt.figure(figsize=figsize, dpi=DPI)
    fig.patch.set_facecolor("white")
    return fig


def save(fig, out_dir: pathlib.Path, name: str):
    path = out_dir / f"{name}.png"
    fig.savefig(path, dpi=DPI, facecolor="white", bbox_inches="tight",
                metadata={"Software": None, "Creation Time": None})
    plt.close(fig)
    size = path.stat().st_size
    print(f"  {name:38s} {size / 1024:7.1f} KiB")
    if size > 4 * 1024 * 1024:
        raise SystemExit(f"{name} exceeds the 4 MiB asset cap")
    return path


# --- data ------------------------------------------------------------------


def read_csv(name):
    with (DATA_DIR / name).open(newline="") as fh:
        return list(csv.DictReader(fh))


def load_generator():
    """Import infra/mysql/week09-gen.py so figures use the same numbers."""
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "week09_gen", MYSQL_DIR / "week09-gen.py"
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules["week09_gen"] = mod
    spec.loader.exec_module(mod)
    return mod


GEN = load_generator()


def pearson(xs, ys):
    return GEN.pearson(list(xs), list(ys))


def ols(xs, ys):
    return GEN.ols(list(xs), list(ys))


def housing_xy():
    rows = GEN.housing_rows()
    return [float(r[1]) for r in rows], [float(r[2]) for r in rows], [r[3] for r in rows]


def annotate_r(ax, r, *, loc="upper left", extra=None, color=RED):
    txt = f"r = {r:.3f}"
    if extra:
        txt += f"\n{extra}"
    at_x, at_y = (0.03, 0.97) if loc == "upper left" else (0.97, 0.05)
    ha = "left" if loc == "upper left" else "right"
    va = "top" if loc == "upper left" else "bottom"
    ax.text(at_x, at_y, txt, transform=ax.transAxes, fontsize=22, color=color,
            ha=ha, va=va, fontweight="bold")


# ===========================================================================
# 1. Correlation basics
# ===========================================================================


def fig_same_r(out):
    """Old slide 4: three very different clouds, one correlation.

    The old deck morphed 2,000 points between shapes from a 320 KB JSON. The
    teaching point is the three end states, so three panels say it without the
    animation -- and each panel prints its OWN sample r, so the claim is
    checkable rather than asserted.
    """
    rng = np.random.default_rng(90210)
    n = 400
    panels = []

    # A blob with a mild positive tilt.
    x = rng.normal(0, 1, n)
    y = 0.1 * x + rng.normal(0, 1, n)
    panels.append(("A shapeless cloud", x, y))

    # An X: two crossing arms. Correlation near zero by symmetry.
    t = rng.uniform(-2, 2, n)
    s = np.where(rng.random(n) < 0.5, 1, -1)
    x2 = t
    y2 = s * t + rng.normal(0, 0.22, n)
    panels.append(("Two crossing arms", x2, y2))

    # A smiley-ish arc pair.
    ang = rng.uniform(math.pi * 1.08, math.pi * 1.92, n)
    x3 = 1.7 * np.cos(ang)
    y3 = 1.7 * np.sin(ang) + 1.1
    x3 += rng.normal(0, 0.12, n)
    y3 += rng.normal(0, 0.12, n)
    panels.append(("A curve", x3, y3))

    fig, axes = plt.subplots(1, 3, figsize=(16, 6.2), dpi=DPI)
    fig.patch.set_facecolor("white")
    for ax, (title, xx, yy) in zip(axes, panels):
        ax.scatter(xx, yy, s=26, color=BLUE, alpha=0.5, edgecolors="none")
        ax.set_title(title, fontsize=20, color=INK, pad=12)
        style_axes(ax)
        ax.set_xticklabels([])
        ax.set_yticklabels([])
        annotate_r(ax, pearson(xx, yy), color=RED)
    fig.suptitle("Same correlation, different pictures — always plot the data",
                 fontsize=24, color=INK, y=1.0)
    fig.tight_layout()
    return save(fig, out, "same-r-three-clouds")


def fig_rho_strip(out):
    """Old slide 34, fixed: the rho slider as five honest panels.

    The old widget resampled on every tick (so the cloud boiled) and labelled
    each frame with the SLIDER's rho, never the sample's r. Here one fixed
    seeded pair (x, z) is reused at every rho -- so the panels are the SAME
    points relaxing -- and each panel reports its own sample r beside the
    population rho that generated it.
    """
    rng = np.random.default_rng(1848)
    n = 140
    x = rng.normal(0, 1, n)
    z = rng.normal(0, 1, n)
    rhos = [-1.0, -0.5, 0.0, 0.5, 1.0]

    fig, axes = plt.subplots(1, 5, figsize=(16, 4.3), dpi=DPI)
    fig.patch.set_facecolor("white")
    for ax, rho in zip(axes, rhos):
        y = rho * x + math.sqrt(max(0.0, 1 - rho ** 2)) * z
        ax.scatter(x, y, s=22, color=BLUE, alpha=0.55, edgecolors="none")
        ax.set_title(f"ρ = {rho:+.1f}", fontsize=19, color=INK, pad=10)
        ax.text(0.5, -0.17, f"sample r = {pearson(x, y):+.2f}",
                transform=ax.transAxes, fontsize=15, color=RED, ha="center")
        style_axes(ax)
        ax.set_xticklabels([])
        ax.set_yticklabels([])
        ax.set_xlim(-3.2, 3.2)
        ax.set_ylim(-3.2, 3.2)
    fig.suptitle("The same points, at five values of ρ", fontsize=23, color=INK, y=1.04)
    fig.tight_layout()
    return save(fig, out, "rho-strip")


def _lens_fraction(d: float) -> float:
    """Area of the lens of two unit circles at centre distance d, / circle area."""
    if d >= 2.0:
        return 0.0
    if d <= 0.0:
        return 1.0
    # Standard circle-circle intersection for equal radii r=1.
    area = 2 * math.acos(d / 2) - (d / 2) * math.sqrt(4 - d * d)
    return area / math.pi


def _distance_for_overlap(target: float) -> float:
    """Invert _lens_fraction by bisection -- THE FIX for the old slide."""
    lo, hi = 0.0, 2.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if _lens_fraction(mid) > target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def fig_r2_venn(out):
    """Old slide 36, fixed: shared area really is R^2.

    The old widget moved the circles LINEARLY in R^2, so at R^2 = 0.5 the
    lens was 0.39 of a circle while the caption said the shared area WAS R^2.
    Here the separation is solved by bisection so the printed fraction is the
    measured one.
    """
    targets = [0.0, 0.25, 0.5, 0.81]
    fig, axes = plt.subplots(1, 4, figsize=(16, 4.6), dpi=DPI)
    fig.patch.set_facecolor("white")
    for ax, t in zip(axes, targets):
        d = _distance_for_overlap(t) if t > 0 else 2.0
        c1 = plt.Circle((-d / 2, 0), 1.0, facecolor=BLUE, alpha=0.42,
                        edgecolor=BLUE, linewidth=2)
        c2 = plt.Circle((d / 2, 0), 1.0, facecolor=AMBER, alpha=0.42,
                        edgecolor=AMBER, linewidth=2)
        ax.add_patch(c1)
        ax.add_patch(c2)
        ax.set_xlim(-2.3, 2.3)
        ax.set_ylim(-1.45, 1.6)
        ax.set_aspect("equal")
        ax.axis("off")
        measured = _lens_fraction(d)
        ax.set_title(f"R² = {t:.2f}", fontsize=20, color=INK, pad=6)
        ax.text(0.5, -0.06, f"shared area = {measured:.2f} of each circle",
                transform=ax.transAxes, fontsize=14, color=SOFT, ha="center")
        ax.text(-d / 2 - 0.55, 1.15, "X", fontsize=17, color=BLUE, ha="center")
        ax.text(d / 2 + 0.55, 1.15, "Y", fontsize=17, color=AMBER, ha="center")
    fig.suptitle("R² is the share of the variation the two variables hold in common",
                 fontsize=22, color=INK, y=1.02)
    fig.tight_layout()
    return save(fig, out, "r2-overlap")


# ===========================================================================
# 2. The scatter slides (the ported R cells)
# ===========================================================================


def fig_fun_scatter(out):
    """Old slide 16 / R cell 2: Type 1 vs Type 2 fun, coloured by category."""
    rows = read_csv("type1_vs_type2_fun.csv")
    cats = {
        "Type 1 (Fun during & after)": GREEN,
        "Type 2 (Miserable during, great after)": RED,
        "Neutral (Meh during & after)": SOFT,
    }
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    for cat, colour in cats.items():
        grp = [r for r in rows if r["FunCategory"] == cat]
        ax.scatter([float(r["FunDuring"]) for r in grp],
                   [float(r["FunAfter"]) for r in grp],
                   s=95, color=colour, alpha=0.75, edgecolors="none",
                   label=f"{cat}  (n={len(grp)}, r={pearson([float(r['FunDuring']) for r in grp], [float(r['FunAfter']) for r in grp]):+.2f})")
    ax.plot([1, 10], [1, 10], ls="--", color=SOFT, lw=1.6)
    ax.text(9.4, 9.7, "equal fun\nduring & after", fontsize=13, color=SOFT,
            ha="right", va="top")
    ax.set_xlabel("Fun during the activity (1–10)")
    ax.set_ylabel("Fun after the activity (1–10)")
    ax.set_xlim(1, 10)
    ax.set_ylim(1, 10)
    style_axes(ax)
    d = [float(r["FunDuring"]) for r in rows]
    a = [float(r["FunAfter"]) for r in rows]
    ax.set_title(f"Type 1 vs Type 2 fun — pooled r = {pearson(d, a):+.2f}",
                 fontsize=23, color=INK, pad=14)
    ax.legend(fontsize=13, loc="lower right", frameon=False)
    fig.tight_layout()
    return save(fig, out, "fun-scatter")


def _fire(col_x, col_y, xlabel, ylabel, title, colour, name, out, scale_y=1.0):
    rows = read_csv("fire_incidents_synthetic.csv")
    x = [float(r[col_x]) for r in rows]
    y = [float(r[col_y]) / scale_y for r in rows]
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.scatter(x, y, s=42, color=colour, alpha=0.42, edgecolors="none")
    slope, intercept = ols(x, y)
    xs = np.array([min(x), max(x)])
    ax.plot(xs, intercept + slope * xs, color=colour, lw=2.6)
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    style_axes(ax)
    ax.set_title(title, fontsize=23, color=INK, pad=14)
    annotate_r(ax, pearson(x, y), color=colour)
    fig.tight_layout()
    return save(fig, out, name)


def fig_fire_ff_damage(out):
    """Old 19: the headline (and misleading) correlation."""
    return _fire("firefighters", "property_damage", "Number of firefighters",
                 "Property damage ($ millions)",
                 "Firefighters vs property damage", RED,
                 "fire-firefighters-damage", out, scale_y=1e6)


def fig_fire_structures_ff(out):
    """Old 20: the confounder drives the firefighters."""
    return _fire("structures_burned", "firefighters", "Structures burned",
                 "Number of firefighters",
                 "Structures burned vs firefighters", BLUE,
                 "fire-structures-firefighters", out)


def fig_fire_structures_damage(out):
    """Old 21: ...and the damage."""
    return _fire("structures_burned", "property_damage", "Structures burned",
                 "Property damage ($ millions)",
                 "Structures burned vs property damage", PURPLE,
                 "fire-structures-damage", out, scale_y=1e6)


def fig_marathon(out, logx: bool):
    """Old 23/24: the curve, and the transform that straightens it."""
    rows = read_csv("marathon_opinion.csv")
    m = [float(r["meters_run"]) for r in rows]
    o = [float(r["opinion"]) for r in rows]
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    if logx:
        lm = [math.log10(v) for v in m]
        ax.scatter(m, o, s=42, color=RED, alpha=0.42, edgecolors="none")
        ax.set_xscale("log")
        slope, intercept = ols(lm, o)
        gx = np.logspace(math.log10(min(m)), math.log10(max(m)), 100)
        ax.plot(gx, intercept + slope * np.log10(gx), color=RED, lw=2.6)
        ax.set_xticks([100, 500, 1000, 5000, 10000, 42195])
        ax.set_xticklabels(["100 m", "500 m", "1 km", "5 km", "10 km", "42 km"])
        ax.set_xlabel("Metres run during the marathon (log scale)")
        r = pearson(lm, o)
        title = "Opinion vs metres run — on a log scale"
        name = "marathon-log"
    else:
        ax.scatter(m, o, s=42, color=RED, alpha=0.42, edgecolors="none")
        slope, intercept = ols(m, o)
        gx = np.array([min(m), max(m)])
        ax.plot(gx, intercept + slope * gx, color=RED, lw=2.6)
        ax.set_xlabel("Metres run during the marathon")
        r = pearson(m, o)
        title = "Opinion vs metres run — linear scale"
        name = "marathon-linear"
    ax.set_ylabel("Opinion of running (0–9)")
    ax.set_ylim(0, 9)
    style_axes(ax)
    ax.set_title(title, fontsize=23, color=INK, pad=14)
    annotate_r(ax, r, loc="lower right", color=RED)
    fig.tight_layout()
    return save(fig, out, name)


def fig_marathon_linear(out):
    return fig_marathon(out, logx=False)


def fig_marathon_log(out):
    return fig_marathon(out, logx=True)


def fig_marathon_pair(out):
    """Old 46: the two scales side by side — 'should you use ρ?'"""
    rows = read_csv("marathon_opinion.csv")
    m = [float(r["meters_run"]) for r in rows]
    o = [float(r["opinion"]) for r in rows]
    lm = [math.log10(v) for v in m]
    fig, axes = plt.subplots(1, 2, figsize=(16, 6.6), dpi=DPI)
    fig.patch.set_facecolor("white")
    for ax, (xs, use_log, lab, r) in zip(axes, [
        (m, False, "Metres run (linear)", pearson(m, o)),
        (m, True, "Metres run (log scale)", pearson(lm, o)),
    ]):
        ax.scatter(xs, o, s=30, color=RED, alpha=0.40, edgecolors="none")
        if use_log:
            ax.set_xscale("log")
            slope, intercept = ols(lm, o)
            gx = np.logspace(math.log10(min(m)), math.log10(max(m)), 100)
            ax.plot(gx, intercept + slope * np.log10(gx), color=RED, lw=2.4)
            ax.set_xticks([100, 1000, 10000, 42195])
            ax.set_xticklabels(["100 m", "1 km", "10 km", "42 km"])
        else:
            slope, intercept = ols(m, o)
            gx = np.array([min(m), max(m)])
            ax.plot(gx, intercept + slope * gx, color=RED, lw=2.4)
        ax.set_xlabel(lab)
        ax.set_ylabel("Opinion (0–9)")
        ax.set_ylim(0, 9)
        style_axes(ax)
        ax.set_title(f"r = {r:+.3f}", fontsize=20, color=RED, pad=10)
    fig.suptitle("A straight line only describes one of these",
                 fontsize=23, color=INK, y=1.01)
    fig.tight_layout()
    return save(fig, out, "marathon-pair")


def fig_beer(out):
    """Old 26: real data, a weak relationship."""
    rows = GEN.beer_rows()
    x = [float(r[1]) for r in rows]
    y = [float(r[2]) for r in rows]
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.scatter(x, y, s=55, color=SOFT, alpha=0.55, edgecolors="none")
    slope, intercept = ols(x, y)
    gx = np.array([min(x), max(x)])
    ax.plot(gx, intercept + slope * gx, color=SOFT, lw=2.6)
    ax.set_xlabel("Average price (EUR)")
    ax.set_ylabel("Overall sensory score (standardised)")
    style_axes(ax)
    ax.set_title("Belgian beer: price vs expert evaluation", fontsize=23,
                 color=INK, pad=14)
    annotate_r(ax, pearson(x, y), extra=f"n = {len(rows)}", color=INK)
    fig.tight_layout()
    return save(fig, out, "beer-scatter")


def fig_beer_influential(out):
    """Old 27: the 25 highest |DFBETA| points, flagged.

    These are exactly the rows `belgian_beer.is_influential = 1` carries, so
    the picture and the student's `WHERE is_influential = 0` agree by
    construction.
    """
    rows = GEN.beer_rows()
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    keep = [(float(r[1]), float(r[2])) for r in rows if r[3] == 0]
    flag = [(float(r[1]), float(r[2])) for r in rows if r[3] == 1]
    ax.scatter([p[0] for p in keep], [p[1] for p in keep], s=55, color=SOFT,
               alpha=0.45, edgecolors="none", label="the other 203")
    ax.scatter([p[0] for p in flag], [p[1] for p in flag], s=110, color=RED,
               alpha=0.9, edgecolors="none", label="25 highest |DFBETA|")
    x = [float(r[1]) for r in rows]
    y = [float(r[2]) for r in rows]
    slope, intercept = ols(x, y)
    gx = np.array([min(x), max(x)])
    ax.plot(gx, intercept + slope * gx, color=SOFT, lw=2.6)
    kx = [p[0] for p in keep]
    ky = [p[1] for p in keep]
    s2, i2 = ols(kx, ky)
    ax.plot(gx, i2 + s2 * gx, color=GREEN, lw=2.6, ls="--")
    ax.set_xlabel("Average price (EUR)")
    ax.set_ylabel("Overall sensory score (standardised)")
    style_axes(ax)
    ax.set_title("The 25 points that hold the slope up", fontsize=23,
                 color=INK, pad=14)
    ax.text(0.03, 0.97,
            f"all 228:  r = {pearson(x, y):+.3f}\nwithout the 25:  r = {pearson(kx, ky):+.3f}",
            transform=ax.transAxes, fontsize=20, color=INK, ha="left", va="top",
            fontweight="bold")
    ax.legend(fontsize=14, loc="lower right", frameon=False)
    fig.tight_layout()
    return save(fig, out, "beer-influential")


def fig_hotel_pair(out):
    """Old 31: one relationship that is really two."""
    rows = read_csv("hotel_fun.csv")
    fig, axes = plt.subplots(1, 2, figsize=(16, 6.8), dpi=DPI)
    fig.patch.set_facecolor("white")
    for ax, (label, keep, colour) in zip(axes, [
        ("Low humidity (< 60%)", lambda h: h < 60, BLUE),
        ("High humidity (≥ 60%)", lambda h: h >= 60, RED),
    ]):
        grp = [r for r in rows if keep(float(r["humidity"]))]
        x = [float(r["hotel_cost"]) for r in grp]
        y = [float(r["fun_reported"]) for r in grp]
        ax.scatter(x, y, s=46, color=colour, alpha=0.5, edgecolors="none")
        slope, intercept = ols(x, y)
        gx = np.array([50, 500])
        ax.plot(gx, intercept + slope * gx, color=colour, lw=2.4)
        ax.set_xlim(50, 500)
        ax.set_ylim(1, 10)
        ax.set_xlabel("Hotel cost (USD/night)")
        ax.set_ylabel("Fun reported (1–10)")
        style_axes(ax)
        ax.set_title(label, fontsize=20, color=INK, pad=10)
        sd = GEN.stddev_samp(y)
        ax.text(0.97, 0.05,
                f"r = {pearson(x, y):+.3f}\nn = {len(grp)}\nSD of fun = {sd:.2f}",
                transform=ax.transAxes, fontsize=17, color=colour, ha="right",
                va="bottom", fontweight="bold")
    fig.suptitle("Same slope, different spread — noise weakens the correlation",
                 fontsize=23, color=INK, y=1.01)
    fig.tight_layout()
    return save(fig, out, "hotel-pair")


def fig_chocolate(out):
    """Old 78: the closing joke, with a real r."""
    fig = new_fig((16, 8.4))
    ax = fig.add_subplot(111)
    ch = [c[1] for c in GEN.CHOCOLATE_NOBEL]
    nb = [c[2] for c in GEN.CHOCOLATE_NOBEL]
    ax.scatter(ch, nb, s=130, color=PURPLE, alpha=0.75, edgecolors="none")
    for name, x, y in GEN.CHOCOLATE_NOBEL:
        ax.annotate(name, (x, y), fontsize=11, color=SOFT,
                    xytext=(6, 4), textcoords="offset points")
    slope, intercept = ols(ch, nb)
    gx = np.array([0, 13])
    ax.plot(gx, intercept + slope * gx, color=PURPLE, lw=2.4, ls="--")
    ax.set_xlabel("Chocolate consumption (kg per person per year)")
    ax.set_ylabel("Nobel laureates per 10 million people")
    ax.set_xlim(0, 13.5)
    ax.set_ylim(-2, 35)
    style_axes(ax)
    ax.set_title("Nobel laureates vs chocolate consumption", fontsize=23,
                 color=INK, pad=14)
    annotate_r(ax, pearson(ch, nb), color=PURPLE)
    fig.tight_layout()
    return save(fig, out, "chocolate-nobel")


# ===========================================================================
# 3. Assumptions
# ===========================================================================


def fig_scale_types(out):
    """Old 44: interval vs ratio, as one picture instead of a bare quiz plot."""
    fig, axes = plt.subplots(1, 2, figsize=(16, 5.6), dpi=DPI)
    fig.patch.set_facecolor("white")

    ax = axes[0]
    ticks = [-10, 0, 10, 20, 30, 40]
    ax.hlines(0, -12, 42, color=SOFT, lw=2)
    ax.vlines(ticks, -0.25, 0.25, color=SOFT, lw=2)
    for t in ticks:
        ax.text(t, -0.65, f"{t}°C", ha="center", fontsize=15, color=INK)
    ax.annotate("", xy=(20, 0.8), xytext=(10, 0.8),
                arrowprops=dict(arrowstyle="<->", color=BLUE, lw=2))
    ax.text(15, 1.05, "10 degrees", ha="center", fontsize=14, color=BLUE)
    ax.annotate("", xy=(40, 0.8), xytext=(30, 0.8),
                arrowprops=dict(arrowstyle="<->", color=BLUE, lw=2))
    ax.text(35, 1.05, "same 10 degrees", ha="center", fontsize=14, color=BLUE)
    ax.text(0, -1.5, "0 °C is not 'no temperature'", ha="center", fontsize=15,
            color=RED)
    ax.set_title("Interval scale — equal steps, no true zero", fontsize=19,
                 color=INK, pad=12)
    ax.set_xlim(-14, 44)
    ax.set_ylim(-2.1, 1.6)
    ax.axis("off")

    ax = axes[1]
    ticks = [0, 10, 20, 30, 40]
    ax.hlines(0, -2, 42, color=SOFT, lw=2)
    ax.vlines(ticks, -0.25, 0.25, color=SOFT, lw=2)
    for t in ticks:
        ax.text(t, -0.65, f"{t} kg", ha="center", fontsize=15, color=INK)
    ax.annotate("", xy=(20, 0.8), xytext=(0, 0.8),
                arrowprops=dict(arrowstyle="<->", color=GREEN, lw=2))
    ax.text(10, 1.05, "20 kg is twice 10 kg", ha="center", fontsize=14,
            color=GREEN)
    ax.text(0, -1.5, "0 kg really is 'none'", ha="center", fontsize=15,
            color=GREEN)
    ax.set_title("Ratio scale — equal steps and a true zero", fontsize=19,
                 color=INK, pad=12)
    ax.set_xlim(-4, 44)
    ax.set_ylim(-2.1, 1.6)
    ax.axis("off")

    fig.suptitle("Correlation needs both variables on an interval or ratio scale",
                 fontsize=22, color=INK, y=1.02)
    fig.tight_layout()
    return save(fig, out, "scale-types")


def fig_bivariate_normal(out):
    """Old 45: the population behind r is a bell hill.

    The old slide was a hand-rolled 3D canvas with drag-to-rotate. One
    rendered view carries the idea; the interaction did not teach anything the
    picture does not.
    """
    from mpl_toolkits.mplot3d import Axes3D  # noqa: F401

    rho = 0.85
    g = np.linspace(-3, 3, 90)
    X, Y = np.meshgrid(g, g)
    Z = (1 / (2 * math.pi * math.sqrt(1 - rho ** 2))) * np.exp(
        -(X ** 2 - 2 * rho * X * Y + Y ** 2) / (2 * (1 - rho ** 2))
    )
    fig = plt.figure(figsize=(16, 8.6), dpi=DPI)
    fig.patch.set_facecolor("white")
    ax = fig.add_subplot(111, projection="3d")
    ax.plot_surface(X, Y, Z, cmap="YlGnBu", linewidth=0, antialiased=True,
                    alpha=0.95, rstride=2, cstride=2)
    ax.contour(X, Y, Z, zdir="z", offset=0, levels=8, cmap="YlGnBu",
               linewidths=1.0)
    ax.set_xlabel("X", fontsize=16, color=INK, labelpad=10)
    ax.set_ylabel("Y", fontsize=16, color=INK, labelpad=10)
    ax.set_zlabel("density", fontsize=14, color=SOFT, labelpad=8)
    ax.set_zlim(0, float(Z.max()) * 1.05)
    ax.view_init(elev=32, azim=-56)
    ax.tick_params(colors=SOFT, labelsize=11)
    ax.set_title(f"A bivariate normal population, ρ = {rho}", fontsize=23,
                 color=INK, pad=18)
    fig.tight_layout()
    return save(fig, out, "bivariate-normal")


def fig_heteroscedastic(out):
    """Old 47, improved: the old slide showed only the violation.

    Two panels, so students can see what the assumption LOOKS like when it
    holds -- the old slide asked them to imagine it.
    """
    rng = np.random.default_rng(42)
    n = 220
    x = rng.uniform(1, 10, n)
    fig, axes = plt.subplots(1, 2, figsize=(16, 6.4), dpi=DPI)
    fig.patch.set_facecolor("white")

    for ax, (title, sd, ok) in zip(axes, [
        ("Homoscedastic — spread is the same everywhere", np.full(n, 1.2), True),
        ("Heteroscedastic — spread grows with X", 0.25 + 0.42 * x, False),
    ]):
        y = 2 + 0.8 * x + rng.normal(0, 1, n) * sd
        colour = GREEN if ok else RED
        ax.scatter(x, y, s=36, color=colour, alpha=0.45, edgecolors="none")
        gx = np.array([1, 10])
        ax.plot(gx, 2 + 0.8 * gx, color=INK, lw=2.2)
        band = 1.96 * (np.full(2, 1.2) if ok else 0.25 + 0.42 * gx)
        ax.plot(gx, 2 + 0.8 * gx + band, color=colour, lw=1.6, ls="--")
        ax.plot(gx, 2 + 0.8 * gx - band, color=colour, lw=1.6, ls="--")
        ax.set_xlabel("X")
        ax.set_ylabel("Y")
        style_axes(ax)
        ax.set_title(title, fontsize=18, color=INK, pad=10)
    fig.suptitle("The spread of Y should not depend on X", fontsize=23,
                 color=INK, y=1.01)
    fig.tight_layout()
    return save(fig, out, "heteroscedasticity")


# ===========================================================================
# 4. Regression
# ===========================================================================


def fig_two_groups(out):
    """Old 50, fixed: 'description' — two groups, two lines.

    The old slide drew its 'same intercept' dot at x = 10, where the two lines
    are 25 units apart. An intercept lives at x = 0, and that is where the dot
    goes here.
    """
    rng = np.random.default_rng(123)
    n = 60
    x = rng.uniform(0, 10, n)
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    for label, slope, colour in (("Group A", 2.5, BLUE), ("Group B", 5.0, RED)):
        y = 20 + slope * x + rng.normal(0, 6, n)
        ax.scatter(x, y, s=50, color=colour, alpha=0.5, edgecolors="none",
                   label=f"{label} (slope {slope})")
        gx = np.array([0, 10])
        ax.plot(gx, 20 + slope * gx, color=colour, lw=2.6)
    ax.scatter([0], [20], s=190, color=INK, zorder=5, marker="o")
    ax.annotate("both groups start\nat the same intercept (x = 0)",
                xy=(0, 20), xytext=(1.1, 44), fontsize=15, color=INK,
                arrowprops=dict(arrowstyle="->", color=INK, lw=1.6))
    ax.set_xlabel("X")
    ax.set_ylabel("Outcome")
    ax.set_xlim(-0.4, 10.3)
    style_axes(ax)
    ax.set_title("Description: how much do the groups differ?", fontsize=23,
                 color=INK, pad=14)
    ax.legend(fontsize=15, loc="upper left", frameon=False)
    fig.tight_layout()
    return save(fig, out, "two-groups")


def fig_prediction(out):
    """Old 51, fixed: a real 95% prediction interval, not a sin() wobble."""
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    n = len(xs)
    mx = sum(xs) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    resid = [y - (intercept + slope * x) for x, y in zip(xs, ys)]
    s = math.sqrt(sum(r * r for r in resid) / (n - 2))
    x0 = 140.0
    se_pred = s * math.sqrt(1 + 1 / n + (x0 - mx) ** 2 / sxx)
    yhat = intercept + slope * x0
    half = 1.9773 * se_pred  # t(0.975, 48)

    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.scatter(xs, ys, s=60, color=BLUE, alpha=0.45, edgecolors="none")
    gx = np.linspace(min(xs), max(xs), 100)
    ax.plot(gx, intercept + slope * gx, color=INK, lw=2.4)
    ax.errorbar([x0], [yhat], yerr=[[half], [half]], fmt="o", color=RED,
                markersize=13, capsize=10, capthick=2.4, elinewidth=2.4,
                zorder=6)
    ax.annotate(f"a {x0:.0f} m² flat:\npredicted {yhat:.0f}k\n95% interval "
                f"{yhat - half:.0f}k – {yhat + half:.0f}k",
                xy=(x0, yhat), xytext=(x0 - 78, yhat + 95), fontsize=16,
                color=RED, arrowprops=dict(arrowstyle="->", color=RED, lw=1.8))
    ax.set_xlabel("Floor area (m²)")
    ax.set_ylabel("Price (thousands)")
    style_axes(ax)
    ax.set_title("Prediction: the line gives a value, and a range",
                 fontsize=23, color=INK, pad=14)
    fig.tight_layout()
    return save(fig, out, "prediction-interval")


def fig_simple_regression(out):
    """Old 57: one predictor, one line. The deck's core picture."""
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.scatter(xs, ys, s=70, color=BLUE, alpha=0.5, edgecolors="none")
    gx = np.array([0, 180])
    ax.plot(gx, intercept + slope * gx, color=RED, lw=2.8)
    ax.set_xlabel("Floor area (m²)")
    ax.set_ylabel("Price (thousands)")
    ax.set_xlim(0, 180)
    ax.set_ylim(0, 650)
    style_axes(ax)
    ax.set_title("Simple regression: one explanatory variable", fontsize=23,
                 color=INK, pad=14)
    annotate_r(ax, pearson(xs, ys),
               extra=f"price = {intercept:.2f} + {slope:.3f} × m²", color=RED)
    fig.tight_layout()
    return save(fig, out, "simple-regression")


def fig_anatomy(out):
    """Old 60: beta0 and beta1 as intercept and rise/run."""
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.scatter(xs, ys, s=55, color=BLUE, alpha=0.35, edgecolors="none")
    gx = np.array([0, 180])
    ax.plot(gx, intercept + slope * gx, color=RED, lw=2.8)

    ax.scatter([0], [intercept], s=190, color=INK, zorder=6)
    ax.annotate(f"β₀ = {intercept:.2f}\n(the price at 0 m²)", xy=(0, intercept),
                xytext=(12, 195), fontsize=17, color=INK,
                arrowprops=dict(arrowstyle="->", color=INK, lw=1.8))

    x1, x2 = 95.0, 125.0
    y1, y2 = intercept + slope * x1, intercept + slope * x2
    ax.plot([x1, x2], [y1, y1], color=GREEN, lw=2.4)
    ax.plot([x2, x2], [y1, y2], color=GREEN, lw=2.4)
    ax.text((x1 + x2) / 2, y1 - 34, f"run = {x2 - x1:.0f} m²", fontsize=15,
            color=GREEN, ha="center")
    ax.text(x2 + 5, (y1 + y2) / 2, f"rise = {y2 - y1:.0f}k", fontsize=15,
            color=GREEN, va="center")
    # Below the run marker, in the empty lower-right quadrant: above the line
    # the label lands on the data cloud.
    ax.text(x2 + 8, y1 - 150,
            f"β₁ = rise / run = {slope:.3f}\n(each extra m² adds {slope:.2f}k)",
            fontsize=17, color=GREEN, va="top")

    ax.set_xlabel("Floor area (m²)")
    ax.set_ylabel("Price (thousands)")
    ax.set_xlim(0, 180)
    ax.set_ylim(0, 650)
    style_axes(ax)
    ax.set_title("The two numbers a line is made of", fontsize=23, color=INK,
                 pad=14)
    fig.tight_layout()
    return save(fig, out, "beta-anatomy")


def fig_residuals(out):
    """Old 61: fitted values and residuals as vertical gaps."""
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    for x, y in zip(xs, ys):
        yh = intercept + slope * x
        ax.plot([x, x], [y, yh], color=AMBER, lw=1.5, alpha=0.85, zorder=2)
    ax.scatter(xs, ys, s=62, color=BLUE, alpha=0.75, edgecolors="none", zorder=3,
               label="observed  yᵢ")
    yh_all = [intercept + slope * x for x in xs]
    ax.scatter(xs, yh_all, s=32, color=RED, zorder=4, marker="D",
               label="fitted  ŷᵢ")
    gx = np.array([min(xs), max(xs)])
    ax.plot(gx, intercept + slope * gx, color=RED, lw=2.6, zorder=3)
    ax.set_xlabel("Floor area (m²)")
    ax.set_ylabel("Price (thousands)")
    style_axes(ax)
    ax.set_title("Each orange gap is one residual, εᵢ = yᵢ − ŷᵢ", fontsize=23,
                 color=INK, pad=14)
    ax.legend(fontsize=15, loc="upper left", frameon=False)
    fig.tight_layout()
    return save(fig, out, "residuals")


def fig_wrong_lines(out):
    """Old 62: residuals grow as the line moves away from least squares.

    The old slide wobbled a line on an endless rAF loop. Three fixed panels
    make the same point and can be pointed at.
    """
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    n = len(xs)
    variants = [
        ("Too shallow", slope * 0.55, intercept + 110),
        ("Least squares", slope, intercept),
        ("Too steep", slope * 1.45, intercept - 120),
    ]
    fig, axes = plt.subplots(1, 3, figsize=(16, 6.2), dpi=DPI)
    fig.patch.set_facecolor("white")
    for ax, (label, sl, ic) in zip(axes, variants):
        ssr = sum((y - (ic + sl * x)) ** 2 for x, y in zip(xs, ys))
        for x, y in zip(xs, ys):
            ax.plot([x, x], [y, ic + sl * x], color=AMBER, lw=1.0, alpha=0.8)
        ax.scatter(xs, ys, s=30, color=BLUE, alpha=0.6, edgecolors="none")
        gx = np.array([min(xs), max(xs)])
        colour = GREEN if label == "Least squares" else RED
        ax.plot(gx, ic + sl * gx, color=colour, lw=2.6)
        ax.set_title(f"{label}\nSSR = {ssr:,.0f}", fontsize=18, color=colour,
                     pad=10)
        style_axes(ax)
        ax.set_xlabel("m²")
        ax.set_ylabel("price (k)")
    fig.suptitle("Move the line and every residual changes — least squares is the bottom",
                 fontsize=22, color=INK, y=1.02)
    fig.tight_layout()
    return save(fig, out, "wrong-lines")


def fig_ssr_squares(out):
    """Old 63: SSR as literal squares."""
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    ssr = sum((y - (intercept + slope * x)) ** 2 for x, y in zip(xs, ys))
    fig = new_fig((16, 8.4))
    ax = fig.add_subplot(111)
    # Squares are drawn in DATA units on x scaled to match y visually, so a
    # "square" reads as a square on screen.
    ax.set_xlim(0, 180)
    ax.set_ylim(0, 650)
    x_span, y_span = 180.0, 650.0
    for x, y in zip(xs, ys):
        yh = intercept + slope * x
        e = y - yh
        side_y = abs(e)
        side_x = side_y * (x_span / y_span) * (16 / 8.4) * 0.52
        x0 = x if e > 0 else x - side_x
        ax.add_patch(plt.Rectangle((x0, min(y, yh)), side_x, side_y,
                                   facecolor=AMBER, alpha=0.30,
                                   edgecolor=AMBER, linewidth=0.8))
    ax.scatter(xs, ys, s=42, color=BLUE, alpha=0.8, edgecolors="none", zorder=4)
    gx = np.array([0, 180])
    ax.plot(gx, intercept + slope * gx, color=RED, lw=2.6, zorder=3)
    ax.set_xlabel("Floor area (m²)")
    ax.set_ylabel("Price (thousands)")
    style_axes(ax)
    ax.set_title(f"SSR is the total area of these squares — {ssr:,.0f}",
                 fontsize=23, color=INK, pad=14)
    fig.tight_layout()
    return save(fig, out, "ssr-squares")


def fig_ssr_curve(out):
    """Old 64, fixed: the old 'gradient descent' was a lerp to the answer.

    Here SSR is plotted honestly as a function of the slope, with the
    least-squares slope marked at the bottom of the parabola. Nothing is
    animated and nothing is faked.
    """
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    slopes = np.linspace(slope - 1.6, slope + 1.6, 220)
    # For each candidate slope, use the best intercept for that slope, so the
    # curve is the true profile of SSR in the slope.
    ssrs = []
    for sl in slopes:
        ic = my - sl * mx
        ssrs.append(sum((y - (ic + sl * x)) ** 2 for x, y in zip(xs, ys)))
    best = sum((y - (intercept + slope * x)) ** 2 for x, y in zip(xs, ys))

    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.plot(slopes, ssrs, color=BLUE, lw=3)
    ax.scatter([slope], [best], s=210, color=RED, zorder=5)
    ax.annotate(f"least squares\nβ₁ = {slope:.3f}, SSR = {best:,.0f}",
                xy=(slope, best), xytext=(slope + 0.32, best + 95000),
                fontsize=17, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED, lw=1.8))
    ax.set_xlabel("Candidate slope β₁")
    ax.set_ylabel("Sum of squared residuals")
    style_axes(ax)
    ax.set_title("SSR as the slope moves — one lowest point", fontsize=23,
                 color=INK, pad=14)
    fig.tight_layout()
    return save(fig, out, "ssr-curve")


def fig_r2_ssr_tss(out):
    """Old 65: TSS vs SSR — what the line removed."""
    xs, ys, _ = housing_xy()
    slope, intercept = ols(xs, ys)
    my = sum(ys) / len(ys)
    ssr = sum((y - (intercept + slope * x)) ** 2 for x, y in zip(xs, ys))
    tss = sum((y - my) ** 2 for y in ys)

    fig, axes = plt.subplots(1, 2, figsize=(16, 6.8), dpi=DPI)
    fig.patch.set_facecolor("white")

    ax = axes[0]
    for x, y in zip(xs, ys):
        ax.plot([x, x], [y, my], color=SOFT, lw=1.2, alpha=0.85)
    ax.scatter(xs, ys, s=42, color=BLUE, alpha=0.7, edgecolors="none")
    ax.axhline(my, color=INK, lw=2.4)
    ax.text(min(xs), my + 14, f"ȳ = {my:.0f}", fontsize=15, color=INK)
    ax.set_title(f"Without the line: TSS = {tss:,.0f}", fontsize=19, color=INK,
                 pad=10)
    style_axes(ax)
    ax.set_xlabel("m²")
    ax.set_ylabel("price (k)")

    ax = axes[1]
    for x, y in zip(xs, ys):
        ax.plot([x, x], [y, intercept + slope * x], color=AMBER, lw=1.2,
                alpha=0.9)
    ax.scatter(xs, ys, s=42, color=BLUE, alpha=0.7, edgecolors="none")
    gx = np.array([min(xs), max(xs)])
    ax.plot(gx, intercept + slope * gx, color=RED, lw=2.4)
    ax.set_title(f"With the line: SSR = {ssr:,.0f}", fontsize=19, color=INK,
                 pad=10)
    style_axes(ax)
    ax.set_xlabel("m²")
    ax.set_ylabel("price (k)")

    fig.suptitle(f"R² = 1 − SSR/TSS = {1 - ssr / tss:.3f}  —  the line removed "
                 f"{(1 - ssr / tss) * 100:.1f}% of the variation",
                 fontsize=22, color=INK, y=1.02)
    fig.tight_layout()
    return save(fig, out, "r2-ssr-tss")


def fig_multiple_regression(out):
    """Old 58: two predictors make a plane. Two fixed views."""
    from mpl_toolkits.mplot3d import Axes3D  # noqa: F401

    rng = np.random.default_rng(77)
    n = 60
    sqm = rng.uniform(40, 160, n)
    rooms = rng.integers(1, 6, n).astype(float)
    price = 60 + 2.4 * sqm + 18 * rooms + rng.normal(0, 30, n)

    fig = plt.figure(figsize=(16, 7.2), dpi=DPI)
    fig.patch.set_facecolor("white")
    for i, (elev, azim) in enumerate([(22, -60), (14, -16)], start=1):
        ax = fig.add_subplot(1, 2, i, projection="3d")
        gx, gy = np.meshgrid(np.linspace(40, 160, 12), np.linspace(1, 5, 12))
        gz = 60 + 2.4 * gx + 18 * gy
        ax.plot_surface(gx, gy, gz, alpha=0.30, color=BLUE, linewidth=0.4,
                        edgecolor=BLUE)
        ax.scatter(sqm, rooms, price, s=34, color=RED, alpha=0.85,
                   edgecolors="none")
        ax.set_xlabel("floor area (m²)", fontsize=12, color=INK, labelpad=6)
        ax.set_ylabel("rooms", fontsize=12, color=INK, labelpad=6)
        ax.set_zlabel("price (k)", fontsize=12, color=INK, labelpad=6)
        ax.view_init(elev=elev, azim=azim)
        ax.tick_params(colors=SOFT, labelsize=9)
    fig.suptitle("Two predictors: the line becomes a plane", fontsize=23,
                 color=INK, y=1.0)
    fig.tight_layout()
    return save(fig, out, "multiple-regression-plane")


def fig_r2_inflation(out):
    """Old 66 (STONKS), made honest.

    The old slide typed its R^2 values in; nothing was fitted. Here junk
    predictors -- pure seeded noise, uncorrelated with y by construction --
    are actually added to a regression one at a time, and both R^2 and
    adjusted R^2 are measured. R^2 never falls; adjusted R^2 does. That IS
    the joke, and now it is true.
    """
    rng = np.random.default_rng(2024)
    n = 40
    x = rng.normal(0, 1, n)
    y = 1.4 * x + rng.normal(0, 2.4, n)
    junk = rng.normal(0, 1, (n, 18))

    r2s, adj = [], []
    for p in range(1, 19):
        X = np.column_stack([np.ones(n), x, junk[:, : p - 1]]) if p > 1 else \
            np.column_stack([np.ones(n), x])
        beta, *_ = np.linalg.lstsq(X, y, rcond=None)
        resid = y - X @ beta
        ss_res = float(resid @ resid)
        ss_tot = float(((y - y.mean()) ** 2).sum())
        r2 = 1 - ss_res / ss_tot
        k = X.shape[1] - 1
        r2s.append(r2)
        adj.append(1 - (1 - r2) * (n - 1) / (n - k - 1))

    ks = list(range(1, 19))
    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.plot(ks, r2s, marker="o", lw=3, color=RED, markersize=9, label="R²")
    ax.plot(ks, adj, marker="s", lw=3, color=GREEN, markersize=8,
            label="Adjusted R²")
    ax.set_xlabel("Number of predictors (1 real, the rest pure noise)")
    ax.set_ylabel("Fit")
    ax.set_xticks(ks)
    style_axes(ax)
    ax.set_title("Add junk predictors: R² only ever goes up", fontsize=23,
                 color=INK, pad=14)
    ax.legend(fontsize=17, loc="upper left", frameon=False)
    # Headroom for the caption, so it never sits on the curves.
    lo = min(min(adj), min(r2s))
    hi = max(max(r2s), max(adj))
    ax.set_ylim(lo - (hi - lo) * 0.34, hi + (hi - lo) * 0.12)
    ax.text(0.5, 0.02,
            f"n = {n}.  Predictors 2–18 are random noise, fitted for real — "
            f"R² climbs from {r2s[0]:.2f} to {r2s[-1]:.2f} "
            f"while adjusted R² ends at {adj[-1]:.2f}.",
            transform=ax.transAxes, fontsize=14, color=SOFT, ha="center",
            va="bottom")
    fig.tight_layout()
    return save(fig, out, "r2-inflation")


def fig_bands(out):
    """Old 70-72: confidence vs prediction bands, on housing."""
    xs, ys, is_train = housing_xy()
    tr = [(x, y) for x, y, t in zip(xs, ys, is_train) if t == 1]
    te = [(x, y) for x, y, t in zip(xs, ys, is_train) if t == 0]
    trx = [p[0] for p in tr]
    try_ = [p[1] for p in tr]
    slope, intercept = ols(trx, try_)
    n = len(trx)
    mx = sum(trx) / n
    sxx = sum((x - mx) ** 2 for x in trx)
    resid = [y - (intercept + slope * x) for x, y in zip(trx, try_)]
    s = math.sqrt(sum(r * r for r in resid) / (n - 2))
    tq = 2.0687  # t(0.975, 23)

    gx = np.linspace(min(xs), max(xs), 120)
    fit = intercept + slope * gx
    se_mean = s * np.sqrt(1 / n + (gx - mx) ** 2 / sxx)
    se_pred = s * np.sqrt(1 + 1 / n + (gx - mx) ** 2 / sxx)

    fig = new_fig((16, 8.2))
    ax = fig.add_subplot(111)
    ax.fill_between(gx, fit - tq * se_pred, fit + tq * se_pred, color=BLUE,
                    alpha=0.13, label="95% prediction band (a new house)")
    ax.fill_between(gx, fit - tq * se_mean, fit + tq * se_mean, color=RED,
                    alpha=0.22, label="95% confidence band (the line itself)")
    ax.plot(gx, fit, color=INK, lw=2.6, label="fitted on the training half")
    ax.scatter(trx, try_, s=62, color=INK, alpha=0.55, edgecolors="none",
               label=f"training (n={len(tr)})")
    ax.scatter([p[0] for p in te], [p[1] for p in te], s=62, color=GREEN,
               marker="^", alpha=0.85, edgecolors="none",
               label=f"held-out test (n={len(te)})")
    ax.set_xlabel("Floor area (m²)")
    ax.set_ylabel("Price (thousands)")
    style_axes(ax)
    ax.set_title("Confidence bands vs prediction bands", fontsize=23, color=INK,
                 pad=14)
    ax.legend(fontsize=13, loc="upper left", frameon=False)
    fig.tight_layout()
    return save(fig, out, "confidence-prediction-bands")


def fig_confusion_matrix(out):
    """Old 74's Devopedia figure, replaced with our own (plan Q6).

    Same teaching content -- the 2x2 and where TP/FP/FN/TN sit -- drawn here
    so the deck carries no third-party image.
    """
    fig = new_fig((16, 8.0))
    ax = fig.add_subplot(111)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")

    cells = [
        (2.6, 4.4, "True Positive\n(TP)", GREEN, "predicted yes · actually yes"),
        (6.0, 4.4, "False Positive\n(FP)", RED, "predicted yes · actually no"),
        (2.6, 1.6, "False Negative\n(FN)", RED, "predicted no · actually yes"),
        (6.0, 1.6, "True Negative\n(TN)", GREEN, "predicted no · actually no"),
    ]
    for x, y, label, colour, sub in cells:
        ax.add_patch(plt.Rectangle((x, y), 3.2, 2.5, facecolor=colour,
                                   alpha=0.16, edgecolor=colour, linewidth=2.4))
        ax.text(x + 1.6, y + 1.72, label, fontsize=22, color=colour,
                ha="center", va="center", fontweight="bold")
        ax.text(x + 1.6, y + 0.62, sub, fontsize=12.5, color=SOFT, ha="center",
                va="center")

    ax.text(4.2, 7.45, "Actually positive", fontsize=17, color=INK, ha="center")
    ax.text(7.6, 7.45, "Actually negative", fontsize=17, color=INK, ha="center")
    ax.text(2.35, 5.65, "Predicted\npositive", fontsize=17, color=INK,
            ha="right", va="center")
    ax.text(2.35, 2.85, "Predicted\nnegative", fontsize=17, color=INK,
            ha="right", va="center")
    ax.plot([2.5, 9.3], [7.1, 7.1], color=SOFT, lw=1.4)
    ax.plot([2.45, 2.45], [0.9, 7.0], color=SOFT, lw=1.4)
    ax.set_title("The confusion matrix", fontsize=25, color=INK, pad=6)
    fig.tight_layout()
    return save(fig, out, "confusion-matrix")


def fig_chihuahua(out):
    """Old 76: the chihuahua detector's counts, as a picture.

    The old slide animated a CSS dog. The numbers are the lesson: 100 images,
    10 chihuahuas, and a detector too eager to say 'chihuahua'.
    """
    tp, fn, fp, tn = 9, 1, 27, 63
    fig, axes = plt.subplots(1, 2, figsize=(16, 6.6), dpi=DPI,
                             gridspec_kw={"width_ratios": [1.25, 1]})
    fig.patch.set_facecolor("white")

    ax = axes[0]
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    # Without this the 10x10 grid is drawn into a wide axes and every "square"
    # comes out as a letterbox rectangle.
    ax.set_aspect("equal", adjustable="box")
    ax.axis("off")
    grid = [(tp, GREEN, "called chihuahua, was one"),
            (fp, RED, "called chihuahua, was a muffin"),
            (fn, AMBER, "missed a chihuahua"),
            (tn, SOFT, "called muffin, was one")]
    i = 0
    for count, colour, _ in grid:
        for _ in range(count):
            cx, cy = i % 10, 9 - i // 10
            ax.add_patch(plt.Rectangle((cx + 0.08, cy + 0.08), 0.84, 0.84,
                                       facecolor=colour, alpha=0.75,
                                       edgecolor="white", linewidth=1.2))
            i += 1
    ax.set_title("100 images", fontsize=20, color=INK, pad=10)
    handles = [plt.Rectangle((0, 0), 1, 1, facecolor=c, alpha=0.75)
               for _, c, _ in grid]
    ax.legend(handles, [f"{n} — {lab}" for n, _, lab in grid],
              fontsize=12.5, loc="lower center", bbox_to_anchor=(0.5, -0.24),
              frameon=False, ncol=1)

    ax = axes[1]
    ax.axis("off")
    metrics = [
        ("Accuracy", f"({tp}+{tn})/100", f"{(tp + tn)}%"),
        ("Precision", f"{tp}/({tp}+{fp})", f"{tp / (tp + fp) * 100:.0f}%"),
        ("Recall", f"{tp}/({tp}+{fn})", f"{tp / (tp + fn) * 100:.0f}%"),
        ("Specificity", f"{tn}/({tn}+{fp})", f"{tn / (tn + fp) * 100:.0f}%"),
    ]
    for j, (name, formula, value) in enumerate(metrics):
        y = 0.86 - j * 0.2
        ax.text(0.02, y, name, fontsize=20, color=INK, fontweight="bold",
                transform=ax.transAxes)
        ax.text(0.44, y, formula, fontsize=17, color=SOFT,
                transform=ax.transAxes)
        ax.text(0.95, y, value, fontsize=22, color=BLUE, ha="right",
                fontweight="bold", transform=ax.transAxes)
    ax.text(0.02, 0.03,
            "High recall, low precision: the detector says\n"
            "“chihuahua” at almost everything.",
            fontsize=14.5, color=RED, transform=ax.transAxes)
    fig.suptitle("A detector that finds 90% of chihuahuas — and cries wolf 27 times",
                 fontsize=21, color=INK, y=1.01)
    fig.tight_layout()
    return save(fig, out, "chihuahua-detector")


def fig_types_of_relationships(out):
    """Old 17: positive, negative, none — the three shapes, named."""
    rng = np.random.default_rng(31337)
    n = 90
    x = rng.uniform(0, 10, n)
    panels = [
        ("Positive (direct)", 0.9, BLUE),
        ("Negative (inverse)", -0.9, RED),
        ("No (weak) relationship", 0.0, SOFT),
    ]
    fig, axes = plt.subplots(1, 3, figsize=(16, 5.8), dpi=DPI)
    fig.patch.set_facecolor("white")
    for ax, (label, slope, colour) in zip(axes, panels):
        y = 5 + slope * (x - 5) + rng.normal(0, 1.15, n)
        ax.scatter(x, y, s=46, color=colour, alpha=0.55, edgecolors="none")
        gx = np.array([0, 10])
        s, i = ols(list(x), list(y))
        ax.plot(gx, i + s * gx, color=colour, lw=2.4)
        ax.set_title(label, fontsize=19, color=INK, pad=10)
        ax.text(0.5, -0.18, f"r = {pearson(x, y):+.2f}", transform=ax.transAxes,
                fontsize=16, color=colour, ha="center", fontweight="bold")
        style_axes(ax)
        ax.set_xticklabels([])
        ax.set_yticklabels([])
    fig.tight_layout()
    return save(fig, out, "types-of-relationships")


FIGURES = {
    "same-r-three-clouds": fig_same_r,
    "rho-strip": fig_rho_strip,
    "r2-overlap": fig_r2_venn,
    "fun-scatter": fig_fun_scatter,
    "types-of-relationships": fig_types_of_relationships,
    "fire-firefighters-damage": fig_fire_ff_damage,
    "fire-structures-firefighters": fig_fire_structures_ff,
    "fire-structures-damage": fig_fire_structures_damage,
    "marathon-linear": fig_marathon_linear,
    "marathon-log": fig_marathon_log,
    "marathon-pair": fig_marathon_pair,
    "beer-scatter": fig_beer,
    "beer-influential": fig_beer_influential,
    "hotel-pair": fig_hotel_pair,
    "chocolate-nobel": fig_chocolate,
    "scale-types": fig_scale_types,
    "bivariate-normal": fig_bivariate_normal,
    "heteroscedasticity": fig_heteroscedastic,
    "two-groups": fig_two_groups,
    "prediction-interval": fig_prediction,
    "simple-regression": fig_simple_regression,
    "multiple-regression-plane": fig_multiple_regression,
    "beta-anatomy": fig_anatomy,
    "residuals": fig_residuals,
    "wrong-lines": fig_wrong_lines,
    "ssr-squares": fig_ssr_squares,
    "ssr-curve": fig_ssr_curve,
    "r2-ssr-tss": fig_r2_ssr_tss,
    "r2-inflation": fig_r2_inflation,
    "confidence-prediction-bands": fig_bands,
    "confusion-matrix": fig_confusion_matrix,
    "chihuahua-detector": fig_chihuahua,
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default=str(HERE.parent / "assets"))
    ap.add_argument("--only", action="append", default=None)
    args = ap.parse_args()

    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    names = args.only or list(FIGURES)
    unknown = [n for n in names if n not in FIGURES]
    if unknown:
        print(f"unknown figure(s): {', '.join(unknown)}", file=sys.stderr)
        print(f"known: {', '.join(FIGURES)}", file=sys.stderr)
        return 1

    print(f"drawing {len(names)} figure(s) into {out}")
    total = 0
    for name in names:
        path = FIGURES[name](out)
        total += path.stat().st_size
    print(f"done -- {total / 1024 / 1024:.2f} MiB total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
