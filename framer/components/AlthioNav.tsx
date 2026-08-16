import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

/**
 * Framer's breakpoints, shared by every section component so the bar and the
 * page switch together: Desktop >= 1200, Tablet 810-1199, Phone <= 809.
 */
const TABLET_MAX = 1199
const PHONE_MAX = 809

/** The Althio wordmark, drawn on a 1032x280 box. */
const WORDMARK =
    "M321.426 272.095C317.286 272.335 313.486 270.205 310.246 267.755C296.966 257.695 299.326 241.995 299.376 227.125C299.386 223.125 299.366 219.125 299.356 215.125C299.236 164.125 299.396 113.125 299.386 62.125C299.376 47.795 299.326 33.455 299.366 19.125C299.386 13.315 297.936 5.475 300.426 0.244995C306.456 -0.635005 312.606 4.42501 316.276 8.79501C326.306 20.745 322.916 41.495 322.896 56.125C322.826 107.455 322.546 158.795 322.736 210.125C322.786 224.455 322.626 238.795 322.636 253.125C322.646 258.895 324.086 266.995 321.426 272.095ZM560.426 123.955C573.496 113.935 583.566 104.465 599.586 98.825C636.946 85.675 681.656 99.345 698.016 137.095C707.436 158.845 704.136 185.875 704.116 209.125C704.106 224.125 704.036 239.125 704.096 254.125C704.116 259.545 705.606 267.705 702.426 272.105C698.366 272.265 694.466 270.155 691.326 267.695C677.556 256.915 680.926 238.625 680.916 223.125C680.906 210.795 680.956 198.455 680.936 186.125C680.906 157.835 679.016 135.255 650.396 121.665C645.096 119.145 639.186 117.645 633.376 116.965C623.666 115.825 613.636 116.735 604.236 119.345C597.606 121.195 591.156 123.915 585.226 127.425C560.066 142.305 560.176 162.885 560.066 189.125C559.996 204.125 560.036 219.125 559.976 234.125C559.936 242.795 559.806 251.455 559.846 260.125C559.866 264.075 560.656 268.505 558.426 271.815C553.026 272.865 547.176 268.135 543.646 264.405C533.306 253.505 536.866 230.305 536.866 216.125C536.866 163.455 536.726 110.795 536.906 58.125C536.946 44.455 536.866 30.795 536.866 17.125C536.866 11.955 535.376 4.395 538.166 0.125C552.946 0.805 560.006 17.515 559.936 30.125C559.836 50.455 559.896 70.795 559.906 91.125C559.916 101.775 558.636 113.495 560.426 123.955ZM773.736 22.075C797.946 18.295 804.006 54.325 780.366 58.395C755.046 62.745 749.296 25.895 773.736 22.075ZM414.426 67.805C416.526 70.785 415.826 74.575 415.826 78.125C415.826 85.365 415.086 93.015 416.346 100.125C432.526 101.395 449.186 100.195 465.426 100.245C471.986 100.255 480.096 101.825 480.066 110.125C480.026 119.005 470.996 119.265 464.426 119.285C448.466 119.335 432.366 118.675 416.426 119.505C414.176 129.705 415.796 143.465 415.786 154.125C415.786 175.775 415.346 197.475 415.746 219.125C415.956 230.735 420.046 241.605 430.806 247.215C442.926 253.525 458.426 251.465 471.386 249.365C476.586 248.515 482.106 246.495 487.246 247.125C490.306 257.885 473.976 268.975 465.126 271.225C443.926 276.625 416.596 272.785 402.546 254.475C392.576 241.495 392.396 225.765 392.416 210.125C392.436 189.795 392.386 169.455 392.396 149.125C392.406 139.805 394.156 128.125 391.426 119.285C388.306 119.245 385.026 119.545 381.926 119.115C374.266 118.045 369.956 110.765 373.426 103.605C375.886 98.535 391.986 84.735 396.976 80.165C402.086 75.475 407.106 68.195 414.426 67.805ZM251.426 271.215C243.596 275.225 231.336 267.995 225.486 262.575C219.256 256.785 216.966 248.915 213.666 241.365C207.796 227.905 201.866 214.455 196.156 200.915C191.626 190.175 186.756 179.585 182.296 168.815C177.626 157.555 173.136 145.715 166.826 135.265C155.616 116.695 135.746 103.305 114.426 99.765C107.146 98.555 99.7862 98.005 92.4262 98.835C82.8662 99.925 73.7062 102.945 65.1962 107.375C57.0162 111.625 49.4162 117.665 43.5662 124.785C40.0862 129.025 37.4762 134.405 33.5862 138.125C28.6762 136.835 17.6062 130.935 14.4262 127.155C17.9062 116.905 27.7462 106.905 35.7462 99.955C67.1862 72.645 115.096 66.865 151.256 88.795C182.576 107.785 191.326 132.005 205.206 163.875C213.796 183.605 222.696 203.235 230.906 223.135C235.446 234.135 240.556 244.915 245.206 255.885C247.206 260.615 251.186 266.065 251.426 271.215ZM787.506 272.125C778.396 271.895 769.206 262.635 767.156 254.005C765.766 248.155 766.206 242.085 766.206 236.125C766.236 203.125 766.186 170.125 766.226 137.125C766.236 127.455 766.196 117.795 766.206 108.125C766.216 103.265 765.446 97.745 766.866 93.125C779.466 90.165 789.026 107.625 789.376 118.125C790.646 155.695 789.356 193.535 789.316 231.125C789.306 240.455 789.266 249.795 789.296 259.125C789.306 263.665 790.396 268.535 787.506 272.125ZM926.506 92.965C939.056 91.405 952.496 92.615 964.556 96.415C1026.08 115.785 1053.48 191.885 1011.34 243.505C1003.27 253.375 993.676 261.525 982.516 267.695C972.736 273.095 961.496 276.955 950.396 278.345C936.516 280.085 921.596 279.515 908.326 274.775C887.306 267.285 869.006 254.135 857.136 234.915C829.216 189.705 844.546 130.885 890.556 104.735C901.696 98.405 913.806 94.555 926.506 92.965ZM928.586 116.015C918.926 117.225 909.406 120.255 900.986 125.195C848.566 155.955 858.106 234.005 915.156 252.955C924.496 256.055 934.376 257.205 944.186 256.185C993.216 251.065 1023.57 198.155 1000.41 153.645C995.826 144.855 989.496 137.445 981.896 131.155C974.896 125.355 966.266 120.915 957.556 118.395C948.226 115.695 938.236 114.805 928.586 116.015ZM3.42618 155.815C10.0962 159.365 16.7562 162.915 23.4262 166.465C24.7262 172.075 23.5062 178.295 24.1162 184.125C25.2162 194.515 28.8562 205.665 34.5562 214.475C57.4762 249.875 105.636 261.855 140.616 235.805C149.156 229.445 156.566 221.245 161.686 211.905C164.066 207.555 165.746 202.585 168.426 198.495C173.266 202.945 175.306 211.955 178.076 217.985C179.016 220.015 181.016 222.645 180.666 224.965C180.196 228.095 173.576 235.945 171.356 238.535C161.596 249.865 149.636 259.215 135.786 265.035C84.2662 286.725 28.0462 261.925 6.94617 211.115C1.65617 198.405 -0.633806 183.915 0.346194 170.175C0.666194 165.755 0.67618 159.345 3.42618 155.815Z"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:600;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Semibold.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:700;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Bold.woff2") format("woff2")}

