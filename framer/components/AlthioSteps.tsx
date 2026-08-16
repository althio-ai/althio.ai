import { addPropertyControls, ControlType } from "framer"
import type { CSSProperties } from "react"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:600;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Semibold.woff2") format("woff2")}

.althio-steps {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --card: #FFFFFF;
  --line: rgba(35, 32, 28, 0.12);
  --skyblue: #D9E7F6;
  --pink: #F6E0D8;
  --lav: #E5E3F2;
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  padding-top: calc(var(--pt) * 1px);
  padding-bottom: calc(var(--pb) * 1px);
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  scroll-margin-top: 90px;
  overflow: hidden;
}
.althio-steps *, .althio-steps *::before, .althio-steps *::after { margin: 0; padding: 0; box-sizing: border-box; }
.althio-steps .wrap { max-width: 1120px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }

.althio-steps .wash {
  position: absolute;
  inset: auto 8% -18% 8%;
  height: 58%;
  pointer-events: none;
  background:
    radial-gradient(42% 55% at 18% 40%, rgba(217, 231, 246, 0.55), transparent 70%),
    radial-gradient(38% 50% at 82% 55%, rgba(246, 224, 216, 0.42), transparent 72%),
    radial-gradient(50% 60% at 50% 100%, rgba(229, 227, 242, 0.4), transparent 70%);
  filter: blur(8px);
}

.althio-steps .kicker {
  display: block;
  text-align: center;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 16px;
}
.althio-steps h2 {
  font-family: var(--display);
  font-size: clamp(30px, 4.2vw, 44px);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-align: center;
  text-wrap: balance;
}
.althio-steps .lede {
  text-align: center;
  color: var(--ink-soft);
  max-width: 52ch;
  margin: 14px auto 0;
}
.althio-steps .grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 56px;
  position: relative;
}
.althio-steps .grid:not(.plain)::before {
  content: "";
  position: absolute;
  top: 52px;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(35,32,28,0.14), transparent);
  pointer-events: none;
}

.althio-steps .step {
  position: relative;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 18px 40px -32px rgba(35, 32, 28, 0.35);
  transition: transform .45s cubic-bezier(.22,.9,.3,1), box-shadow .45s cubic-bezier(.22,.9,.3,1), border-color .3s ease;
}
.althio-steps .step:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 56px -28px rgba(35, 32, 28, 0.28);
  border-color: rgba(35, 32, 28, 0.18);
}
.althio-steps .grid.plain .step {
  background: rgba(255,255,255,0.62);
  backdrop-filter: blur(10px);
}

.althio-steps .meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.althio-steps .well {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--ink);
}
.althio-steps .well svg { width: 20px; height: 20px; display: block; }
.althio-steps .well.sky { background: var(--skyblue); }
.althio-steps .well.pink { background: var(--pink); }
.althio-steps .well.lav { background: var(--lav); }

.althio-steps .marker {
  font-family: var(--display);
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}
.althio-steps .step h3 {
  font-family: var(--display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 10px;
}
.althio-steps .step p {
  color: var(--ink-soft);
  font-size: 15.5px;
}

.althio-steps .step {
  animation: althio-rise 0.7s cubic-bezier(.22,.61,.36,1) both;
}
.althio-steps .step:nth-child(2) { animation-delay: 0.08s; }
.althio-steps .step:nth-child(3) { animation-delay: 0.16s; }

@keyframes althio-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .althio-steps .step, .althio-steps .step:hover { animation: none; transform: none; }
}

@media (max-width: 1199px) {
  .althio-steps { padding-top: calc(var(--pt) * 0.8px); padding-bottom: calc(var(--pb) * 0.8px); }
  .althio-steps .wrap { padding: 0 24px; }
  .althio-steps .grid { gap: 16px; margin-top: 44px; }
  .althio-steps .grid:not(.plain)::before { display: none; }
  .althio-steps .step { padding: 26px 22px; border-radius: 20px; }
  .althio-steps .step h3 { font-size: 20px; }
  .althio-steps .step p { font-size: 15px; }
  .althio-steps .lede { max-width: 46ch; }
}

@media (max-width: 809px) {
  .althio-steps { padding-top: calc(var(--pt) * 0.62px); padding-bottom: calc(var(--pb) * 0.62px); }
  .althio-steps .wrap { padding: 0 20px; }
  .althio-steps .grid { grid-template-columns: 1fr; gap: 14px; margin-top: 34px; }
  .althio-steps .step { padding: 24px 20px; }
  .althio-steps .lede { max-width: 38ch; font-size: 16px; }
  .althio-steps .grid.plain { gap: 14px; }
  .althio-steps .step:hover { transform: none; }
}

