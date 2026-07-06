#!/usr/bin/env python3
"""Render the Rubik's-style table shuffle to a looping GIF.

Drives table-anim.html frame-by-frame with Playwright (headless Chromium),
screenshots each frame, then encodes with ffmpeg using a shared palette.
Alternates one row-swap and one column-swap per move; loops seamlessly by
ending on the starting permutation.
"""
import pathlib, subprocess, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
PAGE = (HERE / "table-anim.html").as_uri()
FRAMES = HERE / "frames"
OUT = HERE / "table-shuffle.gif"

STAGE_W, STAGE_H = 1280, 528   # must match #stage in table-anim.html
FPS = 20                 # capture/output frame rate
MOVE_SECS = 2.0          # seconds per swap
HOLD_SECS = 0.5          # brief hold after each swap settles
MOVE_FRAMES = int(FPS * MOVE_SECS)
HOLD_FRAMES = int(FPS * HOLD_SECS)

# A sequence of swaps by SLOT index. Each pair is (axis, a, b).
# Chosen so the whole sequence returns to the identity permutation -> seamless
# loop. Rows: slots 1..6 (slot 0 is the header, never moved). Cols: 0..7.
# A swap and its later mirror cancel out.
MOVES = [
    ("row", 2, 3),
    ("col", 4, 5),
    ("row", 1, 2),
    ("col", 2, 3),
    ("row", 1, 2),   # undo row 1/2
    ("col", 2, 3),   # undo col 2/3
    ("row", 2, 3),   # undo row 2/3
    ("col", 4, 5),   # undo col 4/5
]


def main():
    FRAMES.mkdir(exist_ok=True)
    for f in FRAMES.glob("*.png"):
        f.unlink()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": STAGE_W, "height": STAGE_H},
                                device_scale_factor=2)
        page.goto(PAGE)
        page.wait_for_function("window.READY === true")
        page.wait_for_timeout(600)   # let the webfont load

        n = 0

        def shoot():
            nonlocal n
            page.screenshot(path=str(FRAMES / f"f{n:04d}.png"), clip={
                "x": 0, "y": 0, "width": STAGE_W, "height": STAGE_H})
            n += 1

        # opening hold on the tidy table
        for _ in range(HOLD_FRAMES):
            shoot()

        for axis, a, b in MOVES:
            for i in range(MOVE_FRAMES):
                t = (i + 1) / MOVE_FRAMES
                page.evaluate("([ax,a,b,t]) => window.setMove(ax,a,b,t)",
                              [axis, a, b, t])
                shoot()
            page.evaluate("([ax,a,b]) => window.commitMove(ax,a,b)",
                          [axis, a, b])
            for _ in range(HOLD_FRAMES):
                shoot()

        browser.close()
        print(f"captured {n} frames")

    encode(n)


def encode(nframes):
    # Output tuning for a small-but-crisp slide GIF: downsample 20fps capture to
    # OUT_FPS, scale to OUT_W, and quantise to a 64-colour palette (the design
    # only uses green/ink/cream/grey, so this is lossless-looking).
    OUT_FPS, OUT_W, COLORS = 12.5, 860, 64
    vf = f"fps={OUT_FPS},scale={OUT_W}:-1:flags=lanczos"
    palette = FRAMES / "palette.png"
    # 1) generate a shared palette from the downsampled stream
    subprocess.run([
        "ffmpeg", "-y", "-framerate", str(FPS), "-i", str(FRAMES / "f%04d.png"),
        "-vf", f"{vf},palettegen=max_colors={COLORS}:stats_mode=diff",
        str(palette)], check=True, capture_output=True)
    # 2) encode the GIF using it
    subprocess.run([
        "ffmpeg", "-y", "-framerate", str(FPS), "-i", str(FRAMES / "f%04d.png"),
        "-i", str(palette),
        "-lavfi", f"{vf}[x];[x][1:v]paletteuse=dither=sierra2_4a",
        "-loop", "0", str(OUT)], check=True, capture_output=True)
    size = OUT.stat().st_size
    print(f"wrote {OUT}  ({size/1024:.0f} KB, {nframes} frames)")


if __name__ == "__main__":
    sys.exit(main())
