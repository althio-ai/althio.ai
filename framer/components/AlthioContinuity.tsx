import { addPropertyControls, ControlType } from "framer"
import type { CSSProperties } from "react"

const SKY_3AM =
    "https://framerusercontent.com/images/oVUsSNnxV8GbbChzWsOAN26pOU.jpg"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}

.althio-continuity {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --skyblue: #D9E7F6;
  --pink: #F6E0D8;
  --lav: #E5E3F2;
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  padding: 110px 0;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  scroll-margin-top: 90px;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}
.althio-continuity *, .althio-continuity *::before, .althio-continuity *::after { margin: 0; padding: 0; box-sizing: border-box; }
.althio-continuity .wrap { max-width: 1120px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }

.althio-continuity .split {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}
.althio-continuity .eyebrow {
  font-size: 12.5px; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-soft); margin-bottom: 18px;
}
.althio-continuity h2 {
  font-family: var(--display);
  font-size: clamp(30px, 4.2vw, 44px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.15;
  text-wrap: balance;
}
.althio-continuity .copy p.body { margin-top: 20px; color: var(--ink-soft); max-width: 48ch; }

.althio-continuity .week {
  margin-top: 44px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 10px;
}
.althio-continuity .week .slot { display: flex; justify-content: center; align-items: flex-end; height: 34px; }
.althio-continuity .week .session {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink);
  white-space: nowrap;
}
.althio-continuity .week .session::after {
  content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--ink);
  box-shadow: 0 0 0 0 rgba(35, 32, 28, 0.28);
  animation: althio-pulse 2.4s ease-out infinite;
}
.althio-continuity .week .band {
  grid-column: 1 / -1;
  height: 14px; border-radius: 999px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, var(--skyblue), var(--lav), var(--pink), var(--skyblue));
  background-size: 200% 100%;
  animation: althio-drift 12s linear infinite;
}
.althio-continuity .week .band::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
  transform: translateX(-60%);
  animation: althio-sheen 4.8s ease-in-out infinite;
}
.althio-continuity .week .bandlabel {
  grid-column: 1 / -1; text-align: center;
  font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-soft);
  margin-top: 2px;
}
.althio-continuity .week .day { text-align: center; font-size: 12.5px; color: var(--ink-soft); }
.althio-continuity .week .day.on { color: var(--ink); font-weight: 600; }

.althio-continuity .nightcard {
  position: relative; border-radius: 28px; overflow: hidden;
  min-height: 460px;
  box-shadow: 0 30px 80px -40px rgba(35, 32, 28, 0.45);
  display: flex; align-items: flex-end;
}
.althio-continuity .nightcard .sky {
  position: absolute; inset: -8%;
  background: url("${SKY_3AM}") center / cover no-repeat;
  animation: althio-ken 28s ease-in-out infinite alternate;
}
.althio-continuity .nightcard figcaption {
  position: relative;
  width: 100%;
  padding: 22px 24px;
  color: #E8ECF6;
  font-family: var(--display); font-size: 19px;
  background: linear-gradient(transparent, rgba(10, 12, 24, 0.65));
}

@keyframes althio-pulse {
  0% { box-shadow: 0 0 0 0 rgba(35, 32, 28, 0.28); }
  70% { box-shadow: 0 0 0 10px rgba(35, 32, 28, 0); }
  100% { box-shadow: 0 0 0 0 rgba(35, 32, 28, 0); }
}
@keyframes althio-drift {
  from { background-position: 0% 50%; }
  to { background-position: 200% 50%; }
}
@keyframes althio-sheen {
  0%, 30% { transform: translateX(-70%); }
  70%, 100% { transform: translateX(70%); }
}
@keyframes althio-ken {
  from { transform: scale(1.02) translateY(0); }
  to { transform: scale(1.08) translateY(-2%); }
}

@media (prefers-reduced-motion: reduce) {
  .althio-continuity .week .session::after,
  .althio-continuity .week .band,
  .althio-continuity .week .band::after,
  .althio-continuity .nightcard .sky { animation: none; }
}

@media (max-width: 1199px) {
  .althio-continuity { padding: 88px 0; }
  .althio-continuity .wrap { padding: 0 24px; }
  .althio-continuity .split { grid-template-columns: 1.25fr 0.75fr; gap: 32px; }
  .althio-continuity .copy p.body { max-width: none; }
  .althio-continuity .nightcard { min-height: 400px; border-radius: 24px; }
  .althio-continuity .nightcard figcaption { padding: 18px 20px; font-size: 17px; }
  .althio-continuity .week { margin-top: 36px; }
  .althio-continuity .week .session { font-size: 10px; letter-spacing: 0.05em; }
  .althio-continuity .week .day { font-size: 11.5px; }
}

