import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}

.althio-demo {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --skyblue: #D9E7F6;
  --pink: #F6E0D8;
  --lav: #E5E3F2;
  --line: rgba(35, 32, 28, 0.12);
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  min-height: 100svh;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  background:
    radial-gradient(44% 40% at 30% 20%, var(--skyblue) 0%, transparent 100%),
    radial-gradient(36% 34% at 74% 46%, var(--pink) 0%, transparent 100%),
    radial-gradient(30% 30% at 55% 10%, var(--lav) 0%, transparent 100%),
    var(--cream);
}
.althio-demo *, .althio-demo *::before, .althio-demo *::after { margin: 0; padding: 0; box-sizing: border-box; }

.althio-demo .stage {
  width: 100%; max-width: 760px;
  padding: 120px 28px 130px;
  text-align: center;
}

/* One blur-in recipe for every beat. --d staggers the pieces within a beat. */
.althio-demo .fx {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(10px);
  transition: opacity .62s ease, filter .62s ease, transform .62s ease;
  transition-delay: var(--d, 0ms);
}
.althio-demo .fx.in { opacity: 1; filter: blur(0); transform: none; }
/* Leaving is quicker than arriving, and lifts rather than settles. */
.althio-demo .fx.out {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(-8px);
  transition-duration: .4s;
  transition-delay: 0ms;
}

