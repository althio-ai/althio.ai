import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

const SKY_3AM =
    "https://framerusercontent.com/images/5xaPqhUrhIYNjUEawoV6G6PTQ.png"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}

.althio-continuity {
  --night-ink: #EDF1FA;
  --night-soft: rgba(237, 241, 250, 0.68);
  --night-faint: rgba(237, 241, 250, 0.42);
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  padding: 130px 0 120px;
  color: var(--night-ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  scroll-margin-top: 90px;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  background: #0B0F1E;
}
.althio-continuity *, .althio-continuity *::before, .althio-continuity *::after { margin: 0; padding: 0; box-sizing: border-box; }

/* The night itself, drifting almost imperceptibly. */
.althio-continuity .sky {
  position: absolute; inset: -6%;
  background: url("${SKY_3AM}") center bottom / cover no-repeat;
  animation: althio-cont-ken 44s ease-in-out infinite alternate;
}
.althio-continuity .scrim {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(8, 10, 22, 0.55) 0%, rgba(8, 10, 22, 0.18) 42%, rgba(8, 10, 22, 0.58) 100%);
}

/* Two extra star fields drifting at different depths above the photograph. */
.althio-continuity .stars {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(1px 1px at 38px 62px, rgba(255,255,255,0.85), transparent 100%),
    radial-gradient(1px 1px at 176px 148px, rgba(255,255,255,0.6), transparent 100%),
    radial-gradient(1.5px 1.5px at 296px 44px, rgba(255,255,255,0.75), transparent 100%),
    radial-gradient(1px 1px at 430px 210px, rgba(255,255,255,0.55), transparent 100%),
    radial-gradient(1px 1px at 108px 300px, rgba(255,255,255,0.7), transparent 100%),
    radial-gradient(1.5px 1.5px at 372px 330px, rgba(255,255,255,0.5), transparent 100%);
  background-repeat: repeat;
  background-size: 520px 380px;
  opacity: 0.7;
  animation: althio-cont-drift 180s linear infinite;
}
.althio-continuity .stars.b {
  background-size: 840px 620px;
  opacity: 0.45;
  animation-duration: 300s;
  animation-direction: reverse;
}
@keyframes althio-cont-drift {
  from { background-position: 0 0; }
  to { background-position: 520px -380px; }
}

/* Every now and then, a meteor. */
.althio-continuity .meteor {
  position: absolute;
  top: 16%; left: 4%;
  width: 110px; height: 1.5px;
  border-radius: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9));
  opacity: 0;
  animation: althio-cont-meteor 13s linear infinite;
  animation-delay: 4s;
}
.althio-continuity .meteor.two {
  top: 8%; left: 52%;
  width: 84px;
  animation-duration: 17s;
  animation-delay: 11s;
}
@keyframes althio-cont-meteor {
  0% { transform: translate3d(0, 0, 0) rotate(18deg); opacity: 0; }
  1.2% { opacity: 0.9; }
  5.5% { transform: translate3d(34vw, 11vw, 0) rotate(18deg); opacity: 0; }
  100% { transform: translate3d(34vw, 11vw, 0) rotate(18deg); opacity: 0; }
}
/* Cream bleeds in at both edges so the band sits inside the page quietly. */
.althio-continuity .edge {
  position: absolute; left: 0; right: 0; height: 1px;
  background: rgba(237, 241, 250, 0.14);
}
.althio-continuity .edge.top { top: 0; }
.althio-continuity .edge.bottom { bottom: 0; }

