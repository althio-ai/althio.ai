import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:600;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Semibold.woff2") format("woff2")}

.althio-brief {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --ink-faint: rgba(35, 32, 28, 0.34);
  --card: #FFFFFF;
  --skyblue: #D9E7F6;
  --pink: #F6E0D8;
  --lav: #E5E3F2;
  --blue: #7A9ED0;
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
.althio-brief *, .althio-brief *::before, .althio-brief *::after { margin: 0; padding: 0; box-sizing: border-box; }
.althio-brief .wrap { max-width: 1120px; margin: 0 auto; padding: 0 28px; }
.althio-brief .split {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(28px, 5vw, 80px);
  align-items: center;
}

/* Morning light behind the document. */
.althio-brief .wash {
  position: absolute;
  inset: 10% 50% 10% -6%;
  pointer-events: none;
  background:
    radial-gradient(50% 55% at 35% 40%, rgba(217, 231, 246, 0.5), transparent 72%),
    radial-gradient(44% 50% at 20% 75%, rgba(246, 224, 216, 0.36), transparent 74%);
  filter: blur(10px);
}

/* ------------------------------------------------------------ document
   The brief as a physical object: a sheet on the desk, a second page
   behind it, tilting a degree or two toward the reader's pointer. */
.althio-brief .deck { position: relative; perspective: 1100px; }
.althio-brief .sheet-under {
  position: absolute; inset: 10px -8px -10px 8px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(35, 32, 28, 0.08);
  border-radius: 24px;
  transform: rotate(1.1deg);
}
.althio-brief .card {
  position: relative;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 28px 30px 24px;
  box-shadow:
    0 1px 2px rgba(35, 32, 28, 0.06),
    0 24px 60px -36px rgba(35, 32, 28, 0.32);
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .5s cubic-bezier(.22,.9,.3,1), box-shadow .5s cubic-bezier(.22,.9,.3,1);
  will-change: transform;
}
.althio-brief .deck:hover .card {
  box-shadow:
    0 1px 2px rgba(35, 32, 28, 0.06),
    0 34px 80px -36px rgba(35, 32, 28, 0.4);
}
.althio-brief .doclabel {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10.5px; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 16px;
}
.althio-brief .card header {
  display: flex; justify-content: space-between; align-items: baseline;
  border-bottom: 1px solid var(--line);
  padding-bottom: 14px; margin-bottom: 6px;
  gap: 12px;
}
.althio-brief .card header .t { font-family: var(--display); font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 9px; }
.althio-brief .live {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--blue);
  box-shadow: 0 0 0 0 rgba(122, 158, 208, 0.5);
  animation: althio-live 2s ease-out infinite;
  flex-shrink: 0;
}
.althio-brief .card header .d { font-size: 13px; color: var(--ink-soft); white-space: nowrap; }

.althio-brief .row {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 14px 0; border-bottom: 1px solid var(--line);
}
.althio-brief .row .k { font-size: 14.5px; font-weight: 500; }
.althio-brief .row .k small { display: block; color: var(--ink-soft); font-size: 12.5px; font-weight: 400; }
.althio-brief .row svg { flex-shrink: 0; }
/* The sparklines draw themselves when the section arrives. */
.althio-brief .row polyline {
  stroke-dasharray: 180;
  stroke-dashoffset: 180;
}
.althio-brief.play.in .row polyline {
  animation: althio-draw 1.6s cubic-bezier(.22,.61,.36,1) forwards;
  animation-delay: calc(0.5s + var(--i, 0) * 0.25s);
}
.althio-brief:not(.play) .row polyline { stroke-dashoffset: 0; }

.althio-brief .chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 0 4px; }
.althio-brief .chip {
  font-size: 13px; padding: 5px 12px; border-radius: 999px;
  background: var(--skyblue); color: var(--ink);
}
.althio-brief .chip.pink { background: var(--pink); }
.althio-brief .chip.lav { background: var(--lav); }
.althio-brief .consent {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px dashed rgba(35, 32, 28, 0.16);
  font-size: 12.5px; color: var(--ink-soft);
  display: flex; align-items: center; gap: 6px;
}

