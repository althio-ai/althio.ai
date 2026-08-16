import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

/* The care triad: Client, Clinician, and Althio AI as three nodes, every
   relationship a drawn arc. Hovering a node or a line explains it in the
   panel beside the diagram. */

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:600;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Semibold.woff2") format("woff2")}

.althio-triad {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --ink-faint: rgba(35, 32, 28, 0.34);
  --line: rgba(35, 32, 28, 0.12);
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  padding: 120px 0 110px;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  scroll-margin-top: 90px;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}
.althio-triad *, .althio-triad *::before, .althio-triad *::after { margin: 0; padding: 0; box-sizing: border-box; }
.althio-triad .wrap { max-width: 1120px; margin: 0 auto; padding: 0 28px; }
.althio-triad .split {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

/* ------------------------------------------------------------- diagram */
.althio-triad .diagram { position: relative; }
.althio-triad svg { display: block; width: 100%; height: auto; overflow: visible; }

.althio-triad .edge {
  fill: none;
  stroke-width: 2;
  transition: opacity .35s ease, stroke-width .35s ease;
}
.althio-triad .hit {
  fill: none;
  stroke: transparent;
  stroke-width: 26;
  pointer-events: stroke;
  cursor: pointer;
}
.althio-triad .node circle {
  fill: #FFFFFF;
  stroke: rgba(35, 32, 28, 0.55);
  stroke-width: 1.2;
  transition: opacity .35s ease, stroke .35s ease;
  cursor: pointer;
}
.althio-triad .node text {
  font-family: var(--sans);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  fill: var(--ink-soft);
  text-anchor: middle;
  text-transform: uppercase;
  transition: fill .35s ease;
  pointer-events: none;
}
.althio-triad .dim { opacity: 0.14; }
.althio-triad .lit.edge { stroke-width: 2.5; }
.althio-triad .node.lit circle { stroke: var(--ink); }
.althio-triad .node.lit text { fill: var(--ink); }
.althio-triad .flow { pointer-events: none; }

/* The arcs draw themselves in when the section arrives. */
.althio-triad.play .edge {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.althio-triad.play.in .edge {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1), opacity .35s ease, stroke-width .35s ease;
  transition-delay: calc(var(--i, 0) * 90ms), 0ms, 0ms;
}
.althio-triad.play .marks { opacity: 0; }
.althio-triad.play.in .marks { opacity: 1; transition: opacity .6s ease 1s; }

/* --------------------------------------------------------------- panel */
.althio-triad .panel { position: relative; }
.althio-triad .eyebrow {
  display: flex; align-items: center; gap: 9px;
  font-size: 12.5px; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-soft); margin-bottom: 18px;
}
.althio-triad .eyebrow .swatch {
  display: block;
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--sw, var(--ink-faint));
}
.althio-triad h2, .althio-triad .panel h3 {
  font-family: var(--display);
  font-size: clamp(28px, 3.8vw, 40px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.15;
  text-wrap: balance;
}
.althio-triad .panel .body {
  margin-top: 16px;
  color: var(--ink-soft);
  max-width: 44ch;
}
.althio-triad .panel .view { animation: althio-triad-in .45s cubic-bezier(.22,.61,.36,1) both; }
@keyframes althio-triad-in {
  from { opacity: 0; transform: translateY(8px); filter: blur(5px); }
  to { opacity: 1; transform: none; filter: blur(0); }
}

/* Legend rows double as the touch-friendly way in. */
.althio-triad .legend {
  margin-top: 30px;
  border-top: 1px solid var(--line);
  list-style: none;
}
.althio-triad .legend button {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  background: none; border: 0;
  border-bottom: 1px solid var(--line);
  padding: 10px 2px;
  font-family: var(--sans); font-size: 13.5px;
  color: var(--ink-soft);
  text-align: left;
  cursor: pointer;
  transition: color .25s ease, padding-left .3s cubic-bezier(.22,.9,.3,1);
}
.althio-triad .legend button:hover, .althio-triad .legend button.on {
  color: var(--ink);
  padding-left: 8px;
}
.althio-triad .legend button:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.althio-triad .legend .dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}