.althio-continuity .wrap {
  max-width: 1120px; margin: 0 auto; padding: 0 28px;
  position: relative; z-index: 1;
  text-align: center;
}
.althio-continuity .eyebrow {
  font-size: 12.5px; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--night-faint); margin-bottom: 22px;
}
.althio-continuity h2 {
  font-family: var(--display);
  font-size: clamp(32px, 4.6vw, 52px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.12;
  text-wrap: balance;
  margin: 0 auto;
  max-width: 20ch;
}
.althio-continuity .body {
  margin: 22px auto 0;
  max-width: 52ch;
  color: var(--night-soft);
  font-size: 17px;
}

/* ------------------------------------------------------------- the week
   Seven nights. The session is one bright moment; Althio is the thread
   of small lights through every other day. */
.althio-continuity .week {
  margin: 64px auto 0;
  max-width: 760px;
  position: relative;
}
.althio-continuity .thread {
  position: absolute; left: 3%; right: 3%; top: 10px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(237, 241, 250, 0.35) 12%, rgba(237, 241, 250, 0.35) 88%, transparent);
}
/* A small light carries the thread through the week, session to Sunday. */
.althio-continuity .thread::after {
  content: "";
  position: absolute; top: -2px; left: 3%;
  width: 5px; height: 5px; border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.55);
  opacity: 0;
  animation: althio-cont-carry 8s ease-in-out infinite;
}
@keyframes althio-cont-carry {
  0% { left: 3%; opacity: 0; }
  10% { opacity: 0.9; }
  88% { opacity: 0.9; }
  100% { left: 96%; opacity: 0; }
}
.althio-continuity .days {
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.althio-continuity .day {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.althio-continuity .day .pt {
  width: 7px; height: 7px; border-radius: 50%;
  margin-top: 7px;
  background: rgba(237, 241, 250, 0.75);
  box-shadow: 0 0 8px rgba(237, 241, 250, 0.45);
  animation: althio-cont-twinkle 3.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.55s);
}
.althio-continuity .day.on .pt {
  width: 13px; height: 13px; margin-top: 4px;
  background: #FFFFFF;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.14), 0 0 18px rgba(255, 255, 255, 0.65);
  animation: none;
}
.althio-continuity .day .lb {
  font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--night-faint);
}
.althio-continuity .day.on .lb { color: var(--night-ink); }
.althio-continuity .day .tag {
  font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--night-soft);
  margin-top: -8px;
}
.althio-continuity .bandlabel {
  margin-top: 26px;
  font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--night-faint);
}

/* The 3 am line: the reason this band is dark. */
.althio-continuity .caption {
  margin: 58px auto 0;
  font-family: var(--display);
  font-style: italic;
  font-size: clamp(19px, 2vw, 24px);
  line-height: 1.4;
  color: var(--night-ink);
  max-width: 34ch;
  text-wrap: balance;
}

/* Reveal: pre-states only under .play, so exports stay visible. */
.althio-continuity.play .rv {
  opacity: 0;
  transform: translateY(14px);
  filter: blur(6px);
  transition: opacity .9s cubic-bezier(.22,.61,.36,1), transform .9s cubic-bezier(.22,.61,.36,1), filter .9s cubic-bezier(.22,.61,.36,1);
  transition-delay: calc(var(--i, 0) * 130ms);
}
.althio-continuity.play.in .rv { opacity: 1; transform: none; filter: blur(0); }

@keyframes althio-cont-ken {
  from { transform: scale(1.02) translateY(0); }
  to { transform: scale(1.09) translateY(-1.5%); }
}
@keyframes althio-cont-twinkle {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .althio-continuity .sky, .althio-continuity .day .pt,
  .althio-continuity .stars, .althio-continuity .meteor,
  .althio-continuity .thread::after { animation: none; }
  .althio-continuity .meteor, .althio-continuity .thread::after { display: none; }
  .althio-continuity.play .rv { opacity: 1; transform: none; filter: none; transition: none; }
}

@media (max-width: 1199px) {
  .althio-continuity { padding: 100px 0 92px; }
  .althio-continuity .wrap { padding: 0 24px; }
  .althio-continuity .week { margin-top: 52px; }
  .althio-continuity .caption { margin-top: 48px; }
}

