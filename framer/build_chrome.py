"""Extract the homepage nav and footer into standalone Framer code components.

Both are generated from index.html so the shared chrome is byte-for-byte the
homepage's own CSS, not a re-implementation that will drift.
"""
import pathlib
import re

SRC = pathlib.Path("/Users/macmini/althio.ai/.claude/worktrees/scroll-scene/index.html")
OUT = pathlib.Path("/Users/macmini/.claude/jobs/e2e0ba54/tmp")

html = SRC.read_text(encoding="utf-8")
css = re.search(r"<style>(.*?)</style>", html, re.S).group(1)

# A comment sitting above a rule gets absorbed into that rule's selector by the
# brace scanner below, so the whitelist never matches and the rule is silently
# dropped — which is how `nav { position: fixed }` went missing. Strip first.
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)

# The nav links the whole site shares. "How it works" points back to the home
# page anchor so it still works from a sub-page.
NAV_MARKUP = """
<nav id="nav">
  <div class="wrap nav-inner">
    <a class="logo" href="/">Althio</a>
    <div class="nav-links">
      <a href="/#how">How it works</a>
      <a href="/for-clinicians">For clinicians</a>
      <a href="/safety">Safety</a>
      <a href="/research">Research</a>
      <a href="/blog">Journal</a>
      <a class="btn" href="/demo">Request a demo <span class="arw">&rarr;</span></a>
    </div>
  </div>
</nav>
""".strip()

FOOTER_MARKUP = """
<footer>
  <div class="wrap foot">
    <span>&copy; 2026 Althio AI, Inc.</span>
    <span>
      <a href="/safety">Safety</a><a href="/research">Research</a><a href="/blog">Journal</a><a href="/demo">Contact</a>
    </span>
  </div>
</footer>
""".strip()

NAV_KEEP = re.compile(r"^(:root|\*|html|body|\.wrap\b|nav\b|\.nav-inner|\.logo|\.nav-links|\.btn)")
FOOT_KEEP = re.compile(r"^(:root|\*|html|body|\.wrap\b|footer\b|\.foot)")


def rules(text):
    """Yield (head, body, is_at_rule) for each top-level rule."""
    i, buf = 0, ""
    while i < len(text):
        ch = text[i]
        if ch == "{":
            head = buf.strip()
            depth, j = 1, i + 1
            while j < len(text) and depth:
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                j += 1
            yield head, text[i + 1: j - 1], head.startswith("@")
            buf = ""
            i = j
            continue
        buf += ch
        i += 1


def scope(sel_list, root):
    out = []
    for one in sel_list.split(","):
        one = one.strip()
        if not one:
            continue
        if one in (":root", "html", "body"):
            out.append(root)
        elif one == "*":
            out.append(f"{root} *")
        else:
            out.append(f"{root} {one}")
    return ", ".join(out)


def extract(keep, root):
    parts = []
    for head, body, is_at in rules(css):
        if is_at:
            if not head.lower().startswith("@media"):
                continue
            inner = []
            for h2, b2, at2 in rules(body):
                if at2 or not any(keep.match(s.strip()) for s in h2.split(",")):
                    continue
                inner.append(f"  {scope(h2, root)} {{{b2}}}")
            if inner:
                parts.append(f"{head} {{\n" + "\n".join(inner) + "\n}")
            continue
        if not any(keep.match(s.strip()) for s in head.split(",")):
            continue
        parts.append(f"{scope(head, root)} {{{body}}}")
    return "\n".join(parts)


def tpl(s):
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def component(name, root_id, css_text, markup, effect_body, height_zero):
    root_style = '{ position: "relative", width: "100%"' + (', height: 0 }' if height_zero else ' }')
    return f'''// @ts-nocheck
import {{ useEffect, useRef }} from "react"

// Generated from index.html so the shared chrome stays identical to the
// homepage. Do not hand-edit: regenerate with build_chrome.py.

const CSS = `{tpl(css_text)}`

const MARKUP = `{tpl(markup)}`

/**
 * {name}
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function {name}(props: {{ style?: any }}) {{
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {{
        if (typeof window === "undefined") return
        const root = rootRef.current
        if (!root) return
        const controller = new AbortController()
        const signal = controller.signal
{effect_body}
        return () => controller.abort()
    }}, [])

    return (
        <div
            id="{root_id}"
            ref={{rootRef}}
            style={{{{ ...{root_style}, ...props.style }}}}
        >
            <style dangerouslySetInnerHTML={{{{ __html: CSS }}}} />
            <div dangerouslySetInnerHTML={{{{ __html: MARKUP }}}} />
        </div>
    )
}}
'''


NAV_EFFECT = """        // Same behaviour as the homepage: the bar frosts once the page moves.
        const bar = root.querySelector("#nav")
        if (bar) {
            const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 8)
            onScroll()
            window.addEventListener("scroll", onScroll, { passive: true, signal })
        }"""

nav_css = extract(NAV_KEEP, "#althio-nav")
foot_css = extract(FOOT_KEEP, "#althio-footer")

# The chrome inherits :root, which carries the four embedded sky images. It
# needs the colour and font variables from that block, not 320KB of base64.
SKY_VAR = re.compile(r'\n\s*--sky-[a-z0-9-]+:\s*url\("data:[^"]+"\);')

# scroll-behavior belongs to the document, and overflow-x would make the host a
# scroll container — neither belongs on a chrome wrapper.
for pat in (r"\n\s*scroll-behavior:\s*smooth;", r"\n\s*overflow-x:\s*hidden;"):
    nav_css = re.sub(pat, "", nav_css)
    foot_css = re.sub(pat, "", foot_css)

nav_css = SKY_VAR.sub("", nav_css)
foot_css = SKY_VAR.sub("", foot_css)

# index.html hides the nav links below 860px, which was right for a one-page
# site but drops every link on an 810px tablet. Tablets have the room; only
# phones need the collapse.
nav_css = nav_css.replace("@media (max-width: 860px)", "@media (max-width: 720px)")

# Framer's fixed "Made in Framer" badge sits over the viewport's bottom-right
# corner and hides the footer links on phones. Clear it (Framer-only concern,
# so this lives here and not in index.html).
foot_css += (
    "\n@media (max-width: 720px) {\n"
    "  #althio-footer footer { padding-bottom: 92px; }\n"
    "}"
)
assert "base64" not in nav_css and "base64" not in foot_css, "sky vars still embedded"

(OUT / "AlthioNav.tsx").write_text(component("AlthioNav", "althio-nav", nav_css, NAV_MARKUP, NAV_EFFECT, True), encoding="utf-8")
(OUT / "AlthioFooter.tsx").write_text(component("AlthioFooter", "althio-footer", foot_css, FOOTER_MARKUP, "", False), encoding="utf-8")

print("AlthioNav.tsx   ", (OUT / "AlthioNav.tsx").stat().st_size, "bytes")
print("AlthioFooter.tsx", (OUT / "AlthioFooter.tsx").stat().st_size, "bytes")
print("nav rules kept:  ", nav_css.count("{"))
print("foot rules kept: ", foot_css.count("{"))
