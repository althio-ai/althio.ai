"""Turn the white-on-black wordmark into transparent PNGs.

The source is a flat black plate with light glyphs, so luminance is a clean
alpha channel: it keeps the antialiased edges instead of the ragged mask a
colour-key would produce. The glyph colour is then painted in flat, which is
why one source yields both an ink and a white version.
"""
import pathlib

from PIL import Image

SRC = pathlib.Path("/Users/macmini/Downloads/Image_20260813_222806.png")
OUT = pathlib.Path("/Users/macmini/.claude/jobs/e2e0ba54/tmp/logo")
OUT.mkdir(parents=True, exist_ok=True)

INK = (35, 32, 28)      # --ink, for the cream nav
CREAM = (251, 247, 240)  # --cream, for dark surfaces

img = Image.open(SRC).convert("RGB")
w, h = img.size
print(f"source: {w}x{h}")

# Luminance -> alpha.
alpha = img.convert("L")

# The plate is not perfectly black, so lift the floor and renormalise; without
# this the whole rectangle keeps a faint milky wash.
FLOOR, CEIL = 26, 236
alpha = alpha.point(lambda v: 0 if v <= FLOOR else min(255, round((v - FLOOR) * 255 / (CEIL - FLOOR))))

# Trim to the glyphs, then add breathing room proportional to the mark.
bbox = alpha.getbbox()
print("glyph bbox:", bbox)
pad = round((bbox[3] - bbox[1]) * 0.12)
box = (
    max(0, bbox[0] - pad),
    max(0, bbox[1] - pad),
    min(w, bbox[2] + pad),
    min(h, bbox[3] + pad),
)
alpha = alpha.crop(box)
cw, ch = alpha.size
print(f"cropped: {cw}x{ch}  aspect {cw / ch:.2f}:1")

for name, rgb in (("ink", INK), ("white", CREAM)):
    out = Image.new("RGBA", (cw, ch), rgb + (0,))
    out.putalpha(alpha)
    path = OUT / f"althio-logo-{name}.png"
    out.save(path, optimize=True)
    print(f"  {path.name}  {path.stat().st_size / 1024:.1f} KB")

# A square lockup for the favicon, built from the same alpha.
side = max(cw, ch)
fav = Image.new("RGBA", (side, side), INK + (0,))
mark = Image.new("RGBA", (cw, ch), INK + (0,))
mark.putalpha(alpha)
fav.paste(mark, ((side - cw) // 2, (side - ch) // 2), mark)
fav = fav.resize((512, 512), Image.LANCZOS)
fav.save(OUT / "althio-favicon-square.png", optimize=True)
print("  althio-favicon-square.png (512x512)")
