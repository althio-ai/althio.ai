import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:600;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Semibold.woff2") format("woff2")}

.althio-steps {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --ink-faint: rgba(35, 32, 28, 0.34);
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

/* ------------------------------------------------ shared reveal machinery
   Pre-states exist only under .play (JS running, motion allowed), so the
   static export and the canvas always show the finished layout. */
.althio-steps.play .rv {
  opacity: 0;
  transform: translateY(16px);
  filter: blur(6px);
  transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1), filter .8s cubic-bezier(.22,.61,.36,1);
  transition-delay: calc(var(--i, 0) * 110ms);
}
.althio-steps.play.in .rv { opacity: 1; transform: none; filter: blur(0); }

/* ===================================================== chapters (Cards) */
.althio-steps .chead {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 24px;
  padding-bottom: 26px;
  border-bottom: 1px solid var(--line);
}
.althio-steps .kicker {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-bottom: 14px;
}
.althio-steps h2 {
  font-family: var(--display);
  font-size: clamp(30px, 4.2vw, 44px);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-wrap: balance;
  max-width: 22ch;
}
.althio-steps .chead .lede { color: var(--ink-soft); max-width: 34ch; font-size: 16px; }

.althio-steps .chapters { display: block; }
.althio-steps .chapter {
  position: relative;
  display: grid;
  grid-template-columns: 150px 1fr 340px;
  gap: clamp(24px, 4vw, 56px);
  align-items: center;
  padding: 54px 0;
  border-bottom: 1px solid var(--line);
}
.althio-steps .chapter:last-child { border-bottom: none; }

/* The ghost numeral: big, serif, barely there. */
.althio-steps .chapter .no {
  font-family: var(--display);
  font-size: 92px;
  font-weight: 400;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(35, 32, 28, 0.28);
}
.althio-steps .chapter .stamp {
  display: block;
  margin-top: 14px;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  white-space: nowrap;
}
.althio-steps .chapter h3 {
  font-family: var(--display);
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.althio-steps .chapter .body {
  margin-top: 12px;
  color: var(--ink-soft);
  font-size: 16px;
  max-width: 46ch;
}

/* --------------------------------------------------- chapter artifacts
   Real fragments of the product, not icons: a patient message, the
   pattern chips, the finished brief. Each floats gently on hover. */
.althio-steps .art {
  justify-self: end;
  width: 100%;
  max-width: 340px;
  transition: transform .5s cubic-bezier(.22,.9,.3,1);
}
.althio-steps .chapter:hover .art { transform: translateY(-4px) rotate(var(--tilt, 0deg)); }

.althio-steps .bubble {
  position: relative;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px 20px 20px 6px;
  padding: 16px 18px 14px;
  transform: rotate(-0.6deg);
}
.althio-steps .bubble .msg {
  font-size: 15px;
  line-height: 1.5;
  color: var(--ink);
}
.althio-steps .bubble .meta {
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-faint);
  display: flex; align-items: center; gap: 6px;
}
.althio-steps .bubble .meta .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #7A9ED0; flex-shrink: 0;
}

.althio-steps .patterns {
  display: flex; flex-direction: column; gap: 8px;
  align-items: flex-end;
}
.althio-steps .pchip {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 13px;
  color: var(--ink);
}
.althio-steps .pchip .swatch {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.althio-steps .pchip:nth-child(1) { transform: rotate(-0.5deg); }
.althio-steps .pchip:nth-child(2) { transform: rotate(0.4deg) translateX(-12px); }
.althio-steps .pchip:nth-child(3) { transform: rotate(-0.3deg) translateX(6px); }

.althio-steps .briefline {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px 18px;
  transform: rotate(0.5deg);
}
.althio-steps .briefline .top {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--display);
  font-size: 15.5px; font-weight: 600;
}
.althio-steps .briefline .live {
  width: 7px; height: 7px; border-radius: 50%;
  background: #7A9ED0; flex-shrink: 0;
  box-shadow: 0 0 0 0 rgba(122, 158, 208, 0.5);
  animation: althio-steps-live 2.2s ease-out infinite;
}
.althio-steps .briefline .sub {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--ink-soft);
}
@keyframes althio-steps-live {
  0% { box-shadow: 0 0 0 0 rgba(122, 158, 208, 0.45); }
  70% { box-shadow: 0 0 0 8px rgba(122, 158, 208, 0); }
  100% { box-shadow: 0 0 0 0 rgba(122, 158, 208, 0); }
}