@media (max-width: 809px) {
  .althio-continuity { padding: 64px 0; }
  .althio-continuity .wrap { padding: 0 20px; }
  .althio-continuity .split { grid-template-columns: 1fr; gap: 32px; }
  .althio-continuity .nightcard { min-height: 320px; }
  .althio-continuity .week { margin-top: 30px; }
  .althio-continuity .week .session { font-size: 9px; letter-spacing: 0.02em; gap: 4px; }
  .althio-continuity .week .session::after { width: 9px; height: 9px; }
  .althio-continuity .week .band { height: 12px; }
  .althio-continuity .week .day { font-size: 10.5px; }
  .althio-continuity .week .bandlabel { font-size: 11px; }
}

@media (min-width: 1200px) {
  .althio-continuity { padding: 7.639vw 0; font-size: 1.181vw; }
  .althio-continuity .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-continuity .split { gap: 5vw; }
  .althio-continuity .eyebrow { font-size: 0.868vw; margin-bottom: 1.25vw; }
  .althio-continuity h2 { font-size: 3.056vw; }
  .althio-continuity .copy p.body { margin-top: 1.389vw; }
  .althio-continuity .week { margin-top: 3.056vw; row-gap: 0.694vw; }
  .althio-continuity .week .slot { height: 2.361vw; }
  .althio-continuity .week .session { font-size: 0.764vw; gap: 0.347vw; }
  .althio-continuity .week .session::after { width: 0.694vw; height: 0.694vw; }
  .althio-continuity .week .band { height: 0.972vw; }
  .althio-continuity .week .bandlabel { font-size: 0.833vw; }
  .althio-continuity .week .day { font-size: 0.868vw; }
  .althio-continuity .nightcard { min-height: 31.944vw; border-radius: 1.944vw; }
  .althio-continuity .nightcard figcaption {
    padding: 1.528vw 1.667vw;
    font-size: 1.319vw;
  }
}
`

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface AlthioContinuityProps {
    eyebrow: string
    heading: string
    body: string
    sessionDay: number
    sessionLabel: string
    bandLabel: string
    nightCaption: string
    style?: CSSProperties
}

/**
 * Althio Continuity
 *
 * The week strip: a single therapy session against seven days of life.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioContinuity(props: AlthioContinuityProps) {
    const {
        eyebrow,
        heading,
        body,
        sessionDay,
        sessionLabel,
        bandLabel,
        nightCaption,
    } = props

    return (
        <section className="althio-continuity" style={props.style}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="wrap">
                <div className="split">
                    <div className="copy">
                        <p className="eyebrow">{eyebrow}</p>
                        <h2>{heading}</h2>
                        <p className="body">{body}</p>
                        <div
                            className="week"
                            aria-label={`A week: one therapy session, Althio present every day`}
                        >
                            {DAYS.map((day, index) => (
                                <div className="slot" key={day}>
                                    {index === sessionDay ? (
                                        <span className="session">{sessionLabel}</span>
                                    ) : null}
                                </div>
                            ))}
                            <div className="band" aria-hidden="true" />
                            <p className="bandlabel">{bandLabel}</p>
                            {DAYS.map((day, index) => (
                                <span className={`day${index === sessionDay ? " on" : ""}`} key={day}>
                                    {day}
                                </span>
                            ))}
                        </div>
                    </div>
                    <figure className="nightcard">
                        <div className="sky" aria-hidden="true" />
                        <figcaption>{nightCaption}</figcaption>
                    </figure>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(AlthioContinuity, {
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "Continuity",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "One hour of therapy. 167 hours of life.",
        displayTextArea: true,
    },
    body: {
        type: ControlType.String,
        title: "Body",
        defaultValue:
            "Progress is made in session and lost in the gap. Althio keeps a gentle thread through the whole week — practice, check-ins, and a steady presence that remembers what Tuesday's session was about.",
        displayTextArea: true,
    },
    sessionDay: {
        type: ControlType.Number,
        title: "Session Day",
        defaultValue: 2,
        min: 0,
        max: 6,
        step: 1,
        displayStepper: true,
        description: "0 is Monday.",
    },
    sessionLabel: {
        type: ControlType.String,
        title: "Session",
        defaultValue: "Session",
    },
    bandLabel: {
        type: ControlType.String,
        title: "Band",
        defaultValue: "Althio, all week",
    },
    nightCaption: {
        type: ControlType.String,
        title: "Night Card",
        defaultValue:
            "3 am counts too. Althio answers — and knows when to wake a human.",
        displayTextArea: true,
    },
})