/* Site-wide, deliberately: the bar is on every page, so selecting text
   anywhere highlights in the brand sky blue instead of browser default. */
::selection { background: rgba(217, 231, 246, 0.9); color: #23201C; }

.althio-nav {
  --cream: #FBF7F0;
  --ink: #23201C;
  --card: #FFFFFF;
  --line: rgba(35, 32, 28, 0.12);
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  font-family: var(--sans);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
.althio-nav *, .althio-nav *::before, .althio-nav *::after { margin: 0; padding: 0; box-sizing: border-box; }

.althio-nav nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 20;
  border-bottom: 1px solid transparent;
  transition: background .3s, border-color .3s;
}
/* Frosted, carefully: the blur lives on a ::before layer, never on the bar
   itself — a backdrop-filter on the <nav> would make it the containing
   block for its fixed children and collapse the open menu. */
.althio-nav nav::before {
  content: "";
  position: absolute; inset: 0; z-index: -1;
  background: rgba(251, 247, 240, 0.42);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  backdrop-filter: blur(16px) saturate(1.5);
  opacity: 0;
  transition: opacity .3s;
}
.althio-nav nav.scrolled::before, .althio-nav nav.open::before { opacity: 1; }
.althio-nav nav.scrolled, .althio-nav nav.open {
  border-bottom-color: var(--line);
}
.althio-nav .inner {
  max-width: 1120px; margin: 0 auto; padding: 0 28px;
  display: flex; align-items: center; justify-content: space-between;
  height: 74px;
}
/* The wordmark stays in the display serif; everything else is Open Runde. */
.althio-nav .logo {
  display: flex; align-items: center;
  font-family: var(--display); font-size: 25px; font-weight: 700;
  letter-spacing: -0.02em; color: var(--ink); text-decoration: none;
}
/* currentColor, not the file's own fill, so the mark follows the bar's ink. */
.althio-nav .logo .mark { display: block; height: 22px; width: auto; }
.althio-nav .links { display: flex; align-items: center; gap: 28px; }
.althio-nav .menu { display: flex; align-items: center; gap: 28px; }
.althio-nav .menu a {
  color: var(--ink); text-decoration: none;
  font-size: 15px; font-weight: 500;
  transition: opacity .2s;
}
.althio-nav .menu a:hover { opacity: .6; }

.althio-nav .btn {
  position: relative;
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--ink); color: var(--cream);
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  padding: 9px 18px; border-radius: 999px;
  text-decoration: none; border: none; cursor: pointer;
  overflow: hidden; isolation: isolate;
  transition: transform .35s cubic-bezier(.22,.9,.3,1);
}
/* A slow band of light crosses the surface, like sun moving over the panel. */
.althio-nav .btn::before {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 48%, transparent 66%);
  transform: translateX(-120%);
  transition: transform .7s cubic-bezier(.3,.8,.3,1);
  z-index: -1;
}
.althio-nav .btn:hover::before { transform: translateX(120%); }
.althio-nav .btn:active { transform: scale(0.98); transition-duration: .1s; }
.althio-nav .btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