/* ================================================== principles (Plain)
   No boxes. Typography, hairlines, and three quiet pastel marks. */
.althio-steps .phead { text-align: center; }
.althio-steps .phead .kicker { text-align: center; }
.althio-steps .phead h2 { margin: 0 auto; max-width: none; }
.althio-steps .phead .lede {
  text-align: center;
  color: var(--ink-soft);
  max-width: 52ch;
  margin: 14px auto 0;
}
.althio-steps .principles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 54px;
  border-top: 1px solid var(--line);
}
.althio-steps .principle {
  padding: 34px 34px 8px 0;
}
.althio-steps .principle + .principle {
  border-left: 1px solid var(--line);
  padding-left: 34px;
}
.althio-steps .principle .mark {
  display: block;
  width: 10px; height: 10px; border-radius: 50%;
  margin-bottom: 18px;
}
.althio-steps .principle .mark.sky { background: #A8C6E8; }
.althio-steps .principle .mark.pink { background: #E8B7A6; }
.althio-steps .principle .mark.lav { background: #B9B4DE; }
.althio-steps .principle h3 {
  font-family: var(--display);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 10px;
}
.althio-steps .principle p { color: var(--ink-soft); font-size: 15.5px; max-width: 34ch; }
.althio-steps .pfoot {
  margin-top: 40px;
  text-align: center;
}
.althio-steps .pfoot a {
  display: inline-flex; align-items: center; gap: 7px;
  color: var(--ink);
  font-size: 14.5px; font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid rgba(35, 32, 28, 0.3);
  padding-bottom: 2px;
  transition: border-color .25s ease;
}
.althio-steps .pfoot a:hover { border-color: var(--ink); }
.althio-steps .pfoot a .arw { display: inline-block; transition: transform .3s cubic-bezier(.22,.9,.3,1); }
.althio-steps .pfoot a:hover .arw { transform: translateX(3px); }
.althio-steps .pfoot a:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .althio-steps.play .rv { opacity: 1; transform: none; filter: none; transition: none; }
  .althio-steps .art, .althio-steps .chapter:hover .art { transition: none; transform: none; }
  .althio-steps .briefline .live { animation: none; }
  .althio-steps .pfoot a .arw, .althio-steps .pfoot a:hover .arw { transition: none; transform: none; }
}

@media (max-width: 1199px) {
  .althio-steps { padding-top: calc(var(--pt) * 0.8px); padding-bottom: calc(var(--pb) * 0.8px); }
  .althio-steps .wrap { padding: 0 24px; }
  .althio-steps .chead { flex-direction: column; gap: 10px; padding-bottom: 22px; }
  .althio-steps .chead .lede { max-width: 52ch; }
  .althio-steps .chapter { grid-template-columns: 96px 1fr 280px; padding: 40px 0; }
  .althio-steps .chapter .no { font-size: 64px; }
  .althio-steps .chapter .stamp { white-space: normal; }
  .althio-steps .principles { margin-top: 42px; }
  .althio-steps .principle { padding: 26px 24px 6px 0; }
  .althio-steps .principle + .principle { padding-left: 24px; }
}

@media (max-width: 809px) {
  .althio-steps { padding-top: calc(var(--pt) * 0.62px); padding-bottom: calc(var(--pb) * 0.62px); }
  .althio-steps .wrap { padding: 0 20px; }
  .althio-steps .chapter {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 34px 0;
    align-items: start;
  }
  .althio-steps .chapter .nowrap { display: flex; align-items: baseline; gap: 14px; }
  .althio-steps .chapter .no { font-size: 48px; }
  .althio-steps .chapter .stamp { margin-top: 0; }
  .althio-steps .chapter .body { font-size: 15.5px; }
  .althio-steps .art { justify-self: start; max-width: 320px; }
  .althio-steps .patterns { align-items: flex-start; }
  .althio-steps .pchip:nth-child(2) { transform: rotate(0.4deg) translateX(12px); }
  .althio-steps .pchip:nth-child(3) { transform: rotate(-0.3deg) translateX(2px); }
  .althio-steps .chapter:hover .art { transform: none; }
  .althio-steps .principles { grid-template-columns: 1fr; margin-top: 32px; }
  .althio-steps .principle { padding: 24px 0 10px; }
  .althio-steps .principle + .principle { border-left: none; border-top: 1px solid var(--line); padding-left: 0; }
  .althio-steps .principle p { max-width: none; }
  .althio-steps .phead .lede { max-width: 38ch; font-size: 16px; }
  .althio-steps .pfoot { margin-top: 26px; }
}

/* One desktop rendering: fractions of a 1440px reference. */
@media (min-width: 1200px) {
  .althio-steps {
    padding-top: calc(var(--pt) * 0.0694vw);
    padding-bottom: calc(var(--pb) * 0.0694vw);
    font-size: 1.181vw;
  }
  .althio-steps .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-steps .kicker { font-size: 0.868vw; margin-bottom: 0.972vw; }
  .althio-steps h2 { font-size: 3.056vw; }
  .althio-steps .chead { padding-bottom: 1.806vw; gap: 1.667vw; }
  .althio-steps .chead .lede { font-size: 1.111vw; }
  .althio-steps .chapter { grid-template-columns: 10.417vw 1fr 23.611vw; padding: 3.75vw 0; gap: 3.889vw; }
  .althio-steps .chapter .no { font-size: 6.389vw; }
  .althio-steps .chapter .stamp { margin-top: 0.972vw; font-size: 0.799vw; }
  .althio-steps .chapter h3 { font-size: 2.083vw; }
  .althio-steps .chapter .body { margin-top: 0.833vw; font-size: 1.111vw; }
  .althio-steps .art { max-width: 23.611vw; }
  .althio-steps .bubble { border-radius: 1.389vw 1.389vw 1.389vw 0.417vw; padding: 1.111vw 1.25vw 0.972vw; }
  .althio-steps .bubble .msg { font-size: 1.042vw; }
  .althio-steps .bubble .meta { margin-top: 0.694vw; font-size: 0.833vw; gap: 0.417vw; }
  .althio-steps .bubble .meta .dot { width: 0.417vw; height: 0.417vw; }
  .althio-steps .patterns { gap: 0.556vw; }
  .althio-steps .pchip { gap: 0.556vw; padding: 0.486vw 0.972vw; font-size: 0.903vw; }
  .althio-steps .pchip .swatch { width: 0.556vw; height: 0.556vw; }
  .althio-steps .briefline { border-radius: 1.111vw; padding: 1.111vw 1.25vw; }
  .althio-steps .briefline .top { font-size: 1.076vw; gap: 0.556vw; }
  .althio-steps .briefline .live { width: 0.486vw; height: 0.486vw; }
  .althio-steps .briefline .sub { margin-top: 0.417vw; font-size: 0.868vw; }
  .althio-steps .principles { margin-top: 3.75vw; }
  .althio-steps .principle { padding: 2.361vw 2.361vw 0.556vw 0; }
  .althio-steps .principle + .principle { padding-left: 2.361vw; }
  .althio-steps .principle .mark { width: 0.694vw; height: 0.694vw; margin-bottom: 1.25vw; }
  .althio-steps .principle h3 { font-size: 1.458vw; margin-bottom: 0.694vw; }
  .althio-steps .principle p { font-size: 1.076vw; }
  .althio-steps .phead .lede { margin-top: 0.972vw; }
  .althio-steps .pfoot { margin-top: 2.778vw; }
  .althio-steps .pfoot a { font-size: 1.007vw; gap: 0.486vw; }
}
`

type IconName = "moon" | "ear" | "file" | "shield" | "alert" | "lock"

const TONES = ["sky", "pink", "lav"] as const

/* The three product fragments the chapters carry. Fixed on purpose: they are
   the design, not content to be configured per instance. */
function Artifact({ index }: { index: number }) {
    if (index === 0) {
        return (
            <div className="bubble">
                <p className="msg">
                    &ldquo;Couldn&rsquo;t sleep again. The thing with my brother
                    came back tonight.&rdquo;
                </p>
                <p className="meta">
                    <span className="dot" aria-hidden="true" />
                    Tue 11:42 pm &middot; Althio answered
                </p>
            </div>
        )
    }
    if (index === 1) {
        return (
            <div className="patterns">
                <span className="pchip">
                    <span className="swatch" style={{ background: "#7A9ED0" }} aria-hidden="true" />
                    sleep &darr; since Thursday
                </span>
                <span className="pchip">
                    <span className="swatch" style={{ background: "#D9A08F" }} aria-hidden="true" />
                    avoidance &uarr; one topic
                </span>
                <span className="pchip">
                    <span className="swatch" style={{ background: "#B9B4DE" }} aria-hidden="true" />
                    grounding practiced &times;5
                </span>
            </div>
        )
    }
    return (
        <div className="briefline">
            <p className="top">
                <span className="live" aria-hidden="true" />
                Brief ready &mdash; Fri 9:12 am
            </p>
            <p className="sub">2 signals &middot; 1 flag &middot; 40-second read</p>
        </div>
    )
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
    stamps: { text: string }[]
    surface: "card" | "plain"
    footLabel: string
    footLink: string
    paddingTop: number
    paddingBottom: number
    style?: CSSProperties
}

/**
 * Althio Steps
 *
 * Two editorial treatments behind one prop contract. "Cards" renders the
 * week as numbered chapters with real product fragments; "Plain" renders
 * quiet typographic principles with no boxes.
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
        stamps,
        surface,
        footLabel,
        footLink,
        paddingTop,
        paddingBottom,
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
            { threshold: 0.18 }
        )
        observer.observe(root)
        return () => observer.disconnect()
    }, [isStatic])

    const cls = [
        "althio-steps",
        isStatic ? "" : "play",
        seen ? "in" : "",
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <section
            ref={rootRef}
            className={cls}
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
            <div className="wrap">
                {surface === "plain" ? (
                    <>
                        <div className="phead rv" style={{ "--i": 0 } as CSSProperties}>
                            {kicker ? <p className="kicker">{kicker}</p> : null}
                            <h2>{heading}</h2>
                            {lede ? <p className="lede">{lede}</p> : null}
                        </div>
                        <div className="principles">
                            {items.map((item, index) => (
                                <div
                                    className="principle rv"
                                    key={index}
                                    style={{ "--i": index + 1 } as CSSProperties}
                                >
                                    <span
                                        className={`mark ${TONES[index % TONES.length]}`}
                                        aria-hidden="true"
                                    />
                                    <h3>{item.title}</h3>
                                    <p>{item.body}</p>
                                </div>
                            ))}
                        </div>
                        {footLabel ? (
                            <p className="pfoot rv" style={{ "--i": 4 } as CSSProperties}>
                                <a href={footLink}>
                                    {footLabel}{" "}
                                    <span className="arw" aria-hidden="true">
                                        &rarr;
                                    </span>
                                </a>
                            </p>
                        ) : null}
                    </>
                ) : (
                    <>
                        <div className="chead rv" style={{ "--i": 0 } as CSSProperties}>
                            <div>
                                {kicker ? <p className="kicker">{kicker}</p> : null}
                                <h2>{heading}</h2>
                            </div>
                            {lede ? <p className="lede">{lede}</p> : null}
                        </div>
                        <div className="chapters">
                            {items.map((item, index) => (
                                <div
                                    className="chapter rv"
                                    key={index}
                                    style={
                                        {
                                            "--i": index + 1,
                                            "--tilt": `${[-0.6, 0.4, -0.4][index % 3]}deg`,
                                        } as CSSProperties
                                    }
                                >
                                    <div className="nowrap">
                                        <span className="no" aria-hidden="true">
                                            {item.marker}
                                        </span>
                                        {stamps[index]?.text ? (
                                            <span className="stamp">
                                                {stamps[index].text}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p className="body">{item.body}</p>
                                    </div>
                                    <div className="art" aria-hidden="true">
                                        <Artifact index={index} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
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
        optionTitles: ["Chapters", "Principles"],
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
    stamps: {
        type: ControlType.Array,
        title: "Stamps",
        description: "Small day and time labels beside each chapter number.",
        control: {
            type: ControlType.Object,
            controls: {
                text: { type: ControlType.String, defaultValue: "" },
            },
        },
        defaultValue: [
            { text: "Tuesday · 11:42 pm" },
            { text: "Through the week" },
            { text: "Friday · before session" },
        ],
    },
    footLabel: {
        type: ControlType.String,
        title: "Foot Link",
        defaultValue: "Read how we build for safety",
        description: "Shown under the Principles treatment only.",
    },
    footLink: {
        type: ControlType.String,
        title: "Foot URL",
        defaultValue: "/safety",
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
