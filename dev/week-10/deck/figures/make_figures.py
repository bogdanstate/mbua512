#!/usr/bin/env python3
"""Draw every static figure in the week-10 A/B testing deck.

    <venv>/bin/python make_figures.py          # -> ../assets/*.png

Style, palette and the 1600x900 canvas are the week-9 deck's
(`../../week-09/deck/figures/make_figures.py`), so the two decks look like
one course.

WHAT IS DRAWN, AND FROM WHAT
----------------------------
Two kinds of figure, and the distinction matters for what a slide may claim:

  * SIMULATIONS (coin runs, the law of large numbers, the binomial, the two
    samples, the null distribution, peeking, sample size). These illustrate
    chance itself, so there is no dataset behind them. Every one is SEEDED
    (`SEED = 20261010`) and the slide's caption says "simulated". Re-running
    this script reproduces them exactly.

  * DATA FIGURES (the two marketing conversion rates). These are drawn from
    the SAME numbers the SQL slides query, taken from the week-10 generators
    in `infra/mysql/`, never typed in. If the generator's numbers move, the
    figure moves with them and `check_deck_sql.py` catches the slide text.

DETERMINISM
-----------
No unseeded draw anywhere. `numpy.random.default_rng(SEED)` throughout; the
binomial figure is exact arithmetic, not sampled at all.
"""

from __future__ import annotations

import importlib.util
import math
import pathlib
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "assets"
MYSQL_DIR = pathlib.Path("/home/bogdan/infra/mysql")

SEED = 20261010

# --- course palette (week-9 deck, unchanged) -------------------------------
INK = "#1a1a1a"
SOFT = "#5d655f"
BLUE = "#1f5c8b"
RED = "#a8322d"
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


def save(fig, name: str):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.png"
    fig.savefig(path, dpi=DPI, facecolor="white", bbox_inches="tight",
                metadata={"Software": None, "Creation Time": None})
    plt.close(fig)
    size = path.stat().st_size
    print(f"  {name:32s} {size / 1024:7.1f} KiB")
    if size > 4 * 1024 * 1024:
        raise SystemExit(f"{name} exceeds the 4 MiB asset cap")
    return path


def load_generator(filename: str, modname: str):
    """Import a week-10 generator so figures use the SAME numbers as the SQL."""
    spec = importlib.util.spec_from_file_location(modname, MYSQL_DIR / filename)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[modname] = mod
    spec.loader.exec_module(mod)
    return mod


# --------------------------------------------------------------------------
# 1. Ten runs of 100 fair coin flips
# --------------------------------------------------------------------------
def fig_coin_runs():
    """The same fair coin, ten times, landing on ten different numbers.

    The lecture's first blow against "two numbers differ, therefore
    something happened". Identical by construction; still not identical.
    """
    rng = np.random.default_rng(SEED)
    runs = rng.binomial(100, 0.5, size=10)

    fig = new_fig()
    ax = fig.add_subplot(111)
    style_axes(ax)
    xs = np.arange(1, 11)
    # Lollipops, not bars. A bar chart of counts near 50 either starts at zero
    # (and the variation vanishes into ten near-identical columns) or starts
    # somewhere else (and exaggerates it by an arbitrary amount). A dot on a
    # stem carries no area, so a zoomed axis is honest.
    lo, hi = int(runs.argmin()), int(runs.argmax())
    for x, v in zip(xs, runs):
        ax.plot([x, x], [50, v], color=SOFT, linewidth=2.2, zorder=3)
    colours = [GREEN if i == hi else RED if i == lo else BLUE
               for i in range(10)]
    ax.scatter(xs, runs, s=520, color=colours, zorder=5)
    ax.axhline(50, color=INK, linewidth=2.0, linestyle="--", zorder=2)
    ax.text(0.55, 50.35, "expected 50", color=INK, fontsize=17,
            va="bottom", ha="left")
    # Label above a dot that sits above the line and below one that sits
    # below it, so no label lands on the dashed line or on its own stem.
    for x, v in zip(xs, runs):
        above = v >= 50
        ax.text(x, v + (1.35 if above else -1.35), str(int(v)),
                ha="center", va="bottom" if above else "top",
                fontsize=19, color=INK)
    ax.set_xlabel("run")
    ax.set_ylabel("heads in 100 flips")
    ax.set_xticks(xs)
    ax.set_ylim(38, 62)
    ax.set_xlim(0.4, 10.6)
    ax.set_title(
        f"the widest pair differs by {int(runs[hi] - runs[lo])} heads "
        "— and the coin never changed",
        fontsize=20, color=INK, pad=16, loc="left")
    return save(fig, "coin-runs")


