"""Cut the leading 'a' out of the wordmark and build the full favicon set.

Glyphs are separated by columns of zero alpha, so a column projection finds
their boundaries without hand-measuring pixel coordinates.
"""
import pathlib

from PIL import Image

SRC = pathlib.Path("/Users/macmini/Downloads/Image_20260813_222806.png")
OUT = pathlib.Path("/Users/macmini/.claude/jobs/e2e0ba54/tmp/logo")
OUT.mkdir(parents=True, exist_ok=True)

INK = (35, 32, 28)
CREAM = (251, 247, 240)
FLOOR, CEIL = 26, 236

img = Image.open(SRC).convert("RGB")
alpha = img.convert("L").point(
    lambda v: 0 if v <= FLOOR else min(255, round((v - FLOOR) * 255 / (CEIL - FLOOR)))
)
alpha = alpha.crop(alpha.getbbox())
w, h = alpha.size
px = alpha.load()

# Column projection -> glyph runs.
cols = [sum(px[x, y] for y in range(h)) for x in range(w)]
runs, start = [], None
for x, v in enumerate(cols):
    if v > 0 and start is None:
        start = x
    elif v == 0 and start is not None:
        runs.append((start, x))
        start = None
if start is not None:
    runs.append((start, w))

print(f"wordmark {w}x{h}; {len(runs)} glyph runs:")
for i, (a, b) in enumerate(runs):
    print(f"  {i}: x {a}-{b}  width {b - a}")

# The 'a' is the first run.
a0, a1 = runs[0]
mark = alpha.crop((a0, 0, a1, h))
mark = mark.crop(mark.getbbox())
mw, mh = mark.size
print(f"mark: {mw}x{mh}")


def tile(size, glyph_rgb, bg_rgb=None, pad_ratio=0.16):
    """Square canvas with the mark centred; bg_rgb None keeps it transparent."""
    side = max(mw, mh)
    box = round(side * (1 + pad_ratio * 2))
    base = (bg_rgb + (255,)) if bg_rgb else (glyph_rgb + (0,))
    canvas = Image.new("RGBA", (box, box), base)
    layer = Image.new("RGBA", (mw, mh), glyph_rgb + (0,))
    layer.putalpha(mark)
    canvas.paste(layer, ((box - mw) // 2, (box - mh) // 2), layer)
    return canvas.resize((size, size), Image.LANCZOS)


tile(512, INK).save(OUT / "favicon-light-512.png", optimize=True)
tile(512, CREAM).save(OUT / "favicon-dark-512.png", optimize=True)
tile(180, CREAM, INK, pad_ratio=0.24).save(OUT / "apple-touch-icon-180.png", optimize=True)

# A real multi-resolution .ico for anything that still asks for one.
ico = tile(256, INK)
ico.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

for f in ["favicon-light-512.png", "favicon-dark-512.png", "apple-touch-icon-180.png", "favicon.ico"]:
    print(f"  {f}  {(OUT / f).stat().st_size / 1024:.1f} KB")

# Legibility check: how the mark reads at tab size.
tile(32, INK).resize((160, 160), Image.NEAREST).save(OUT / "preview-favicon-32.png")
prev = Image.new("RGB", (420, 200), CREAM)
prev.paste(Image.open(OUT / "preview-favicon-32.png").convert("RGB"), (20, 20))
dark = Image.new("RGB", (160, 160), (18, 22, 34))
d32 = tile(32, CREAM).resize((160, 160), Image.NEAREST)
dark.paste(d32, (0, 0), d32)
prev.paste(dark, (240, 20))
prev.save(OUT / "preview-favicon-pair.png")
print("  preview-favicon-pair.png")