.althio-nav .toggle {
  display: none;
  background: none; border: 0; cursor: pointer;
  padding: 8px 4px; margin-left: 2px;
  flex-direction: column; gap: 4px;
  -webkit-tap-highlight-color: transparent;
}
/* Two bars, identical length and thickness, that cross into a close icon.
   Height and gap are whole pixels on purpose: at 1.5px the second bar started
   at a half-pixel offset, so the two rounded to different widths and the top
   one looked thinner. Whole numbers put both bars on the same subpixel phase,
   so they rasterise identically wherever the bar lands. */
.althio-nav .toggle span {
  display: block; width: 19px; height: 2px;
  background: var(--ink); border-radius: 2px;
  transition: transform .28s cubic-bezier(.22,.9,.3,1);
}
.althio-nav .toggle:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
/* 6px apart centre to centre, so each bar travels half of that to meet. */
.althio-nav nav.open .toggle span:nth-child(1) { transform: translateY(3px) rotate(45deg); }
.althio-nav nav.open .toggle span:nth-child(2) { transform: translateY(-3px) rotate(-45deg); }

@media (prefers-reduced-motion: reduce) {
  .althio-nav .btn, .althio-nav .btn::before,
  .althio-nav .toggle span { transition: none; }
  .althio-nav .btn:hover { transform: none; }
  .althio-nav .btn:hover::before { transform: translateX(-120%); }
}