# --------------------------------------------------------------------------
# 2. The law of large numbers
# --------------------------------------------------------------------------
def fig_lln():
    """The running share of heads over 5,000 flips.

    Drawn on a log x-axis because the interesting part is the first 200
    flips, which a linear axis crushes into the left margin.
    """
    rng = np.random.default_rng(SEED + 1)
    n = 5000
    flips = rng.integers(0, 2, size=n)
    share = np.cumsum(flips) / np.arange(1, n + 1)

    fig = new_fig()
    ax = fig.add_subplot(111)
    style_axes(ax)
    ax.plot(np.arange(1, n + 1), share, color=BLUE, linewidth=1.8, zorder=3)
    ax.axhline(0.5, color=RED, linewidth=2.0, linestyle="--", zorder=4)
    ax.text(n * 1.04, 0.5, "0.5", color=RED, fontsize=18, va="center")
    ax.set_xscale("log")
    ax.set_xlim(1, n)
    ax.set_ylim(0, 1)
    ax.set_xlabel("flips so far (log scale)")
    ax.set_ylabel("share of heads so far")
    ax.set_title(
        "wild for the first hundred flips; still visibly wandering at a thousand",
        fontsize=20, color=INK, pad=16, loc="left")
    return save(fig, "lln")


# --------------------------------------------------------------------------
# 3. The binomial: how surprising is 60 heads in 100?
# --------------------------------------------------------------------------
def _binom_pmf(n: int, p: float) -> np.ndarray:
    """Exact pmf. No sampling — this figure must not wobble between runs."""
    ks = np.arange(n + 1)
    logpmf = np.array([
        math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)
        + k * math.log(p) + (n - k) * math.log(1 - p)
        for k in ks
    ])
    return np.exp(logpmf)


def fig_binomial():
    """All possible results of 100 fair flips, with the 60+ tail shaded.

    The tail mass is what a p-value IS, computed before the word is used.
    """
    n, p = 100, 0.5
    pmf = _binom_pmf(n, p)
    ks = np.arange(n + 1)
    tail = float(pmf[60:].sum())

    fig = new_fig()
    ax = fig.add_subplot(111)
    style_axes(ax)
    colours = [RED if k >= 60 else BLUE for k in ks]
    ax.bar(ks, pmf, color=colours, width=0.88, zorder=3)
    ax.set_xlim(28, 72)
    ax.set_xlabel("heads in 100 flips")
    ax.set_ylabel("how often this exact result happens")
    ax.axvline(59.5, color=INK, linewidth=1.6, linestyle=":", zorder=4)
    ax.annotate(
        f"60 or more: {tail * 100:.1f} in 100",
        xy=(62, pmf[62]), xytext=(65.5, pmf.max() * 0.62),
        color=RED, fontsize=19,
        arrowprops=dict(arrowstyle="->", color=RED, linewidth=1.8))
    ax.annotate(
        f"50 exactly: {pmf[50] * 100:.1f} in 100",
        xy=(50, pmf[50]), xytext=(36.5, pmf.max() * 0.86),
        color=INK, fontsize=19,
        arrowprops=dict(arrowstyle="->", color=SOFT, linewidth=1.6))
    ax.set_title("a fair coin, and everything it can do",
                 fontsize=20, color=INK, pad=16, loc="left")
    print(f"      [binomial] P(>=60) = {tail:.6f}")
    return save(fig, "binomial")


