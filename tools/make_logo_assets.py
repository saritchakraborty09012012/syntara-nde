#!/usr/bin/env python3
"""Round every Syntara logo asset that currently ships with square corners.

`assets/syntara-logo.png` is the single source of truth. The tile inside the
artwork is already a rounded glass rectangle, but the canvas around it is an
opaque black square: the corner pixels of the PNG are solid black. On a dark
surface the square disappears; everywhere it does not - a light browser tab,
the Explorer details pane, the Start menu, the GitHub README - the logo reads
as a sharp black square. The web app made it worse by clipping the artwork
with `border-radius: 3px` frames, and the site's Nav logo was cut with the
HUD `clip-path` polygon.

The square canvas is removed at the source. The tile is fitted to the
artwork, masked to an antialiased rounded rectangle, and the neon bloom just
outside the tile is kept as soft alpha instead of being cut off, so the glow
survives the round trip. Only alpha is ever edited - RGB is copied through
untouched - so re-running the script on an already-rounded master reproduces
the same pixels and the same file.

Everything else in the repository is derived from that master:

    web/public/syntara-logo.png       app brand mark, welcome screen, avatars
    web/public/favicon-32.png         tab icons
    web/public/favicon-128.png        shortcut icons
    web/public/favicon.ico            multi-size favicon (was a single 16x16)
    web/public/apple-touch-icon.png   PWA icon (was a stray placeholder)
    site/public/syntara-logo.png      site nav, footer, page favicons
    desktop/src-tauri/icons/*.png     window, tray and shortcut icons
    desktop/src-tauri/icons/icon.ico  NSIS installer + uninstaller icon

Usage:
    make_logo_assets.py                     regenerate everything
    make_logo_assets.py --repo .            regenerate for a specific checkout
    make_logo_assets.py --check             fail if any asset has sharp corners
"""

from __future__ import annotations

import argparse
import io
import pathlib
import shutil
import statistics
import struct
import sys

try:
    from PIL import Image, ImageChops, ImageDraw
except ImportError:  # pragma: no cover - developer tooling, not a runtime dep
    sys.exit("make_logo_assets.py requires Pillow: python -m pip install pillow")

REPO = pathlib.Path(__file__).resolve().parent.parent

# Luminance above which a pixel counts as tile rim when fitting the rounded
# rectangle to the artwork. The bloom falls well below this a few pixels out,
# so the fitted edge lands on the glow rather than on empty canvas.
FIT_THRESHOLD = 60

# Corner radius as a fraction of the fitted tile. Measuring the master gives
# a rim radius of roughly 0.20 of the side; 0.19 sits just inside it, and the
# soft bloom outside the mask catches any glow the arc would otherwise clip.
RADIUS_FRACTION = 0.19

# Bloom outside the tile: fully transparent at/below GLOW_FLOOR, reaching
# GLOW_ALPHA at GLOW_SATURATION. High enough to keep the neon halo visible,
# low enough that it never reads as a dark fringe on a light background.
GLOW_FLOOR = 14
GLOW_SATURATION = 90
GLOW_ALPHA = 210

SUPERSAMPLE = 4

# icon.ico needs the sizes Explorer and NSIS actually render; favicon.ico only
# needs what browsers ask for. 256 for the Tauri set is also `128x128@2x`.
DESKTOP_ICO_SIZES = [(16, 16), (24, 24), (32, 32), (48, 48),
                     (64, 64), (128, 128), (256, 256)]
WEB_ICO_SIZES = [(16, 16), (32, 32), (48, 48)]

TAURI_PNGS = {
    "32x32.png": 32,
    "64x64.png": 64,
    "128x128.png": 128,
    "128x128@2x.png": 256,
    "256x256.png": 256,
    "512x512.png": 512,
}

# A stray pixel-art placeholder sat here while every sibling icon was the S
# logo; it is regenerated from the master like the rest.
APPLE_TOUCH = 256


def _max_channel(rgb: Image.Image) -> Image.Image:
    r, g, b = rgb.split()
    return ImageChops.lighter(ImageChops.lighter(r, g), b)