/* Reveal machinery, same grammar as the neighbouring sections. */
.althio-triad.play .rv {
  opacity: 0;
  transform: translateY(16px);
  filter: blur(6px);
  transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1), filter .8s cubic-bezier(.22,.61,.36,1);
  transition-delay: calc(var(--i, 0) * 120ms);
}
.althio-triad.play.in .rv { opacity: 1; transform: none; filter: blur(0); }

@media (prefers-reduced-motion: reduce) {
  .althio-triad.play .rv { opacity: 1; transform: none; filter: none; transition: none; }
  .althio-triad.play .edge { stroke-dasharray: none; stroke-dashoffset: 0; transition: opacity .35s ease; }
  .althio-triad.play .marks { opacity: 1; transition: none; }
  .althio-triad .panel .view { animation: none; }
  .althio-triad .legend button { transition: color .25s ease; }
  .althio-triad .flow { display: none; }
}

@media (max-width: 1199px) {
  .althio-triad { padding: 96px 0 88px; }
  .althio-triad .wrap { padding: 0 24px; }
  .althio-triad .split { grid-template-columns: 1fr; gap: 36px; }
  .althio-triad .diagram { max-width: 620px; margin: 0 auto; }
  .althio-triad .panel { min-height: 0; }
  .althio-triad .panel .body { max-width: none; }
}

@media (max-width: 809px) {
  .althio-triad { padding: 70px 0 64px; }
  .althio-triad .wrap { padding: 0 20px; }
  .althio-triad .node text { font-size: 14px; letter-spacing: 0.1em; }
}

