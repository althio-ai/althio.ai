"""Pull every data: URI out of index.html and write it to disk as a real file."""
import base64
import pathlib
import re

SRC = pathlib.Path("/Users/macmini/althio.ai/.claude/worktrees/scroll-scene/index.html")
OUT = pathlib.Path("/Users/macmini/.claude/jobs/e2e0ba54/tmp/assets")
OUT.mkdir(parents=True, exist_ok=True)

html = SRC.read_text(encoding="utf-8")

EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/gif": "gif",
}

# Named CSS custom properties first, so the sky images keep meaningful filenames.
named = dict(re.findall(r"--([a-z0-9-]+):\s*url\(\"(data:[^\"]+)\"\)", html))

seen = {}
manifest = []

for name, uri in named.items():
    head, b64 = uri.split(",", 1)
    mime = head.split(";")[0][5:]
    ext = EXT.get(mime, "bin")
    raw = base64.b64decode(b64)
    path = OUT / f"{name}.{ext}"
    path.write_bytes(raw)
    seen[uri] = path.name
    manifest.append((name, path.name, len(raw), mime))

# Any remaining data URIs (compliance logos, inline img src, etc.)
others = re.findall(r"(data:image/[a-z+]+;base64,[A-Za-z0-9+/=]+)", html)
n = 0
for uri in others:
    if uri in seen:
        continue
    head, b64 = uri.split(",", 1)
    mime = head.split(";")[0][5:]
    ext = EXT.get(mime, "bin")
    try:
        raw = base64.b64decode(b64)
    except Exception:
        continue
    n += 1
    path = OUT / f"asset-{n:02d}.{ext}"
    path.write_bytes(raw)
    seen[uri] = path.name
    manifest.append((f"(inline #{n})", path.name, len(raw), mime))

print(f"{len(manifest)} assets written to {OUT}\n")
for name, fn, size, mime in manifest:
    print(f"  {name:24s} -> {fn:22s} {size/1024:9.1f} KB  {mime}")

total = sum(m[2] for m in manifest)
print(f"\ntotal embedded bytes: {total/1024:.1f} KB of {SRC.stat().st_size/1024:.1f} KB file")

# Also count non-data-URI inline SVGs, which do not need uploading.
print(f"inline <svg> tags in markup: {len(re.findall(r'<svg', html))}")