def _fit_tile(lum: Image.Image) -> tuple[int, int, int, int]:
    """Locate the tile: median first/last bright pixel per row and column.

    Medians rather than minima: the bloom bulges past the rim at a few
    places (the left edge wanders 12 px outward around y=900, and the corner
    arcs run a couple hundred pixels inboard), while the straight runs
    dominate the sample and pin the edges to the tile itself.
    """
    w, h = lum.size
    data = lum.tobytes()

    lefts = []
    rights = []
    for y in range(h):
        row = data[y * w:(y + 1) * w]
        first = next((x for x, v in enumerate(row) if v > FIT_THRESHOLD), None)
        if first is None:
            continue
        lefts.append(first)
        rights.append(next(x for x in range(w - 1, -1, -1)
                           if row[x] > FIT_THRESHOLD))

    tops = []
    bottoms = []
    for x in range(w):
        first = next((y for y in range(h) if data[y * w + x] > FIT_THRESHOLD), None)
        if first is None:
            continue
        tops.append(first)
        bottoms.append(next(y for y in range(h - 1, -1, -1)
                            if data[y * w + x] > FIT_THRESHOLD))

    if not lefts or not tops:
        raise SystemExit(
            "logo master has no bright rim to fit - the artwork is not the "
            "Syntara tile any more, refusing to mask it"
        )

    return (
        round(statistics.median(lefts)),
        round(statistics.median(tops)),
        round(statistics.median(rights)),
        round(statistics.median(bottoms)),
    )


def _round_mask(size: tuple[int, int], rect: tuple[int, int, int, int],
                radius: float) -> Image.Image:
    s = SUPERSAMPLE
    big = Image.new("L", (size[0] * s, size[1] * s), 0)
    draw = ImageDraw.Draw(big)
    draw.rounded_rectangle(
        (rect[0] * s, rect[1] * s, rect[2] * s - 1, rect[3] * s - 1),
        radius=round(radius * s),
        fill=255,
    )
    return big.resize(size, Image.LANCZOS)


def _glow_alpha(lum: Image.Image) -> Image.Image:
    def ramp(value: int) -> int:
        if value <= GLOW_FLOOR:
            return 0
        if value >= GLOW_SATURATION:
            return GLOW_ALPHA
        return round((value - GLOW_FLOOR) * GLOW_ALPHA
                     / (GLOW_SATURATION - GLOW_FLOOR))

    return lum.point([ramp(v) for v in range(256)])


def rounded_master(master: Image.Image) -> Image.Image:
    """Return the master with the square canvas replaced by a rounded alpha.

    Channels are assembled rather than composited: `paste` with a mask would
    blend the RGB of the source with the (transparent) destination, which
    darkens the bloom's RGB by its own alpha and makes every re-run drift a
    little further. RGB must survive untouched for the script to be
    idempotent.
    """
    master = master.convert("RGBA")
    rgb = master.convert("RGB")
    lum = _max_channel(rgb)

    rect = _fit_tile(lum)
    width = rect[2] - rect[0]
    height = rect[3] - rect[1]
    if width * height < 0.6 * master.size[0] * master.size[1]:
        raise SystemExit(
            f"fitted tile {rect} is not a plausible full-bleed tile, "
            "refusing to mask it"
        )
    radius = RADIUS_FRACTION * min(width, height)

    mask = _round_mask(master.size, rect, radius)
    outside = mask.point(lambda v: 255 - v)
    bloom = ImageChops.multiply(_glow_alpha(lum), outside)
    alpha = ImageChops.lighter(mask, bloom)
    return Image.merge("RGBA", (*rgb.split(), alpha))


