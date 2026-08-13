"""Turn index.html into a Framer code component.

Three transforms matter:
  1. Every CSS selector is scoped to #althio-root, so the page styles cannot
     touch Framer's own chrome (and :root / html / body become the root div).
  2. `overflow-x: hidden` is dropped — on a non-root element it creates a
     scroll container, which silently kills `position: sticky` descendants.
  3. Base64 images become uploaded Framer CDN URLs, so the browser can cache
     them and the file stays a sane size.
"""
import json
import pathlib
import re

SRC = pathlib.Path("/Users/macmini/althio.ai/.claude/worktrees/scroll-scene/index.html")
OUT = pathlib.Path("/Users/macmini/.claude/jobs/e2e0ba54/tmp/AlthioLanding.tsx")
ROOT = "#althio-root"

LOGO_INK = "https://framerusercontent.com/images/GANgHGvzvesIJ9MX0o9lrMw2Y0.png"

UPLOADED = {
    "sky-day": "https://framerusercontent.com/images/YTgwKd8dFTqttTosKcOOtZXfF7k.jpg",
    "sky-night": "https://framerusercontent.com/images/gsLH8HuBy8l4orvqoXweyyNPWVA.jpg",
    "sky-3am": "https://framerusercontent.com/images/oVUsSNnxV8GbbChzWsOAN26pOU.jpg",
    "sky-cta": "https://framerusercontent.com/images/JoRZbiHlKQ037lB8fW8BgIGFk.jpg",
    "asset-01": "https://framerusercontent.com/images/SMx0rDplixfhrHUAcUd8w4wwEE.svg",
    "asset-02": "https://framerusercontent.com/images/JRMF2Rw1Z0J11ihnBU6ZeaL9sY.jpg",
    "asset-03": "https://framerusercontent.com/images/sQ38n5HPeDElYSLErF5XYM0uQ.jpg",
    "asset-04": "https://framerusercontent.com/images/x4HaE47hFRW4FEY0Hw8uaePKEm8.png",
}

html = SRC.read_text(encoding="utf-8")

# ---------------------------------------------------------------- split file
css = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
script = re.search(r"<script>(.*?)</script>", html, re.S).group(1)
body = html[html.index("</style>") + len("</style>"): html.index("<script>")].strip()


# --------------------------------------------------------- swap in CDN urls
def swap_images(text: str) -> tuple[str, int]:
    """Replace each base64 payload with its uploaded URL, matched by order."""
    named = dict(re.findall(r'--([a-z0-9-]+):\s*url\("(data:[^"]+)"\)', html))
    mapping = {}
    for name, uri in named.items():
        if name in UPLOADED:
            mapping[uri] = UPLOADED[name]

    # The wordmark is matched by its alt text, not by position: mapping inline
    # images purely in document order breaks the moment another <img> is added
    # ahead of the compliance logos.
    logo = re.search(
        r'<img src="(data:image/[a-z+]+;base64,[A-Za-z0-9+/=]+)" alt="Althio"', html
    )
    if logo:
        mapping[logo.group(1)] = LOGO_INK

    # Remaining inline <img> data URIs, in document order -> asset-01..asset-04
    inline = [
        u
        for u in re.findall(r'src="(data:image/[a-z+]+;base64,[A-Za-z0-9+/=]+)"', html)
        if u not in mapping
    ]
    if len(inline) != 4:
        raise SystemExit(f"expected 4 compliance images, found {len(inline)}")
    for i, uri in enumerate(inline, start=1):
        mapping.setdefault(uri, UPLOADED[f"asset-{i:02d}"])

    hits = 0
    for uri, url in mapping.items():
        if uri in text:
            hits += text.count(uri)
            text = text.replace(uri, url)
    return text, hits


css, css_hits = swap_images(css)
body, body_hits = swap_images(body)

# ------------------------------------------- hand nav and footer to the chrome
# AlthioNav and AlthioFooter are separate components placed on every page, so
# the landing page must not carry its own copies.
before = len(body)
body = re.sub(r"<nav id=\"nav\">.*?</nav>", "", body, flags=re.S)
body = re.sub(r"<footer>.*?</footer>", "", body, flags=re.S)
if len(body) == before:
    raise SystemExit("nav/footer not found in landing markup")

# The demo request now goes to a real form page instead of an email client,
# and the hero button goes there directly instead of scrolling to the CTA.
body = body.replace('href="mailto:hello@althio.ai"', 'href="/demo"')
body = body.replace('href="#demo-cta"', 'href="/demo"')


# ------------------------------------------------------------- scope the css
def split_selectors(sel: str) -> str:
    out = []
    for one in sel.split(","):
        one = one.strip()
        if not one:
            continue
        if one in (":root", "html", "body"):
            out.append(ROOT)
        elif one == "*":
            out.append(f"{ROOT} *")
        elif one.startswith("::") or one.startswith(":"):
            # e.g. ::selection  ->  #althio-root ::selection
            out.append(f"{ROOT} {one}")
        elif one.startswith("@"):
            out.append(one)
        else:
            # body.foo / html.bar would double up; strip the leading element
            one = re.sub(r"^(?:html|body)\b", "", one).strip() or ROOT
            out.append(one if one.startswith(ROOT) else f"{ROOT} {one}")
    return ", ".join(out)