/* Tablet keeps the full bar; it just stops shouting. */
@media (max-width: ${TABLET_MAX}px) {
  .althio-nav .inner { height: 66px; padding: 0 24px; }
  .althio-nav .logo { font-size: 23px; }
  .althio-nav .logo .mark { height: 20px; }
  .althio-nav .links { gap: 20px; }
  .althio-nav .menu { gap: 20px; }
  .althio-nav .menu a { font-size: 14px; }
}

@media (max-width: ${PHONE_MAX}px) {
  .althio-nav .inner { height: 62px; padding: 0 20px; }
  .althio-nav .logo { font-size: 22px; }
  .althio-nav .logo .mark { height: 19px; }
  .althio-nav .links { gap: 10px; }
  /* Tracks the hero's button exactly. */
  .althio-nav .btn { padding: 11px 20px; }
  .althio-nav .toggle { display: flex; }
  /* A full-screen sheet: fixed to the viewport, filling everything below the
     bar so the page behind it is gone rather than showing through. It fades
     in first; the links then blur into place one after another.
     Height comes from top/bottom rather than toggling display, which cannot
     be transitioned. */
  .althio-nav .menu {
    position: fixed; top: 62px; left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column; align-items: stretch; gap: 0;
    padding: 8px 20px calc(24px + env(safe-area-inset-bottom));
    overflow-y: auto;
    /* The sheet is its own fixed element, so a backdrop-filter directly on
       it is safe — it contains no further fixed descendants. */
    background: rgba(251, 247, 240, 0.88);
    -webkit-backdrop-filter: blur(22px) saturate(1.5);
    backdrop-filter: blur(22px) saturate(1.5);
    opacity: 0;
    visibility: hidden;
    transition: opacity .3s ease, visibility 0s linear .3s;
  }
  .althio-nav nav.open .menu {
    opacity: 1;
    visibility: visible;
    transition: opacity .3s ease, visibility 0s;
  }
  .althio-nav .menu a {
    padding: 20px 0; font-size: 20px;
    border-top: 1px solid var(--line);
    opacity: 0;
    filter: blur(7px);
    transform: translateY(7px);
    transition: opacity .4s ease, filter .4s ease, transform .4s ease;
  }
  .althio-nav .menu a:first-child { border-top: none; }
  /* --i is the link's index, set on the element, so each waits its turn. */
  .althio-nav nav.open .menu a {
    opacity: 1;
    filter: blur(0);
    transform: none;
    transition-delay: calc(260ms + var(--i, 0) * 80ms);
  }
}

/* One desktop rendering: sizes above 1200px are fractions of a 1440px
   reference, so the bar keeps its proportions on every desktop screen. */
@media (min-width: 1200px) {
  .althio-nav .inner { max-width: 77.778vw; padding: 0 1.944vw; height: 5.139vw; }
  .althio-nav .logo { font-size: 1.736vw; }
  .althio-nav .logo .mark { height: 1.528vw; }
  .althio-nav .links, .althio-nav .menu { gap: 1.944vw; }
  .althio-nav .menu a { font-size: 1.042vw; }
  .althio-nav .btn { padding: 0.625vw 1.25vw; font-size: 0.972vw; gap: 0.486vw; }
}