@media (min-width: 1200px) {
  .althio-steps {
    padding-top: calc(var(--pt) * 0.0694vw);
    padding-bottom: calc(var(--pb) * 0.0694vw);
    font-size: 1.181vw;
  }
  .althio-steps .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-steps .kicker { font-size: 0.868vw; margin-bottom: 1.111vw; }
  .althio-steps h2 { font-size: 3.056vw; }
  .althio-steps .lede { margin-top: 0.972vw; }
  .althio-steps .grid { gap: 1.389vw; margin-top: 3.889vw; }
  .althio-steps .grid:not(.plain)::before { top: 3.611vw; }
  .althio-steps .step { padding: 2.222vw 1.944vw; border-radius: 1.667vw; }
  .althio-steps .meta { margin-bottom: 1.25vw; }
  .althio-steps .well { width: 3.056vw; height: 3.056vw; border-radius: 0.972vw; }
  .althio-steps .well svg { width: 1.389vw; height: 1.389vw; }
  .althio-steps .marker { font-size: 0.903vw; }
  .althio-steps .step h3 { font-size: 1.528vw; margin-bottom: 0.694vw; }
  .althio-steps .step p { font-size: 1.076vw; }
}
`

type IconName = "moon" | "ear" | "file" | "shield" | "alert" | "lock"

const TONES = ["sky", "pink", "lav"] as const

function Icon({ name }: { name: IconName }) {
    const common = {
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        viewBox: "0 0 24 24",
        "aria-hidden": true,
    }
    switch (name) {
        case "moon":
            return (
                <svg {...common}>
                    <path d="M21 14.3A8.4 8.4 0 0 1 9.7 3 7.2 7.2 0 1 0 21 14.3z" />
                </svg>
            )
        case "ear":
            return (
                <svg {...common}>
                    <path d="M6 10a6 6 0 1 1 11.2 3.1c-.7 1.3-1.2 2.2-1.2 3.9v.5a3.5 3.5 0 0 1-7 0" />
                    <path d="M9 10a3 3 0 0 1 6 0c0 1.4-.4 2.2-1.2 3.4" />
                </svg>
            )
        case "file":
            return (
                <svg {...common}>
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5" />
                    <path d="M9 13h6M9 17h4" />
                </svg>
            )
        case "shield":
            return (
                <svg {...common}>
                    <path d="M12 3 5 6v6c0 4.2 2.7 7.2 7 8.5 4.3-1.3 7-4.3 7-8.5V6z" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
            )
        case "alert":
            return (
                <svg {...common}>
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 4.7 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.7a2 2 0 0 0-3.4 0z" />
                </svg>
            )
        default:
            return (
                <svg {...common}>
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
            )
    }
}

interface StepItem {
    marker: string
    title: string
    body: string
    icon: IconName
}

interface AlthioStepsProps {
    anchorId: string
    kicker: string
    heading: string
    lede: string
    items: StepItem[]
    surface: "card" | "plain"
    paddingTop: number
    paddingBottom: number
    style?: CSSProperties
}

/**
 * Althio Steps
 *
 * A three-up explainer grid. Used for "How it works" (cards) and
 * "Safety" (plain, on the page background).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioSteps(props: AlthioStepsProps) {
    const {
        anchorId,
        kicker,
        heading,
        lede,
        items,
        surface,
        paddingTop,
        paddingBottom,
    } = props

    return (
        <section
            className="althio-steps"
            id={anchorId || undefined}
            style={
                {
                    "--pt": paddingTop,
                    "--pb": paddingBottom,
                    ...props.style,
                } as CSSProperties
            }
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="wash" aria-hidden="true" />
            <div className="wrap">
                {kicker ? <p className="kicker">{kicker}</p> : null}
                <h2>{heading}</h2>
                {lede ? <p className="lede">{lede}</p> : null}
                <div className={`grid ${surface === "plain" ? "plain" : ""}`}>
                    {items.map((item, index) => (
                        <div className="step" key={index}>
                            <div className="meta">
                                <span className={`well ${TONES[index % TONES.length]}`}>
                                    <Icon name={item.icon || (surface === "plain" ? ["shield", "alert", "lock"][index % 3] as IconName : ["moon", "ear", "file"][index % 3] as IconName)} />
                                </span>
                                <span className="marker" aria-hidden="true">
                                    {item.marker}
                                </span>
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

addPropertyControls(AlthioSteps, {
    anchorId: {
        type: ControlType.String,
        title: "Anchor",
        defaultValue: "how",
        description: "Used by in-page links such as #how.",
    },
    kicker: {
        type: ControlType.String,
        title: "Kicker",
        defaultValue: "",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Continuous care, with a human at the center.",
        displayTextArea: true,
    },
    lede: {
        type: ControlType.String,
        title: "Lede",
        defaultValue: "",
        displayTextArea: true,
    },
    surface: {
        type: ControlType.Enum,
        title: "Surface",
        options: ["card", "plain"],
        optionTitles: ["Cards", "Plain"],
        defaultValue: "card",
        displaySegmentedControl: true,
    },
    items: {
        type: ControlType.Array,
        title: "Steps",
        control: {
            type: ControlType.Object,
            controls: {
                marker: { type: ControlType.String, defaultValue: "01" },
                title: { type: ControlType.String, defaultValue: "Step" },
                body: {
                    type: ControlType.String,
                    defaultValue: "",
                    displayTextArea: true,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ["moon", "ear", "file", "shield", "alert", "lock"],
                    optionTitles: ["Moon", "Listen", "Brief", "Shield", "Alert", "Lock"],
                    defaultValue: "moon",
                },
            },
        },
        defaultValue: [
            {
                marker: "01",
                title: "Patients check in, any hour",
                body: "Between sessions, patients talk to Althio the moment something surfaces — not five days later, when the detail has faded.",
                icon: "moon",
            },
            {
                marker: "02",
                title: "Althio listens for patterns",
                body: "Sleep, mood, language, avoidance — Althio notices slow shifts that single conversations hide, and follows the care plan the clinician sets.",
                icon: "ear",
            },
            {
                marker: "03",
                title: "Clinicians get the signal",
                body: "Before each session, the therapist receives a short brief: what changed, what repeated, what needs attention first.",
                icon: "file",
            },
        ],
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Top",
        defaultValue: 110,
        min: 0,
        max: 220,
        unit: "px",
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Bottom",
        defaultValue: 40,
        min: 0,
        max: 220,
        unit: "px",
    },
})