def scope_css(text: str) -> str:
    out = []
    i = 0
    buf = ""
    while i < len(text):
        ch = text[i]
        if ch == "{":
            head = buf.strip()
            if head.startswith("@"):
                at = head.split()[0].lower()
                if at in ("@keyframes", "@-webkit-keyframes", "@font-face", "@supports", "@property"):
                    # copy the whole block untouched
                    depth, j = 1, i + 1
                    while j < len(text) and depth:
                        if text[j] == "{":
                            depth += 1
                        elif text[j] == "}":
                            depth -= 1
                        j += 1
                    out.append(buf + text[i:j])
                    buf = ""
                    i = j
                    continue
                # @media / @container: keep the header, recurse inside
                depth, j = 1, i + 1
                while j < len(text) and depth:
                    if text[j] == "{":
                        depth += 1
                    elif text[j] == "}":
                        depth -= 1
                    j += 1
                inner = text[i + 1: j - 1]
                out.append(buf + "{" + scope_css(inner) + "}")
                buf = ""
                i = j
                continue

            # plain rule: scope the selector, copy the declaration block
            depth, j = 1, i + 1
            while j < len(text) and depth:
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                j += 1
            decls = text[i + 1: j - 1]
            leading = buf[: len(buf) - len(buf.lstrip())]
            out.append(leading + split_selectors(head) + " {" + decls + "}")
            buf = ""
            i = j
            continue
        buf += ch
        i += 1
    out.append(buf)
    return "".join(out)


css = scope_css(css)

# `overflow-x: hidden` makes #althio-root a scroll container, which breaks the
# sticky scroll scene. The page never scrolls sideways anyway.
css, n_overflow = re.subn(r"\n\s*overflow-x:\s*hidden;", "", css)

# scroll-behavior belongs on the document, not on a div; the effect sets it.
css = re.sub(r"\n\s*scroll-behavior:\s*smooth;", "", css)


# ------------------------------------------------------------- emit the tsx
def tpl(s: str) -> str:
    """Safe inside a JS template literal."""
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


tsx = f'''// @ts-nocheck
import {{ useEffect, useRef, type CSSProperties }} from "react"

// Generated from index.html — the hand-built Althio landing page.
// Markup and styles are injected as-is so the canvas scroll scene, the
// constellation canvas and the momentum scrolling behave exactly as authored.
// Every selector is scoped to #althio-root at build time.

const CSS = `{tpl(css)}`

const MARKUP = `{tpl(body)}`

/**
 * Althio Landing
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioLanding(props: {{ style?: CSSProperties }}) {{
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {{
        if (typeof window === "undefined") return
        const root = rootRef.current
        if (!root) return

        const controller = new AbortController()
        const signal = controller.signal
        let alive = true

        // Shadowed so every bare addEventListener / requestAnimationFrame in the
        // page script is torn down when Framer unmounts the component.
        const addEventListener = (
            type: string,
            handler: any,
            options?: any
        ) => window.addEventListener(type, handler, {{ ...(options || {{}}), signal }})
        const requestAnimationFrame = (cb: FrameRequestCallback) =>
            alive ? window.requestAnimationFrame(cb) : 0

        // Native smooth scroll for touch; the desktop glide below turns it off.
        document.documentElement.style.scrollBehavior = "smooth"

        try {{
__SCRIPT__
        }} catch (err) {{
            console.error("[AlthioLanding]", err)
        }}

        return () => {{
            alive = false
            controller.abort()
            document.documentElement.style.scrollBehavior = ""
        }}
    }}, [])

    return (
        <div
            id="althio-root"
            ref={{rootRef}}
            style={{{{ position: "relative", width: "100%", ...props.style }}}}
        >
            <style dangerouslySetInnerHTML={{{{ __html: CSS }}}} />
            <div dangerouslySetInnerHTML={{{{ __html: MARKUP }}}} />
        </div>
    )
}}
'''

indented = "\n".join(("            " + ln) if ln.strip() else "" for ln in script.split("\n"))
tsx = tsx.replace("__SCRIPT__", indented)

OUT.write_text(tsx, encoding="utf-8")

print(f"wrote {OUT}  ({OUT.stat().st_size/1024:.1f} KB)")
print(f"image swaps: css={css_hits} body={body_hits}")
print(f"overflow-x rules removed: {n_overflow}")
print(f"remaining base64 payloads: {tsx.count('base64,')}")
unscoped = re.findall(r"(?m)^[a-zA-Z.#*][^{;]*\{", css)
print(f"unscoped-looking rules: {len(unscoped)} {unscoped[:5]}")