/* After the phone rules, so these win: the sheet appears without animating. */
@media (prefers-reduced-motion: reduce) {
  .althio-nav .menu, .althio-nav .menu a { transition: none; }
  .althio-nav .menu a { filter: none; transform: none; }
  .althio-nav nav.open .menu a { transition-delay: 0s; }
}
`

interface NavLink {
    label: string
    link: string
}

interface AlthioNavProps {
    logo: string
    /** Draw the wordmark, or set the logo text in the display serif. */
    logoMark: "wordmark" | "text"
    logoLink: string
    links: NavLink[]
    ctaLabel: string
    ctaLink: string
    /** Starts frosted even before the page scrolls, for screens that never do. */
    alwaysFrosted: boolean
    style?: CSSProperties
}

/**
 * Althio Nav
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 */
export default function AlthioNav(props: AlthioNavProps) {
    const { logo, logoMark, logoLink, links, ctaLabel, ctaLink, alwaysFrosted } =
        props

    const rootRef = useRef<HTMLDivElement>(null)
    const [scrolled, setScrolled] = useState(alwaysFrosted)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        if (alwaysFrosted) {
            setScrolled(true)
            return
        }
        const controller = new AbortController()
        const { signal } = controller
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true, signal })
        return () => controller.abort()
    }, [alwaysFrosted])

    useEffect(() => {
        if (typeof window === "undefined" || !open) return
        const controller = new AbortController()
        const { signal } = controller

        // The sheet covers the viewport, so the page behind it must not scroll.
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        signal.addEventListener("abort", () => {
            document.body.style.overflow = previousOverflow
        })

        document.addEventListener(
            "click",
            (event) => {
                const root = rootRef.current
                if (
                    root &&
                    event.target instanceof Node &&
                    !root.contains(event.target)
                ) {
                    setOpen(false)
                }
            },
            { signal }
        )
        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") setOpen(false)
            },
            { signal }
        )
        // Rotating to landscape can cross the breakpoint with the menu open.
        window.addEventListener(
            "resize",
            () => {
                if (window.innerWidth > PHONE_MAX) setOpen(false)
            },
            { signal }
        )
        return () => controller.abort()
    }, [open])

    const barClass = ["", scrolled ? "scrolled" : "", open ? "open" : ""]
        .filter(Boolean)
        .join(" ")

    return (
        <div
            className="althio-nav"
            ref={rootRef}
            style={{ position: "relative", width: "100%", height: 0, ...props.style }}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <nav className={barClass}>
                <div className="inner">
                    <a className="logo" href={logoLink} aria-label={logo}>
                        {logoMark === "text" ? (
                            logo
                        ) : (
                            <svg
                                className="mark"
                                viewBox="0 0 1032 280"
                                fill="currentColor"
                                aria-hidden="true"
                                focusable="false"
                            >
                                {/* Stroking the filled outline thickens every
                                    letter stroke by ~12 units without redrawing
                                    the glyphs; round joins keep corners soft. */}
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    stroke="currentColor"
                                    strokeWidth={12}
                                    strokeLinejoin="round"
                                    d={WORDMARK}
                                />
                            </svg>
                        )}
                    </a>
                    <div className="links">
                        <div
                            className="menu"
                            id="althio-nav-menu"
                            // Following a link should not leave the menu open behind it.
                            onClick={() => setOpen(false)}
                        >
                            {links.map((item, index) => (
                                <a
                                    href={item.link}
                                    key={index}
                                    style={{ "--i": index } as CSSProperties}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>
                        <a className="btn" href={ctaLink}>
                            {ctaLabel}
                        </a>
                        <button
                            className="toggle"
                            type="button"
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            aria-controls="althio-nav-menu"
                            onClick={() => setOpen((value) => !value)}
                        >
                            <span />
                            <span />
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    )
}

addPropertyControls(AlthioNav, {
    logoMark: {
        type: ControlType.Enum,
        title: "Logo",
        options: ["wordmark", "text"],
        optionTitles: ["Wordmark", "Text"],
        defaultValue: "wordmark",
        displaySegmentedControl: true,
    },
    logo: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "Althio",
        description: "Shown as text, and read aloud when the wordmark is used.",
    },
    logoLink: {
        type: ControlType.String,
        title: "Logo Link",
        defaultValue: "/",
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
                    description: "Path, anchor, or URL — for example /safety or /#how.",
                },
            },
        },
        defaultValue: [
            { label: "Clinicians", link: "/for-clinicians" },
            { label: "Safety", link: "/safety" },
            { label: "Research", link: "/research" },
            { label: "Journal", link: "/blog" },
        ],
    },
    ctaLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Request a demo",
    },
    ctaLink: {
        type: ControlType.String,
        title: "Button Link",
        defaultValue: "/demo",
    },
    alwaysFrosted: {
        type: ControlType.Boolean,
        title: "Frosted",
        defaultValue: false,
        description: "Keep the bar frosted on pages that never scroll.",
    },
})
