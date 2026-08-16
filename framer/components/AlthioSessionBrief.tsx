import { addPropertyControls, ControlType } from "framer"
import type { CSSProperties } from "react"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:600;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Semibold.woff2") format("woff2")}

.althio-brief {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
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
  padding: 40px 0 110px;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  scroll-margin-top: 90px;
  -webkit-font-smoothing: antialiased;
}
.althio-brief *, .althio-brief *::before, .althio-brief *::after { margin: 0; padding: 0; box-sizing: border-box; }
.althio-brief .wrap { max-width: 1120px; margin: 0 auto; padding: 0 28px; }
.althio-brief .split {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.althio-brief .card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 26px 28px;
  box-shadow: 0 24px 60px -36px rgba(35, 32, 28, 0.3);
  transition: transform .45s cubic-bezier(.22,.9,.3,1), box-shadow .45s cubic-bezier(.22,.9,.3,1);
}
.althio-brief .card:hover {
  transform: translateY(-4px);
  box-shadow: 0 32px 70px -32px rgba(35, 32, 28, 0.38);
}
.althio-brief .card header {
  display: flex; justify-content: space-between; align-items: baseline;
  border-bottom: 1px solid var(--line);
  padding-bottom: 14px; margin-bottom: 6px;
  gap: 12px;
}
.althio-brief .card header .t { font-family: var(--display); font-size: 19px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.althio-brief .live {
  width: 8px; height: 8px; border-radius: 50%;
  background: #7A9ED0;
  box-shadow: 0 0 0 0 rgba(122, 158, 208, 0.5);
  animation: althio-live 2s ease-out infinite;
  flex-shrink: 0;
}
.althio-brief .card header .d { font-size: 13px; color: var(--ink-soft); }

.althio-brief .row {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 13px 0; border-bottom: 1px solid var(--line);
}
.althio-brief .row .k { font-size: 14.5px; }
.althio-brief .row .k small { display: block; color: var(--ink-soft); font-size: 12.5px; }
.althio-brief .row svg { flex-shrink: 0; }
.althio-brief .row polyline {
  stroke-dasharray: 180;
  stroke-dashoffset: 180;
  animation: althio-draw 1.4s cubic-bezier(.22,.61,.36,1) forwards;
}
.althio-brief .row:nth-child(3) polyline { animation-delay: 0.18s; }

.althio-brief .chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 0 4px; }
.althio-brief .chip {
  font-size: 13px; padding: 5px 12px; border-radius: 999px;
  background: var(--skyblue); color: var(--ink);
}
.althio-brief .chip.pink { background: var(--pink); }
.althio-brief .chip.lav { background: var(--lav); }
.althio-brief .consent {
  margin-top: 14px; font-size: 12.5px; color: var(--ink-soft);
  display: flex; align-items: center; gap: 6px;
}

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
.althio-brief .copy ul { margin-top: 20px; list-style: none; }
.althio-brief .copy li {
  position: relative;
  padding: 10px 0 10px 26px;
  color: var(--ink-soft); font-size: 16px;
}
.althio-brief .copy li::before { content: "—"; position: absolute; left: 0; color: var(--blue); }

@keyframes althio-live {
  0% { box-shadow: 0 0 0 0 rgba(122, 158, 208, 0.45); }
  70% { box-shadow: 0 0 0 8px rgba(122, 158, 208, 0); }
  100% { box-shadow: 0 0 0 0 rgba(122, 158, 208, 0); }
}
@keyframes althio-draw {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .althio-brief .live, .althio-brief .row polyline, .althio-brief .card { animation: none; transform: none; }
  .althio-brief .row polyline { stroke-dashoffset: 0; }
}

@media (max-width: 1199px) {
  .althio-brief { padding: 32px 0 88px; }
  .althio-brief .wrap { padding: 0 24px; }
  .althio-brief .split { grid-template-columns: 1fr; gap: 36px; }
  .althio-brief .copy { order: -1; }
  .althio-brief .copy ul { columns: 2; column-gap: 32px; margin-top: 16px; }
  .althio-brief .copy li { break-inside: avoid; }
  .althio-brief .card { max-width: 620px; }
}

@media (max-width: 809px) {
  .althio-brief { padding: 24px 0 64px; }
  .althio-brief .wrap { padding: 0 20px; }
  .althio-brief .split { gap: 28px; }
  .althio-brief .copy ul { columns: 1; }
  .althio-brief .copy li { font-size: 15.5px; padding: 8px 0 8px 22px; }
  .althio-brief .card { padding: 22px 20px; border-radius: 20px; }
  .althio-brief .card:hover { transform: none; }
  .althio-brief .card header { flex-direction: column; gap: 2px; }
  .althio-brief .row { gap: 10px; }
  .althio-brief .row .k { font-size: 14px; min-width: 0; flex: 1; }
  .althio-brief .row svg { width: 92px; }
}

@media (min-width: 1200px) {
  .althio-brief { padding: 2.778vw 0 7.639vw; font-size: 1.181vw; }
  .althio-brief .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-brief .split { gap: 5vw; }
  .althio-brief .card { padding: 1.806vw 1.944vw; border-radius: 1.667vw; }
  .althio-brief .card header { padding-bottom: 0.972vw; margin-bottom: 0.417vw; }
  .althio-brief .card header .t { font-size: 1.319vw; }
  .althio-brief .card header .d { font-size: 0.903vw; }
  .althio-brief .live { width: 0.556vw; height: 0.556vw; }
  .althio-brief .row { padding: 0.903vw 0; gap: 0.972vw; }
  .althio-brief .row .k { font-size: 1.007vw; }
  .althio-brief .row .k small { font-size: 0.868vw; }
  .althio-brief .row svg { width: 8.333vw; height: 2.083vw; }
  .althio-brief .chips { gap: 0.556vw; padding: 1.111vw 0 0.278vw; }
  .althio-brief .chip { font-size: 0.903vw; padding: 0.347vw 0.833vw; }
  .althio-brief .consent { margin-top: 0.972vw; font-size: 0.868vw; gap: 0.417vw; }
  .althio-brief .eyebrow { font-size: 0.868vw; margin-bottom: 1.25vw; }
  .althio-brief h2 { font-size: 3.056vw; }
  .althio-brief .copy ul { margin-top: 1.389vw; }
  .althio-brief .copy li { padding: 0.694vw 0 0.694vw 1.806vw; font-size: 1.111vw; }
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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioSessionBrief(props: AlthioSessionBriefProps) {
    const {
        anchorId,
        patient,
        appointment,
        signals,
        chips,
        consent,
        eyebrow,
        heading,
        points,
    } = props

    return (
        <section
            className="althio-brief"
            id={anchorId || undefined}
            style={props.style}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="wrap">
                <div className="split">
                    <div className="card">
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
                    <div className="copy">
                        <p className="eyebrow">{eyebrow}</p>
                        <h2>{heading}</h2>
                        <ul>
                            {points.map((point, index) => (
                                <li key={index}>{point.text}</li>
                            ))}
                        </ul>
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