# --------------------------------------------------------------------------
# 4. Two samples from the same population
# --------------------------------------------------------------------------
def fig_two_samples():
    """Two arms drawn from ONE population at 0.20. Their rates differ.

    Drawn as dot grids rather than bars, so the audience sees that the only
    thing separating the groups is which individuals landed where.

    The seed is CHOSEN (20261038) rather than the script's default, and this
    is the honest place to say so: the default draw gave 18.0 % against
    17.5 %, a gap too small to read from the back of a lecture theatre. The
    chosen pair, 16.0 % against 23.0 %, is nothing unusual — a 7-point gap
    between two samples of 200 at a true rate of 20 % is well inside what
    chance does routinely (the standard error of the difference here is
    4.0 points, so this is 1.75 SE, the sort of thing the null distribution
    figure shows happening constantly). Choosing a legible instance of a
    common event is a presentation decision; choosing a rare one and calling
    it typical would be a lie, and this is not that.
    """
    rng = np.random.default_rng(20261038)
    n = 200
    truth = 0.20
    a = rng.random(n) < truth
    b = rng.random(n) < truth

    fig = new_fig()
    cols = 20
    for idx, (sample, label, colour) in enumerate(
            ((a, "sample A", BLUE), (b, "sample B", PURPLE))):
        ax = fig.add_subplot(1, 2, idx + 1)
        ax.set_facecolor("white")
        for k in range(n):
            r, c = divmod(k, cols)
            hit = bool(sample[k])
            ax.scatter(c, -r, s=210,
                       color=colour if hit else "#e6e9e7",
                       edgecolors=SOFT if not hit else colour,
                       linewidths=0.8, zorder=3)
        rate = sample.mean()
        ax.set_xlim(-1, cols)
        ax.set_ylim(-(n // cols), 1.9)
        ax.axis("off")
        ax.set_title(
            f"{label}\n{sample.sum()} of {n} — {rate * 100:.1f} %",
            fontsize=25, color=INK, pad=8)
    fig.suptitle(
        "one population, true rate 20 % — two samples, two different answers",
        fontsize=22, color=INK, y=0.045)
    print(f"      [two-samples] A {a.sum()}/{n}, B {b.sum()}/{n}")
    return save(fig, "two-samples")


# --------------------------------------------------------------------------
# 5. The null distribution — 2,000 A/A tests
# --------------------------------------------------------------------------
def fig_null_dist():
    """2,000 experiments in which the two arms are identical by construction.

    This is where 1.96 comes from, shown rather than asserted: the shaded
    tails are the outer 5 % and they begin almost exactly at 1.96 SE.
    """
    rng = np.random.default_rng(SEED + 3)
    trials, n, truth = 2000, 5000, 0.20
    a = rng.binomial(n, truth, size=trials) / n
    b = rng.binomial(n, truth, size=trials) / n
    diff = (a - b) * 100  # percentage points

    se = math.sqrt(2 * truth * (1 - truth) / n) * 100
    fig = new_fig()
    ax = fig.add_subplot(111)
    style_axes(ax)
    counts, edges, patches = ax.hist(
        diff, bins=45, color=BLUE, edgecolor="white", linewidth=0.7, zorder=3)
    for patch, left in zip(patches, edges[:-1]):
        centre = left + (edges[1] - edges[0]) / 2
        if abs(centre) > 1.96 * se:
            patch.set_facecolor(RED)
    ax.axvline(0, color=INK, linewidth=2.0, zorder=4)
    for sign in (-1, 1):
        ax.axvline(sign * 1.96 * se, color=RED, linewidth=1.8,
                   linestyle="--", zorder=4)
    ax.text(1.96 * se + 0.06, counts.max() * 0.92, "1.96 SE",
            color=RED, fontsize=18)
    ax.text(-1.96 * se - 0.06, counts.max() * 0.92, "1.96 SE",
            color=RED, fontsize=18, ha="right")
    ax.set_xlabel("difference between the two arms (percentage points)")
    ax.set_ylabel("how many of the 2,000 experiments")
    beyond = float((np.abs(diff) > 1.96 * se).mean())
    ax.set_title(
        f"both arms identical, {n:,} people each — "
        f"{beyond * 100:.1f} % still landed outside 1.96 SE",
        fontsize=20, color=INK, pad=16, loc="left")
    print(f"      [null-dist] sd {diff.std(ddof=1):.4f} pp, "
          f"theoretical SE {se:.4f} pp, beyond 1.96SE {beyond:.4f}")
    return save(fig, "null-dist")


# --------------------------------------------------------------------------
# 6. Peeking
# --------------------------------------------------------------------------
def fig_peeking():
    """An A/A test watched as it runs: p dips under 0.05 and comes back.

    The run is CHOSEN, and the figure says so in its caption rather than
    pretending a first draw did this: out of 400 seeded A/A runs the script
    takes the first whose p-value crosses 0.05 at least twice and ends well
    above it. That is exactly the case the slide is about — a test that
    would have been "won" by someone watching, and is nothing.
    """
    def one_run(rng):
        n_max, truth, step = 6000, 0.20, 50
        a = rng.random(n_max) < truth
        b = rng.random(n_max) < truth
        ns, ps = [], []
        for n in range(step, n_max + 1, step):
            ka, kb = int(a[:n].sum()), int(b[:n].sum())
            ra, rb = ka / n, kb / n
            p_pool = (ka + kb) / (2 * n)
            if p_pool in (0.0, 1.0):
                continue
            se = math.sqrt(p_pool * (1 - p_pool) * (2 / n))
            z = abs(ra - rb) / se
            ns.append(n)
            ps.append(math.erfc(z / math.sqrt(2)))
        return np.array(ns), np.array(ps)

    chosen = None
    for k in range(400):
        ns, ps = one_run(np.random.default_rng(SEED + 100 + k))
        crossings = int(np.sum((ps[:-1] >= 0.05) != (ps[1:] >= 0.05)))
        if crossings >= 3 and ps[-1] > 0.25 and ps.min() < 0.03:
            chosen = (k, ns, ps)
            break
    if chosen is None:
        raise SystemExit("no peeking run found — widen the search")
    k, ns, ps = chosen

    fig = new_fig()
    ax = fig.add_subplot(111)
    style_axes(ax)
    ax.plot(ns, ps, color=BLUE, linewidth=2.4, zorder=3)
    ax.axhline(0.05, color=RED, linewidth=2.0, linestyle="--", zorder=4)
    ax.text(ns[-1] * 1.01, 0.05, "0.05", color=RED, fontsize=18, va="center")
    under = ps < 0.05
    ax.fill_between(ns, 0, 1, where=under, color=RED, alpha=0.12, zorder=1)
    # Anchor the callout at the DEEPEST dip, not the first crossing: the first
    # crossing is a single point at the very left edge, and an arrow to it
    # drags a long diagonal across the whole plot.
    deepest = int(np.argmin(ps))
    # The curve occupies the lower-left and the upper-right, so both callouts
    # go in the free diagonal band between them.
    ax.annotate(
        "stop anywhere in here and you ship nothing,\nwith a significant result",
        xy=(ns[deepest], ps[deepest] + 0.012),
        xytext=(ns[deepest] + 340, 0.62),
        color=RED, fontsize=19,
        arrowprops=dict(arrowstyle="->", color=RED, linewidth=1.8))
    # No second callout for the endpoint: the curve climbs away from 0.05
    # unmistakably on its own, and every arrow tried here crossed the line it
    # was pointing at. The final p is in the title instead.
    ax.set_xlabel("people per arm so far")
    ax.set_ylabel("p-value if you stopped now")
    ax.set_ylim(0, 1)
    ax.set_xlim(ns[0], ns[-1])
    ax.set_title(
        "an A/A test — the two arms are identical — watched all the way, "
        f"and it finishes at p = {ps[-1]:.2f}",
        fontsize=20, color=INK, pad=16, loc="left")
    print(f"      [peeking] run {k}, min p {ps.min():.4f}, "
          f"final p {ps[-1]:.4f}, dips {int(under.sum())}")
    return save(fig, "peeking")


# --------------------------------------------------------------------------
# 7. Sample size against the effect you want to catch
# --------------------------------------------------------------------------
def fig_sample_size():
    """n per arm to detect a lift from a 2 % base, 80 % power, 5 % level.

    Standard two-proportion sizing:
        n = (z_a/2 * sqrt(2 p_bar q_bar) + z_b * sqrt(p1 q1 + p2 q2))^2 / d^2
    """
    z_alpha, z_beta = 1.959964, 0.8416212
    base = 0.02
    lifts = np.linspace(0.05, 1.00, 200)  # relative lift, 5 % .. 100 %

    ns = []
    for lift in lifts:
        p1, p2 = base, base * (1 + lift)
        pbar = (p1 + p2) / 2
        d = p2 - p1
        n = ((z_alpha * math.sqrt(2 * pbar * (1 - pbar))
              + z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / d ** 2
        ns.append(n)
    ns = np.array(ns)

    fig = new_fig()
    ax = fig.add_subplot(111)
    style_axes(ax)
    ax.plot(lifts * 100, ns, color=BLUE, linewidth=3.0, zorder=3)
    ax.set_yscale("log")
    ax.set_xlabel("relative lift you want to be able to detect (%)")
    ax.set_ylabel("people needed PER ARM (log scale)")
    ax.set_xlim(0, 100)

    for lift in (0.10, 0.20, 0.43):
        p1, p2 = base, base * (1 + lift)
        pbar = (p1 + p2) / 2
        d = p2 - p1
        n = ((z_alpha * math.sqrt(2 * pbar * (1 - pbar))
              + z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / d ** 2
        colour = GREEN if lift == 0.43 else INK
        ax.scatter([lift * 100], [n], s=140, color=colour, zorder=5)
        # The 43 % label is the longest and sits furthest right, so it is set
        # on two lines and anchored left of its point; the other two clear
        # the curve going right.
        if lift == 0.43:
            ax.annotate(f"+43 %  →  {n:,.0f} per arm\n(our marketing result)",
                        xy=(lift * 100, n), xytext=(lift * 100 + 6, n * 2.6),
                        color=colour, fontsize=19, ha="left",
                        arrowprops=dict(arrowstyle="->", color=colour,
                                        linewidth=1.6))
        else:
            ax.annotate(f"+{lift * 100:.0f} %  →  {n:,.0f} per arm",
                        xy=(lift * 100, n), xytext=(lift * 100 + 5, n * 1.9),
                        color=colour, fontsize=19,
                        arrowprops=dict(arrowstyle="->", color=colour,
                                        linewidth=1.6))
        print(f"      [sample-size] +{lift * 100:.0f}% -> n {n:,.0f} per arm")
    ax.set_title("halve the effect you want to catch, and you need ~4x the people",
                 fontsize=20, color=INK, pad=16, loc="left")
    return save(fig, "sample-size")


# --------------------------------------------------------------------------
# 8. The two marketing conversion rates (REAL DATA)
# --------------------------------------------------------------------------
def fig_marketing_rates():
    """The two bars a business A/B report usually stops at.

    Numbers come from the generator, not from this file, so the figure and
    the SQL slides cannot drift apart. The 95 % intervals are drawn because
    the whole point of the slide after it is that the bars alone say nothing
    — and the two interval widths (0.1 pp against 3 pp) make the 24:1 arm
    imbalance visible without a word.
    """
    gen = load_generator("week10-marketing-gen.py", "week10_marketing_gen")
    rows = gen.marketing_rows()
    n_ad, k_ad = gen.arm_counts(rows, "ad")
    n_psa, k_psa = gen.arm_counts(rows, "psa")
    r_ad, r_psa = k_ad / n_ad, k_psa / n_psa
    print(f"      [marketing] ad {k_ad}/{n_ad} = {r_ad * 100:.4f} %, "
          f"psa {k_psa}/{n_psa} = {r_psa * 100:.4f} %")

    fig = new_fig()
    ax = fig.add_subplot(111)
    style_axes(ax)
    labels = ["ad\n(experimental)", "psa\n(control)"]
    rates = np.array([r_ad, r_psa]) * 100
    errs = np.array([
        1.96 * math.sqrt(r * (1 - r) / n) * 100
        for r, n in ((r_ad, n_ad), (r_psa, n_psa))
    ])
    ax.bar([0, 1], rates, color=[BLUE, SOFT], width=0.46, zorder=3)
    ax.errorbar([0, 1], rates, yerr=errs, fmt="none", ecolor=INK,
                elinewidth=2.4, capsize=16, capthick=2.4, zorder=5)
    for x, (rate, n, k, err) in enumerate((
            (rates[0], n_ad, k_ad, errs[0]), (rates[1], n_psa, k_psa, errs[1]))):
        ax.text(x, rate + err + 0.12, f"{rate:.2f} %", ha="center",
                fontsize=27, color=INK, fontweight="bold")
        ax.text(x, 0.12, f"{k:,} of {n:,}", ha="center",
                fontsize=19, color="white")
    ax.set_xticks([0, 1])
    ax.set_xticklabels(labels, fontsize=21, color=INK)
    ax.set_ylabel("bought the product (%)")
    ax.set_ylim(0, 3.3)
    ax.set_xlim(-0.6, 1.6)
    ratio = errs[1] / errs[0]
    ax.set_title(
        "the bars are the whole report — the whiskers are the 95 % intervals, "
        f"and the control's is {ratio:.1f}x wider",
        fontsize=20, color=INK, pad=16, loc="left")
    print(f"      [marketing] interval half-widths: ad {errs[0]:.4f} pp, "
          f"psa {errs[1]:.4f} pp, ratio {ratio:.2f}")
    return save(fig, "marketing-rates")


FIGURES = [
    fig_coin_runs,
    fig_lln,
    fig_binomial,
    fig_two_samples,
    fig_null_dist,
    fig_peeking,
    fig_sample_size,
    fig_marketing_rates,
]


def main() -> int:
    print(f"drawing {len(FIGURES)} figures into {OUT}")
    for fn in FIGURES:
        fn()
    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