def resize_rgba(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Downscale with premultiplication so the transparent black canvas does
    not bleed into the rim as a dark fringe on light backgrounds."""
    if im.size == size:
        return im
    r, g, b, a = im.split()
    premul = [ImageChops.multiply(ch, a) for ch in (r, g, b)]
    scaled = [ch.resize(size, Image.LANCZOS) for ch in premul]
    alpha = a.resize(size, Image.LANCZOS)
    scaled_alpha = alpha.tobytes()
    w, h = size

    def unpremul(channel: Image.Image) -> Image.Image:
        source = channel.tobytes()
        out = bytearray(len(source))
        for i, av in enumerate(scaled_alpha):
            if av:
                value = (source[i] * 255 + av // 2) // av
                out[i] = 255 if value > 255 else value
        return Image.frombytes("L", (w, h), bytes(out))

    return Image.merge("RGBA", (*[unpremul(ch) for ch in scaled], alpha))


def _ico_sizes(path: pathlib.Path) -> list[int]:
    data = path.read_bytes()
    reserved, typ, count = struct.unpack("<HHH", data[:6])
    if (reserved, typ) != (0, 1):
        raise SystemExit(f"{path} is not an .ico container")
    widths = []
    offset = 6
    for _ in range(count):
        widths.append(data[offset] or 256)
        offset += 16
    return widths


def generate(repo: pathlib.Path) -> None:
    master_path = repo / "assets" / "syntara-logo.png"
    rounded = rounded_master(Image.open(master_path))
    rounded.save(master_path)

    for copy in (repo / "web" / "public" / "syntara-logo.png",
                 repo / "site" / "public" / "syntara-logo.png"):
        shutil.copyfile(master_path, copy)

    icon_source = resize_rgba(rounded, (256, 256))

    favicon = repo / "web" / "public"
    resize_rgba(rounded, (32, 32)).save(favicon / "favicon-32.png")
    resize_rgba(rounded, (128, 128)).save(favicon / "favicon-128.png")
    icon_source.save(favicon / "apple-touch-icon.png")
    icon_source.save(favicon / "favicon.ico", format="ICO",
                     sizes=WEB_ICO_SIZES)

    tauri_icons = repo / "desktop" / "src-tauri" / "icons"
    for name, size in TAURI_PNGS.items():
        resize_rgba(rounded, (size, size)).save(tauri_icons / name)
    icon_source.save(tauri_icons / "icon.ico", format="ICO",
                     sizes=DESKTOP_ICO_SIZES)


PNG_OUTPUTS = (
    "assets/syntara-logo.png",
    "web/public/syntara-logo.png",
    "web/public/favicon-32.png",
    "web/public/favicon-128.png",
    "web/public/apple-touch-icon.png",
    "site/public/syntara-logo.png",
    "desktop/src-tauri/icons/32x32.png",
    "desktop/src-tauri/icons/64x64.png",
    "desktop/src-tauri/icons/128x128.png",
    "desktop/src-tauri/icons/128x128@2x.png",
    "desktop/src-tauri/icons/256x256.png",
    "desktop/src-tauri/icons/512x512.png",
)

ICO_OUTPUTS = (
    ("web/public/favicon.ico",
     tuple(sorted(s for s, _ in WEB_ICO_SIZES))),
    ("desktop/src-tauri/icons/icon.ico",
     tuple(sorted(s for s, _ in DESKTOP_ICO_SIZES))),
)


def check(repo: pathlib.Path) -> int:
    problems = []

    for rel in PNG_OUTPUTS:
        path = repo / rel
        if not path.is_file():
            problems.append(f"{rel}: missing")
            continue
        im = Image.open(path).convert("RGBA")
        w, h = im.size
        for corner in ((0, 0), (w - 1, 0)):
            if im.getpixel(corner)[3] != 0:
                problems.append(f"{rel}: corner {corner} is opaque (square "
                                "canvas is back)")
                break

    for rel, expected in ICO_OUTPUTS:
        path = repo / rel
        if not path.is_file():
            problems.append(f"{rel}: missing")
            continue
        widths = sorted(_ico_sizes(path))
        if widths != list(expected):
            problems.append(f"{rel}: entries {widths} are not the expected "
                            f"sizes {list(expected)}")

    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        print(f"{len(problems)} logo asset(s) are wrong; run "
              "tools/make_logo_assets.py to regenerate", file=sys.stderr)
    return 1 if problems else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=pathlib.Path, default=REPO,
                        help="checkout to operate on (default: this repo)")
    parser.add_argument("--check", action="store_true",
                        help="verify rounded corners instead of writing")
    args = parser.parse_args(argv)

    if args.check:
        return check(args.repo)
    generate(args.repo)
    return check(args.repo)


if __name__ == "__main__":
    raise SystemExit(main())