.althio-demo .intro h2 {
  font-family: var(--display);
  font-size: clamp(30px, 4.6vw, 50px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.14;
  text-wrap: balance;
}
.althio-demo .intro p {
  margin: 20px auto 0;
  max-width: 52ch;
  color: var(--ink-soft);
}

/* Same reason as .field: a bare label is an inline box. */
.althio-demo .step label { display: block; }
.althio-demo .step .q {
  display: block;
  font-family: var(--display);
  font-size: clamp(26px, 3.6vw, 40px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.16;
  text-wrap: balance;
}
.althio-demo .step .hint { display: block; margin-top: 10px; color: var(--ink-soft); font-size: 15px; }
/* The answer sits well clear of the question, so the two read as separate
   moments rather than one block. display:block matters — this is a span, and
   an inline box ignores both the vertical margin and the width. */
.althio-demo .step .field {
  display: block;
  width: 100%; max-width: 520px;
  margin: 72px auto 0;
}

/* Choices, in place of the old dropdowns. */
.althio-demo .choices {
  display: flex; flex-wrap: wrap;
  justify-content: center; gap: 10px;
}
.althio-demo .choice {
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 10px 20px;
  font-family: var(--sans); font-size: 16px; color: var(--ink);
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.althio-demo .choice:hover { border-color: rgba(35, 32, 28, 0.28); background: #FFFFFF; }
.althio-demo .choice:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
.althio-demo .choice[aria-pressed="true"] {
  background: var(--ink); color: var(--cream); border-color: var(--ink);
}

/* The one call to action on the beats that have one: Start, and Home. */
.althio-demo .go { margin-top: 32px; }
.althio-demo .step input,
.althio-demo .step textarea {
  width: 100%;
  background: transparent;
  border: 0; border-bottom: 1px solid var(--line);
  border-radius: 0;
  padding: 12px 4px;
  font-family: var(--sans); font-size: 21px; color: var(--ink);
  text-align: center;
  transition: border-color .25s ease;
}
.althio-demo .step textarea { resize: none; line-height: 1.5; }
.althio-demo .step input::placeholder,
.althio-demo .step textarea::placeholder { color: rgba(35, 32, 28, 0.32); }
.althio-demo .step input:focus,
.althio-demo .step textarea:focus { outline: none; border-bottom-color: var(--ink); }
.althio-demo .step .err {
  display: block; min-height: 20px;
  margin-top: 10px; font-size: 13.5px; color: #B4553D;
}

/* Bottom-right, clear of the centred question. */
.althio-demo .controls {
  position: absolute; right: 0; bottom: 0;
  display: flex; align-items: center; gap: 14px;
  padding: 28px 32px;
}
.althio-demo .count { font-size: 13px; color: var(--ink-soft); letter-spacing: 0.04em; }
.althio-demo .back {
  background: none; border: 0; cursor: pointer;
  font-family: var(--sans); font-size: 14px; color: var(--ink-soft);
  padding: 9px 4px;
  transition: color .2s ease;
}
.althio-demo .back:hover { color: var(--ink); }
.althio-demo .back:focus-visible, .althio-demo .btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

.althio-demo .btn {
  position: relative;
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--ink); color: var(--cream);
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  padding: 9px 18px; border-radius: 999px;
  text-decoration: none; border: none; cursor: pointer;
  overflow: hidden; isolation: isolate;
  transition: transform .35s cubic-bezier(.22,.9,.3,1), opacity .25s ease;
}
/* A slow band of light crosses the surface, like sun moving over the panel. */
.althio-demo .btn::before {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 48%, transparent 66%);
  transform: translateX(-120%);
  transition: transform .7s cubic-bezier(.3,.8,.3,1);
  z-index: -1;
}
.althio-demo .btn:hover::before { transform: translateX(120%); }
.althio-demo .btn:active { transform: scale(0.98); transition-duration: .1s; }
.althio-demo .btn[disabled] { opacity: .5; cursor: default; }
.althio-demo .btn .arw { display: inline-block; transition: transform .35s cubic-bezier(.22,.9,.3,1); }
.althio-demo .btn:hover:not([disabled]) .arw { transform: translateX(3px); }

/* A hairline of progress along the very bottom of the screen. */
.althio-demo .rail {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 2px; background: var(--line);
}
.althio-demo .rail span {
  display: block; height: 100%;
  background: var(--ink);
  transition: width .5s cubic-bezier(.22,.9,.3,1);
}

.althio-demo .done h2 {
  font-family: var(--display);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.15;
}
.althio-demo .done p { margin: 18px auto 0; max-width: 46ch; color: var(--ink-soft); }

@media (prefers-reduced-motion: reduce) {
  .althio-demo .fx {
    filter: none; transform: none;
    transition: opacity .2s ease;
  }
  .althio-demo .fx.out { filter: none; transform: none; }
  .althio-demo .btn, .althio-demo .btn::before, .althio-demo .btn .arw { transition: none; }
  .althio-demo .btn:hover::before { transform: translateX(-120%); }
  .althio-demo .btn:hover:not([disabled]) .arw { transform: none; }
}

@media (max-width: 1199px) {
  .althio-demo .stage { padding: 108px 24px 120px; }
  .althio-demo .controls { padding: 24px 26px; }
}

@media (max-width: 809px) {
  .althio-demo .stage { padding: 96px 20px 116px; }
  .althio-demo .intro p { font-size: 15px; max-width: 40ch; }
  .althio-demo .step .field { margin-top: 52px; }
  .althio-demo .step input, .althio-demo .step textarea { font-size: 18px; }
  .althio-demo .choice { padding: 9px 16px; font-size: 15px; }
  .althio-demo .controls { left: 0; padding: 20px; justify-content: flex-end; }
}

/* One desktop rendering: fractions of a 1440px reference. */
@media (min-width: 1200px) {
  .althio-demo { font-size: 1.181vw; }
  .althio-demo .stage { max-width: 52.778vw; padding: 8.333vw 1.944vw 9.028vw; }
  .althio-demo .intro h2 { font-size: 3.472vw; }
  .althio-demo .intro p { margin-top: 1.389vw; }
  .althio-demo .step .q { font-size: 2.778vw; }
  .althio-demo .step .hint { margin-top: 0.694vw; font-size: 1.042vw; }
  .althio-demo .step .field { max-width: 36.111vw; margin-top: 5vw; }
  .althio-demo .choices { gap: 0.694vw; }
  .althio-demo .choice { padding: 0.694vw 1.389vw; font-size: 1.111vw; }
  .althio-demo .go { margin-top: 2.222vw; }
  .althio-demo .step input, .althio-demo .step textarea {
    padding: 0.833vw 0.278vw;
    font-size: 1.458vw;
  }
  .althio-demo .step .err { margin-top: 0.694vw; font-size: 0.938vw; }
  .althio-demo .controls { padding: 1.944vw 2.222vw; gap: 0.972vw; }
  .althio-demo .count { font-size: 0.903vw; }
  .althio-demo .back { font-size: 0.972vw; }
  .althio-demo .btn { padding: 0.625vw 1.25vw; font-size: 0.972vw; gap: 0.486vw; }
  .althio-demo .done h2 { font-size: 3.056vw; }
}
`

interface Step {
    question: string
    hint: string
    placeholder: string
    kind: "text" | "email" | "long" | "choice"
    /** Comma-separated answers, for the choice kind. */
    options: string
    /** Field name the answer is sent under. */
    name: string
    required: boolean
}

interface AlthioDemoFlowProps {
    heading: string
    description: string
    startLabel: string
    steps: Step[]
    nextLabel: string
    submitLabel: string
    action: string
    doneHeading: string
    doneBody: string
    homeLabel: string
    homeLink: string
    style?: CSSProperties
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Althio Demo Flow
 *
 * The demo request as a paced sequence: the invitation blurs in, clears, and
 * the questions arrive one at a time.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioDemoFlow(props: AlthioDemoFlowProps) {
    const {
        heading,
        description,
        startLabel,
        steps,
        nextLabel,
        submitLabel,
        action,
        doneHeading,
        doneBody,
        homeLabel,
        homeLink,
    } = props

    const isStatic = useIsStaticRenderer()
    // The canvas and the crawler get the finished intro, not a mid-fade frame.
    const [phase, setPhase] = useState<"intro" | "step" | "done">("intro")
    const [index, setIndex] = useState(0)
    const [values, setValues] = useState<string[]>([])
    const [error, setError] = useState("")
    const [shown, setShown] = useState(isStatic)
    const [leaving, setLeaving] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    const step = steps[index]
    const isLast = index === steps.length - 1

    // Arriving: let the browser paint the blurred state, then clear it.
    useEffect(() => {
        if (isStatic) return
        setShown(false)
        setLeaving(false)
        const frame = requestAnimationFrame(() => setShown(true))
        return () => cancelAnimationFrame(frame)
    }, [phase, index, isStatic])

    // Blur out, then swap what is on the stage.
    useEffect(() => {
        if (!leaving) return
        const swap = window.setTimeout(() => {
            if (phase === "intro") setPhase("step")
            else if (phase === "step") {
                if (isLast) setPhase("done")
                else setIndex((value) => value + 1)
            }
        }, 420)
        return () => window.clearTimeout(swap)
    }, [leaving, phase, isLast])

    useEffect(() => {
        if (phase !== "step" || !shown || leaving) return
        if (steps[index]?.kind === "choice") return
        inputRef.current?.focus()
    }, [phase, shown, leaving, index, steps])

    const send = (answers: string[]) => {
        if (!action) return
        const body = new FormData()
        steps.forEach((item, position) => {
            body.append(item.name || item.question, answers[position] ?? "")
        })
        // Fire and forget: the flow should not stall on a slow endpoint.
        void fetch(action, { method: "POST", body }).catch(() => undefined)
    }

    const advance = () => {
        if (leaving) return
        const value = (values[index] ?? "").trim()
        if (step.required && !value) {
            setError("This one is needed to arrange the demo.")
            return
        }
        if (step.kind === "email" && value && !EMAIL.test(value)) {
            setError("That email address does not look right.")
            return
        }
        setError("")
        if (isLast) send(values)
        setLeaving(true)
    }

    const back = () => {
        if (leaving || index === 0) return
        setError("")
        setIndex((value) => value - 1)
    }

    const write = (value: string) => {
        setValues((current) => {
            const next = current.slice()
            next[index] = value
            return next
        })
        if (error) setError("")
    }

    const fxClass = ["fx", leaving ? "out" : shown ? "in" : ""]
        .filter(Boolean)
        .join(" ")

    const progress =
        phase === "done" ? 1 : phase === "intro" ? 0 : index / steps.length

    return (
        <section className="althio-demo" style={props.style}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            <div className="stage">
                {phase === "intro" && (
                    <div className="intro">
                        <h2 className={fxClass}>{heading}</h2>
                        <p
                            className={fxClass}
                            style={{ "--d": "420ms" } as CSSProperties}
                        >
                            {description}
                        </p>
                        <div
                            className={`${fxClass} go`}
                            style={{ "--d": "760ms" } as CSSProperties}
                        >
                            <button
                                className="btn"
                                type="button"
                                onClick={() => !leaving && setLeaving(true)}
                            >
                                {startLabel}{" "}
                                <span className="arw" aria-hidden="true">
                                    &rarr;
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {phase === "step" && step && (
                    <div className="step">
                        <label className={fxClass}>
                            <span className="q">{step.question}</span>
                            {step.hint ? (
                                <span className="hint">{step.hint}</span>
                            ) : null}
                            <span className="field">
                                {step.kind === "choice" ? (
                                    <span className="choices">
                                        {step.options
                                            .split(",")
                                            .map((option) => option.trim())
                                            .filter(Boolean)
                                            .map((option) => (
                                                <button
                                                    className="choice"
                                                    type="button"
                                                    key={option}
                                                    aria-pressed={
                                                        values[index] === option
                                                    }
                                                    onClick={() => write(option)}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                    </span>
                                ) : step.kind === "long" ? (
                                    <textarea
                                        ref={
                                            inputRef as React.RefObject<HTMLTextAreaElement>
                                        }
                                        rows={3}
                                        placeholder={step.placeholder}
                                        value={values[index] ?? ""}
                                        onChange={(event) => write(event.target.value)}
                                    />
                                ) : (
                                    <input
                                        ref={
                                            inputRef as React.RefObject<HTMLInputElement>
                                        }
                                        type={step.kind === "email" ? "email" : "text"}
                                        placeholder={step.placeholder}
                                        value={values[index] ?? ""}
                                        onChange={(event) => write(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.preventDefault()
                                                advance()
                                            }
                                        }}
                                    />
                                )}
                            </span>
                            <span className="err" role="alert">
                                {error}
                            </span>
                        </label>
                    </div>
                )}

                {phase === "done" && (
                    <div className="done">
                        <h2 className={fxClass}>{doneHeading}</h2>
                        <p
                            className={fxClass}
                            style={{ "--d": "260ms" } as CSSProperties}
                        >
                            {doneBody}
                        </p>
                        <div
                            className={`${fxClass} go`}
                            style={{ "--d": "520ms" } as CSSProperties}
                        >
                            <a className="btn" href={homeLink}>
                                {homeLabel}{" "}
                                <span className="arw" aria-hidden="true">
                                    &rarr;
                                </span>
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {phase === "step" && step && (
                <div className="controls">
                    <span className="count">
                        {index + 1} / {steps.length}
                    </span>
                    {index > 0 && (
                        <button className="back" type="button" onClick={back}>
                            Back
                        </button>
                    )}
                    <button
                        className="btn"
                        type="button"
                        onClick={advance}
                        disabled={leaving}
                    >
                        {isLast ? submitLabel : nextLabel}{" "}
                        <span className="arw" aria-hidden="true">
                            &rarr;
                        </span>
                    </button>
                </div>
            )}

            <div className="rail" aria-hidden="true">
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
        </section>
    )
}

addPropertyControls(AlthioDemoFlow, {
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Bring the other 167 hours into care.",
        displayTextArea: true,
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "Althio is in pilot with clinics now. Tell us a little about your practice and we will show you a live session brief and the patient experience, end to end.",
        displayTextArea: true,
    },
    startLabel: {
        type: ControlType.String,
        title: "Start",
        defaultValue: "Start",
    },
    steps: {
        type: ControlType.Array,
        title: "Questions",
        control: {
            type: ControlType.Object,
            controls: {
                question: { type: ControlType.String, defaultValue: "Question" },
                hint: { type: ControlType.String, defaultValue: "" },
                placeholder: { type: ControlType.String, defaultValue: "" },
                kind: {
                    type: ControlType.Enum,
                    options: ["text", "email", "long", "choice"],
                    optionTitles: ["Text", "Email", "Paragraph", "Choice"],
                    defaultValue: "text",
                },
                options: {
                    type: ControlType.String,
                    defaultValue: "",
                    description: "Comma-separated answers, for Choice.",
                    hidden: (props) => props.kind !== "choice",
                },
                name: {
                    type: ControlType.String,
                    defaultValue: "",
                    description: "Field name the answer is sent under.",
                },
                required: { type: ControlType.Boolean, defaultValue: true },
            },
        },
        defaultValue: [
            {
                question: "What is your full name?",
                hint: "",
                placeholder: "Dr. Rhea Mehta",
                kind: "text",
                options: "",
                name: "name",
                required: true,
            },
            {
                question: "Where should we reach you?",
                hint: "A work address, so we can verify the practice.",
                placeholder: "you@clinic.com",
                kind: "email",
                options: "",
                name: "email",
                required: true,
            },
            {
                question: "Which organisation are you with?",
                hint: "",
                placeholder: "Name of your practice",
                kind: "text",
                options: "",
                name: "org",
                required: true,
            },
            {
                question: "What is your role there?",
                hint: "",
                placeholder: "",
                kind: "choice",
                options:
                    "Clinician, Clinical lead, Operations, Executive, Researcher, Other",
                name: "role",
                required: true,
            },
            {
                question: "How many clinicians are in your practice?",
                hint: "",
                placeholder: "",
                kind: "choice",
                options: "Just me, 2–10, 11–50, 51–200, More than 200",
                name: "size",
                required: true,
            },
            {
                question: "What would you like to see?",
                hint: "So we can shape the demo around your work.",
                placeholder: "Anything specific — the clinician view, safety, pricing…",
                kind: "long",
                options: "",
                name: "message",
                required: false,
            },
        ],
    },
    nextLabel: {
        type: ControlType.String,
        title: "Next",
        defaultValue: "Next",
    },
    submitLabel: {
        type: ControlType.String,
        title: "Submit",
        defaultValue: "Request demo",
    },
    action: {
        type: ControlType.String,
        title: "Send To",
        defaultValue: "",
        description:
            "Endpoint the answers are POSTed to. Left empty, answers are not delivered anywhere.",
    },
    doneHeading: {
        type: ControlType.String,
        title: "Done",
        defaultValue: "Thank you — we will be in touch.",
        displayTextArea: true,
    },
    doneBody: {
        type: ControlType.String,
        title: "Done Body",
        defaultValue:
            "Someone from the clinical team will write within two working days to arrange a time.",
        displayTextArea: true,
    },
    homeLabel: {
        type: ControlType.String,
        title: "Home",
        defaultValue: "Back to home",
    },
    homeLink: {
        type: ControlType.String,
        title: "Home Link",
        defaultValue: "/",
    },
})
