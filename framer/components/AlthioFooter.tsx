import { addPropertyControls, ControlType } from "framer"
import type { CSSProperties } from "react"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}

.althio-footer {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --line: rgba(35, 32, 28, 0.12);
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}
.althio-footer *, .althio-footer *::before, .althio-footer *::after { margin: 0; padding: 0; box-sizing: border-box; }

.althio-footer footer { border-top: 1px solid var(--line); padding: 32px 0; }
.althio-footer .inner {
  max-width: 1120px; margin: 0 auto; padding: 0 28px;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
  font-size: 14px; color: var(--ink-soft);
}
.althio-footer .links { display: flex; flex-wrap: wrap; gap: 20px; }
.althio-footer .links a {
  color: var(--ink-soft); text-decoration: none;
  transition: color .2s ease;
}
.althio-footer .links a:hover { color: var(--ink); }

@media (prefers-reduced-motion: reduce) {
  .althio-footer .links a { transition: none; }
}
@media (max-width: 1199px) {
  .althio-footer .inner { padding: 0 24px; }
  .althio-footer .links { gap: 18px; }
}
@media (max-width: 809px) {
  /* Stacked and left-aligned: the two halves read as one column, not a
     stretched row with a gap down the middle. */
  .althio-footer footer { padding: 26px 0; }
  .althio-footer .inner {
    padding: 0 20px;
    flex-direction: column; align-items: flex-start; gap: 16px;
    font-size: 13.5px;
  }
  .althio-footer .links { gap: 16px 20px; }
}
/* Clears the phone browser chrome that overlaps the bottom of the page. */
@media (max-width: 720px) {
  .althio-footer footer { padding-bottom: 92px; }
}

/* One desktop rendering: fractions of a 1440px reference. */
@media (min-width: 1200px) {
  .althio-footer footer { padding: 2.222vw 0; }
  .althio-footer .inner {
    max-width: 77.778vw;
    padding: 0 1.944vw;
    gap: 0.833vw;
    font-size: 0.972vw;
  }
  .althio-footer .links { gap: 1.389vw; }
}
`

interface FooterLink {
    label: string
    link: string
}

interface AlthioFooterProps {
    copyright: string
    links: FooterLink[]
    style?: CSSProperties
}

/**
 * Althio Footer
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioFooter(props: AlthioFooterProps) {
    const { copyright, links } = props

    return (
        <div className="althio-footer" style={props.style}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <footer>
                <div className="inner">
                    <span>{copyright}</span>
                    <span className="links">
                        {links.map((item, index) => (
                            <a href={item.link} key={index}>
                                {item.label}
                            </a>
                        ))}
                    </span>
                </div>
            </footer>
        </div>
    )
}

addPropertyControls(AlthioFooter, {
    copyright: {
        type: ControlType.String,
        title: "Copyright",
        defaultValue: "© 2026 Althio, Inc.",
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Link" },
                link: {
                    type: ControlType.String,
                    defaultValue: "/",
                    description:
                        "Path, anchor, or URL — for example /safety or /#how.",
                },
            },
        },
        defaultValue: [
            { label: "Safety", link: "/safety" },
            { label: "Research", link: "/research" },
            { label: "Journal", link: "/blog" },
            { label: "Contact", link: "/demo" },
        ],
    },
})