@media (max-width: 809px) {
  .althio-continuity { padding: 76px 0 70px; }
  .althio-continuity .wrap { padding: 0 20px; }
  .althio-continuity .body { font-size: 15.5px; max-width: 40ch; }
  .althio-continuity .week { margin-top: 42px; }
  .althio-continuity .thread { top: 8px; }
  .althio-continuity .day { gap: 10px; }
  .althio-continuity .day .pt { width: 6px; height: 6px; margin-top: 5px; }
  .althio-continuity .day.on .pt { width: 11px; height: 11px; margin-top: 3px; }
  .althio-continuity .day .lb { font-size: 10px; letter-spacing: 0.06em; }
  .althio-continuity .day .tag { display: none; }
  .althio-continuity .bandlabel { margin-top: 20px; font-size: 11px; }
  .althio-continuity .caption { margin-top: 40px; font-size: 17.5px; }
}

/* One desktop rendering: fractions of a 1440px reference. */
@media (min-width: 1200px) {
  .althio-continuity { padding: 9.028vw 0 8.333vw; font-size: 1.181vw; }
  .althio-continuity .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-continuity .eyebrow { font-size: 0.868vw; margin-bottom: 1.528vw; }
  .althio-continuity h2 { font-size: 3.611vw; }
  .althio-continuity .body { margin-top: 1.528vw; font-size: 1.181vw; }
  .althio-continuity .week { margin-top: 4.444vw; max-width: 52.778vw; }
  .althio-continuity .thread { top: 0.694vw; }
  .althio-continuity .day { gap: 0.972vw; }
  .althio-continuity .day .pt { width: 0.486vw; height: 0.486vw; margin-top: 0.486vw; }
  .althio-continuity .day.on .pt { width: 0.903vw; height: 0.903vw; margin-top: 0.278vw; }
  .althio-continuity .day .lb { font-size: 0.833vw; }
  .althio-continuity .day .tag { font-size: 0.729vw; margin-top: -0.556vw; }
  .althio-continuity .bandlabel { margin-top: 1.806vw; font-size: 0.833vw; }
  .althio-continuity .caption { margin-top: 4.028vw; font-size: 1.667vw; }
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
 * The night interlude: a full-bleed 3 am sky. One bright session against
 * seven nights of small lights — the thread Althio keeps.
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

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLElement>(null)
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
            { threshold: 0.22 }
        )
        observer.observe(root)
        return () => observer.disconnect()
    }, [isStatic])

    const cls = ["althio-continuity", isStatic ? "" : "play", seen ? "in" : ""]
        .filter(Boolean)
        .join(" ")

    return (
        <section className={cls} ref={rootRef} style={props.style}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="sky" aria-hidden="true" />
            <div className="scrim" aria-hidden="true" />
            <div className="stars" aria-hidden="true" />
            <div className="stars b" aria-hidden="true" />
            <span className="meteor" aria-hidden="true" />
            <span className="meteor two" aria-hidden="true" />
            <div className="edge top" aria-hidden="true" />
            <div className="edge bottom" aria-hidden="true" />
            <div className="wrap">
                <p className="eyebrow rv" style={{ "--i": 0 } as CSSProperties}>
                    {eyebrow}
                </p>
                <h2 className="rv" style={{ "--i": 1 } as CSSProperties}>
                    {heading}
                </h2>
                <p className="body rv" style={{ "--i": 2 } as CSSProperties}>
                    {body}
                </p>
                <div
                    className="week rv"
                    style={{ "--i": 3 } as CSSProperties}
                    aria-label="A week: one therapy session, Althio present every night"
                >
                    <div className="thread" aria-hidden="true" />
                    <div className="days">
                        {DAYS.map((day, index) => (
                            <div
                                className={`day${index === sessionDay ? " on" : ""}`}
                                key={day}
                            >
                                <span
                                    className="pt"
                                    style={{ "--i": index } as CSSProperties}
                                    aria-hidden="true"
                                />
                                <span className="lb">{day}</span>
                                {index === sessionDay ? (
                                    <span className="tag">{sessionLabel}</span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                    <p className="bandlabel">{bandLabel}</p>
                </div>
                <p className="caption rv" style={{ "--i": 4 } as CSSProperties}>
                    {nightCaption}
                </p>
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