/* ----------------------------------------------------------------- copy */
.althio-brief .eyebrow {
  font-size: 12.5px; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-soft); margin-bottom: 18px;
}
.althio-brief h2 {
  font-family: var(--display);
  font-size: clamp(30px, 4.2vw, 44px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.15;
  text-wrap: balance;
}
/* Numbered footnotes, not bullets. */
.althio-brief .copy ol { margin-top: 26px; list-style: none; counter-reset: brief; }
.althio-brief .copy li {
  counter-increment: brief;
  position: relative;
  padding: 14px 0 14px 44px;
  color: var(--ink-soft); font-size: 16px;
  border-top: 1px solid var(--line);
}
.althio-brief .copy li:first-child { border-top: none; }
.althio-brief .copy li::before {
  content: "(" counter(brief) ")";
  position: absolute; left: 0; top: 15px;
  font-family: var(--display);
  font-size: 14px;
  color: var(--ink-faint);
  letter-spacing: 0.04em;
}

/* Reveal machinery: pre-states only while playing. */
.althio-brief.play .rv {
  opacity: 0;
  transform: translateY(16px);
  filter: blur(6px);
  transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1), filter .8s cubic-bezier(.22,.61,.36,1);
  transition-delay: calc(var(--i, 0) * 120ms);
}
.althio-brief.play.in .rv { opacity: 1; transform: none; filter: blur(0); }

@keyframes althio-live {
  0% { box-shadow: 0 0 0 0 rgba(122, 158, 208, 0.45); }
  70% { box-shadow: 0 0 0 8px rgba(122, 158, 208, 0); }
  100% { box-shadow: 0 0 0 0 rgba(122, 158, 208, 0); }
}
@keyframes althio-draw {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .althio-brief .live { animation: none; }
  .althio-brief .row polyline { stroke-dashoffset: 0; animation: none; }
  .althio-brief.play.in .row polyline { animation: none; }
  .althio-brief.play .rv { opacity: 1; transform: none; filter: none; transition: none; }
  .althio-brief .card { transform: none; transition: none; }
}

@media (max-width: 1199px) {
  .althio-brief { padding: 96px 0 88px; }
  .althio-brief .wrap { padding: 0 24px; }
  .althio-brief .split { grid-template-columns: 1fr; gap: 40px; }
  .althio-brief .copy { order: -1; }
  .althio-brief .copy ol { margin-top: 18px; }
  .althio-brief .deck { max-width: 620px; }
  .althio-brief .wash { inset: 30% 20% 5% -6%; }
}

@media (max-width: 809px) {
  .althio-brief { padding: 70px 0 64px; }
  .althio-brief .wrap { padding: 0 20px; }
  .althio-brief .split { gap: 30px; }
  .althio-brief .copy li { font-size: 15.5px; padding: 12px 0 12px 38px; }
  .althio-brief .card { padding: 22px 20px 18px; border-radius: 20px; }
  .althio-brief .sheet-under { border-radius: 20px; inset: 8px -6px -8px 6px; }
  .althio-brief .card header { flex-direction: column; gap: 2px; }
  .althio-brief .card header .d { white-space: normal; }
  .althio-brief .row { gap: 10px; }
  .althio-brief .row .k { font-size: 14px; min-width: 0; flex: 1; }
  .althio-brief .row svg { width: 92px; }
}