/* One desktop rendering: fractions of a 1440px reference. */
@media (min-width: 1200px) {
  .althio-triad { padding: 8.333vw 0 7.639vw; font-size: 1.181vw; }
  .althio-triad .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-triad .split { gap: 5vw; }
  .althio-triad .eyebrow { font-size: 0.868vw; margin-bottom: 1.25vw; gap: 0.625vw; }
  .althio-triad .eyebrow .swatch { width: 0.625vw; height: 0.625vw; }
  .althio-triad h2, .althio-triad .panel h3 { font-size: 2.778vw; }
  .althio-triad .panel .body { margin-top: 1.111vw; }
  .althio-triad .panel { min-height: 17vw; }
  .althio-triad .legend { margin-top: 2.083vw; }
  .althio-triad .legend button { padding: 0.694vw 0.139vw; font-size: 0.938vw; gap: 0.694vw; }
  .althio-triad .legend button:hover, .althio-triad .legend button.on { padding-left: 0.556vw; }
  .althio-triad .legend .dot { width: 0.556vw; height: 0.556vw; }
  .althio-triad .node text { font-size: 0.833vw; }
}
`

/* Brand-muted tones for the five relationships. */
const TONE = {
    checkin: "#8FADD6",
    session: "rgba(35, 32, 28, 0.38)",
    brief: "#DFA795",
    careplan: "#C9AF7C",
    memory: "#ADA5DC",
}

type Key =
    | "default"
    | "client"
    | "clinician"
    | "althio"
    | "checkin"
    | "session"
    | "brief"
    | "careplan"
    | "memory"

const CONTENT: Record<
    Key,
    { eyebrow: string; heading: string; body: string; tone?: string }
> = {
    default: {
        eyebrow: "The care loop",
        heading: "Three of us. One loop of care.",
        body: "Client, clinician, and Althio — every line is a channel of care. Trace one to see what flows along it.",
    },
    client: {
        eyebrow: "The client",
        heading: "Supported all week.",
        body: "Checks in the moment something surfaces, practices between sessions, and is never alone at 3 am.",
    },
    clinician: {
        eyebrow: "The clinician",
        heading: "Always the author of care.",
        body: "Writes the plan, reads the brief, decides what changes. Every session starts informed.",
    },
    althio: {
        eyebrow: "Althio AI",
        heading: "The context layer between.",
        body: "Listens through the week, follows the plan, and surfaces what matters — it never diagnoses, and it is never alone with risk.",
    },
    checkin: {
        eyebrow: "Client ⇄ Althio",
        heading: "Any-hour check-ins.",
        body: "The client talks when it matters — not five days later. Althio answers, and remembers.",
        tone: TONE.checkin,
    },
    session: {
        eyebrow: "Clinician ⇄ Client",
        heading: "The hour stays human.",
        body: "Therapy is unchanged: one hour, two people. Althio never sits in the room.",
        tone: TONE.session,
    },
    brief: {
        eyebrow: "Althio → Clinician",
        heading: "The morning brief.",
        body: "Patterns, changes and flags arrive before each session — a forty-second read, not a transcript.",
        tone: TONE.brief,
    },
    careplan: {
        eyebrow: "Clinician → Althio",
        heading: "The care plan leads.",
        body: "Althio works inside the plan the clinician writes — and can be changed or paused at any point in care.",
        tone: TONE.careplan,
    },
    memory: {
        eyebrow: "Althio ⟲ Althio",
        heading: "Context that compounds.",
        body: "Each week adds to the picture: what helped, what recurred, what to watch before the next session.",
        tone: TONE.memory,
    },
}

/* Which nodes each edge touches, for the highlight logic. */
const EDGE_NODES: Record<string, Key[]> = {
    checkin: ["client", "althio"],
    session: ["client", "clinician"],
    brief: ["althio", "clinician"],
    careplan: ["clinician", "althio"],
    memory: ["althio"],
}

/* One line per relationship. Mutual channels carry a head at both ends. */
const EDGES: { key: Key; d: string; index: number; both?: boolean }[] = [
    { key: "session", d: "M 256 124 Q 158 194 148 300", index: 0, both: true },
    { key: "checkin", d: "M 346 124 Q 444 194 454 300", index: 1, both: true },
    { key: "brief", d: "M 398 340 Q 301 296 206 340", index: 2 },
    { key: "careplan", d: "M 206 382 Q 301 428 398 382", index: 3 },
    { key: "memory", d: "M 504 334 C 588 300 588 418 506 386", index: 4 },
]

const NODES: { key: Key; cx: number; cy: number; label: string }[] = [
    { key: "client", cx: 301, cy: 86, label: "Client" },
    { key: "clinician", cx: 152, cy: 358, label: "Clinician" },
    { key: "althio", cx: 452, cy: 358, label: "Althio AI" },
]

interface AlthioTriadProps {
    anchorId: string
    style?: CSSProperties
}

/**
 * Althio Triad
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioTriad(props: AlthioTriadProps) {
    const { anchorId } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLElement>(null)
    const [seen, setSeen] = useState(false)
    const [active, setActive] = useState<Key>("default")

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const root = rootRef.current
        if (!root) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setSeen(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.3 }
        )
        observer.observe(root)
        return () => observer.disconnect()
    }, [isStatic])

    const view = CONTENT[active] ?? CONTENT.default

    const isNode = ["client", "clinician", "althio"].includes(active)
    const edgeLit = (key: Key) => {
        if (active === "default") return "edge"
        const lit =
            key === active || (isNode && EDGE_NODES[key]?.includes(active))
        return lit ? "edge lit" : "edge dim"
    }
    const nodeLit = (key: Key) => {
        if (active === "default") return "node"
        const lit =
            key === active || (!isNode && EDGE_NODES[active]?.includes(key))
        return lit ? "node lit" : "node dim"
    }

    const cls = ["althio-triad", isStatic ? "" : "play", seen ? "in" : ""]
        .filter(Boolean)
        .join(" ")

    const enter = (key: Key) => () => setActive(key)
    const leave = () => setActive("default")

    const LEGEND: { key: Key; label: string }[] = [
        { key: "checkin", label: "Client ⇄ Althio — any-hour check-ins" },
        { key: "brief", label: "Althio → Clinician — the morning brief" },
        { key: "careplan", label: "Clinician → Althio — the care plan" },
        { key: "session", label: "Clinician ⇄ Client — the session itself" },
        { key: "memory", label: "Althio ⟲ — context that compounds" },
    ]

    return (
        <section
            className={cls}
            ref={rootRef}
            id={anchorId || undefined}
            style={props.style}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="wrap">
                <div className="split">
                    <div
                        className="diagram rv"
                        style={{ "--i": 0 } as CSSProperties}
                        onMouseLeave={leave}
                    >
                        <svg viewBox="60 10 540 430" role="img" aria-label="The care triad: client, clinician, and Althio AI, connected by channels of care">
                            <defs>
                                {Object.entries(TONE).map(([key, color]) => (
                                    <marker
                                        key={key}
                                        id={`triad-arw-${key}`}
                                        viewBox="0 0 10 10"
                                        refX="6.5"
                                        refY="5"
                                        markerWidth="8"
                                        markerHeight="8"
                                        orient="auto-start-reverse"
                                    >
                                        {/* An open chevron, not a filled triangle. */}
                                        <path
                                            d="M 1.5 1.8 L 7 5 L 1.5 8.2"
                                            fill="none"
                                            stroke={color}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </marker>
                                ))}
                            </defs>
                            <g className="marks">
                                {EDGES.map((edge, index) => (
                                    <path
                                        key={"e" + index}
                                        className={edgeLit(edge.key)}
                                        style={{ "--i": edge.index } as CSSProperties}
                                        d={edge.d}
                                        pathLength={1}
                                        strokeLinecap="round"
                                        stroke={TONE[edge.key as keyof typeof TONE]}
                                        markerEnd={`url(#triad-arw-${edge.key})`}
                                        markerStart={
                                            edge.both
                                                ? `url(#triad-arw-${edge.key})`
                                                : undefined
                                        }
                                    />
                                ))}
                                {/* On an active line, a small light travels it. */}
                                {!isNode && active !== "default" ? (
                                    <circle
                                        className="flow"
                                        r="3"
                                        fill={TONE[active as keyof typeof TONE]}
                                    >
                                        <animateMotion
                                            dur="2.6s"
                                            repeatCount="indefinite"
                                            path={EDGES.find((edge) => edge.key === active)?.d}
                                        />
                                    </circle>
                                ) : null}
                            </g>
                            {EDGES.map((edge, index) => (
                                <path
                                    key={"h" + index}
                                    className="hit"
                                    d={edge.d}
                                    onMouseEnter={enter(edge.key)}
                                    onClick={enter(edge.key)}
                                />
                            ))}
                            {NODES.map((node) => (
                                <g
                                    className={nodeLit(node.key)}
                                    key={node.key}
                                    onMouseEnter={enter(node.key)}
                                    onClick={enter(node.key)}
                                >
                                    <circle cx={node.cx} cy={node.cy} r="52" />
                                    <text x={node.cx} y={node.cy + 4}>{node.label}</text>
                                </g>
                            ))}
                        </svg>
                    </div>
                    <div className="panel rv" style={{ "--i": 1 } as CSSProperties}>
                        <div className="view" key={active}>
                            <p
                                className="eyebrow"
                                style={{ "--sw": view.tone ?? "rgba(35,32,28,0.3)" } as CSSProperties}
                            >
                                <span className="swatch" aria-hidden="true" />
                                {view.eyebrow}
                            </p>
                            <h3>{view.heading}</h3>
                            <p className="body">{view.body}</p>
                        </div>
                        <ul className="legend" onMouseLeave={leave}>
                            {LEGEND.map((item) => (
                                <li key={item.key}>
                                    <button
                                        type="button"
                                        className={active === item.key ? "on" : ""}
                                        onMouseEnter={enter(item.key)}
                                        onFocus={enter(item.key)}
                                        onClick={enter(item.key)}
                                    >
                                        <span
                                            className="dot"
                                            style={{ background: TONE[item.key as keyof typeof TONE] }}
                                            aria-hidden="true"
                                        />
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(AlthioTriad, {
    anchorId: {
        type: ControlType.String,
        title: "Anchor",
        defaultValue: "clinicians",
    },
})