/* One desktop rendering: fractions of a 1440px reference. */
@media (min-width: 1200px) {
  .althio-brief { padding: 8.333vw 0 7.639vw; font-size: 1.181vw; }
  .althio-brief .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-brief .split { gap: 5.556vw; }
  .althio-brief .sheet-under { inset: 0.694vw -0.556vw -0.694vw 0.556vw; border-radius: 1.667vw; }
  .althio-brief .card { padding: 1.944vw 2.083vw 1.667vw; border-radius: 1.667vw; }
  .althio-brief .doclabel { font-size: 0.729vw; margin-bottom: 1.111vw; }
  .althio-brief .card header { padding-bottom: 0.972vw; margin-bottom: 0.417vw; }
  .althio-brief .card header .t { font-size: 1.389vw; gap: 0.625vw; }
  .althio-brief .card header .d { font-size: 0.903vw; }
  .althio-brief .live { width: 0.556vw; height: 0.556vw; }
  .althio-brief .row { padding: 0.972vw 0; gap: 0.972vw; }
  .althio-brief .row .k { font-size: 1.007vw; }
  .althio-brief .row .k small { font-size: 0.868vw; }
  .althio-brief .row svg { width: 8.333vw; height: 2.083vw; }
  .althio-brief .chips { gap: 0.556vw; padding: 1.111vw 0 0.278vw; }
  .althio-brief .chip { font-size: 0.903vw; padding: 0.347vw 0.833vw; }
  .althio-brief .consent { margin-top: 0.972vw; padding-top: 0.833vw; font-size: 0.868vw; gap: 0.417vw; }
  .althio-brief .eyebrow { font-size: 0.868vw; margin-bottom: 1.25vw; }
  .althio-brief h2 { font-size: 3.056vw; }
  .althio-brief .copy ol { margin-top: 1.806vw; }
  .althio-brief .copy li { padding: 0.972vw 0 0.972vw 3.056vw; font-size: 1.111vw; }
  .althio-brief .copy li::before { top: 1.042vw; font-size: 0.972vw; }
}
`

interface Signal {
    label: string
    note: string
    points: string
    color: string
}

interface Chip {
    label: string
    tone: "blue" | "pink" | "lav"
}

function toPolyline(points: string): string {
    const values = points
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value))
    if (values.length < 2) return ""
    const step = 120 / (values.length - 1)
    return values
        .map((value, index) => {
            const y = 27 - Math.min(1, Math.max(0, value)) * 24
            return `${(index * step).toFixed(1)},${y.toFixed(1)}`
        })
        .join(" ")
}

interface AlthioSessionBriefProps {
    anchorId: string
    docLabel: string
    patient: string
    appointment: string
    signals: Signal[]
    chips: Chip[]
    consent: string
    eyebrow: string
    heading: string
    points: { text: string }[]
    style?: CSSProperties
}

/**
 * Althio Session Brief
 *
 * The payoff artifact: the morning brief as a physical document. It tilts
 * a degree toward the pointer, and its sparklines draw themselves in.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioSessionBrief(props: AlthioSessionBriefProps) {
    const {
        anchorId,
        docLabel,
        patient,
        appointment,
        signals,
        chips,
        consent,
        eyebrow,
        heading,
        points,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLElement>(null)
    const deckRef = useRef<HTMLDivElement>(null)
    const [seen, setSeen] = useState(false)

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
            { threshold: 0.25 }
        )
        observer.observe(root)
        return () => observer.disconnect()
    }, [isStatic])

    // The pointer tilt: at most ~2.2 degrees, and only for mouse pointers.
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
        const deck = deckRef.current
        if (!deck) return
        const controller = new AbortController()
        const { signal } = controller
        deck.addEventListener(
            "pointermove",
            (event) => {
                const rect = deck.getBoundingClientRect()
                const x = (event.clientX - rect.left) / rect.width - 0.5
                const y = (event.clientY - rect.top) / rect.height - 0.5
                deck.style.setProperty("--ry", `${(x * 4.4).toFixed(2)}deg`)
                deck.style.setProperty("--rx", `${(-y * 4.4).toFixed(2)}deg`)
            },
            { signal }
        )
        deck.addEventListener(
            "pointerleave",
            () => {
                deck.style.setProperty("--rx", "0deg")
                deck.style.setProperty("--ry", "0deg")
            },
            { signal }
        )
        return () => controller.abort()
    }, [isStatic])

    const cls = ["althio-brief", isStatic ? "" : "play", seen ? "in" : ""]
        .filter(Boolean)
        .join(" ")

    return (
        <section
            className={cls}
            ref={rootRef}
            id={anchorId || undefined}
            style={props.style}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="wash" aria-hidden="true" />
            <div className="wrap">
                <div className="split">
                    <div className="deck rv" ref={deckRef} style={{ "--i": 1 } as CSSProperties}>
                        <div className="sheet-under" aria-hidden="true" />
                        <div className="card">
                            <p className="doclabel">
                                <span>{docLabel}</span>
                                <span aria-hidden="true">&#9675;</span>
                            </p>
                            <header>
                                <span className="t">
                                    <span className="live" aria-hidden="true" />
                                    {patient}
                                </span>
                                <span className="d">{appointment}</span>
                            </header>
                            {signals.map((signal, index) => (
                                <div className="row" key={index}>
                                    <div className="k">
                                        {signal.label}
                                        <small>{signal.note}</small>
                                    </div>
                                    <svg
                                        width="120"
                                        height="30"
                                        viewBox="0 0 120 30"
                                        aria-hidden="true"
                                    >
                                        <polyline
                                            style={{ "--i": index } as CSSProperties}
                                            points={toPolyline(signal.points)}
                                            fill="none"
                                            stroke={signal.color}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            ))}
                            <div className="chips">
                                {chips.map((chip, index) => (
                                    <span className={`chip ${chip.tone}`} key={index}>
                                        {chip.label}
                                    </span>
                                ))}
                            </div>
                            <p className="consent">{consent}</p>
                        </div>
                    </div>
                    <div className="copy">
                        <p className="eyebrow rv" style={{ "--i": 0 } as CSSProperties}>
                            {eyebrow}
                        </p>
                        <h2 className="rv" style={{ "--i": 1 } as CSSProperties}>
                            {heading}
                        </h2>
                        <ol>
                            {points.map((point, index) => (
                                <li
                                    className="rv"
                                    key={index}
                                    style={{ "--i": index + 2 } as CSSProperties}
                                >
                                    {point.text}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(AlthioSessionBrief, {
    anchorId: {
        type: ControlType.String,
        title: "Anchor",
        defaultValue: "clinicians",
    },
    docLabel: {
        type: ControlType.String,
        title: "Doc Label",
        defaultValue: "Althio · Morning brief",
    },
    patient: {
        type: ControlType.String,
        title: "Patient",
        defaultValue: "Session brief — Sam W.",
    },
    appointment: {
        type: ControlType.String,
        title: "Appointment",
        defaultValue: "Tue 10:00 · Dr. Rhee",
    },
    signals: {
        type: ControlType.Array,
        title: "Signals",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Sleep" },
                note: { type: ControlType.String, defaultValue: "" },
                points: {
                    type: ControlType.String,
                    defaultValue: "0.8, 0.7, 0.75, 0.55, 0.4, 0.2, 0.15",
                    description: "Seven readings from 0 to 1.",
                },
                color: { type: ControlType.Color, defaultValue: "#7A9ED0" },
            },
        },
        defaultValue: [
            {
                label: "Sleep",
                note: "Declining since Thursday",
                points: "0.8, 0.72, 0.76, 0.54, 0.38, 0.14, 0.1",
                color: "#7A9ED0",
            },
            {
                label: "Mood",
                note: "Dips in evenings, steadier mornings",
                points: "0.54, 0.72, 0.38, 0.62, 0.3, 0.6, 0.42",
                color: "#D9A08F",
            },
        ],
    },
    chips: {
        type: ControlType.Array,
        title: "Tags",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "tag" },
                tone: {
                    type: ControlType.Enum,
                    options: ["blue", "pink", "lav"],
                    optionTitles: ["Blue", "Pink", "Lavender"],
                    defaultValue: "blue",
                },
            },
        },
        defaultValue: [
            { label: "work stress ×4", tone: "blue" },
            { label: "sleep", tone: "pink" },
            { label: "grounding practiced ×5", tone: "lav" },
        ],
    },
    consent: {
        type: ControlType.String,
        title: "Consent",
        defaultValue: "◠ Shared with Sam's consent · patterns, not transcripts",
        displayTextArea: true,
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "For clinicians",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Walk in with context, not a cold start.",
        displayTextArea: true,
    },
    points: {
        type: ControlType.Array,
        title: "Points",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    defaultValue: "",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                text: "The first fifteen minutes of catch-up become one minute of reading.",
            },
            {
                text: "Signals arrive as patterns over time, not raw transcripts to wade through.",
            },
            {
                text: "You set the care plan; Althio works inside it and reports back to you.",
            },
        ],
    },
})
