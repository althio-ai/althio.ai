import { addPropertyControls, ControlType } from "framer"
import type { CSSProperties } from "react"

const SKY_CTA =
    "https://framerusercontent.com/images/JoRZbiHlKQ037lB8fW8BgIGFk.jpg"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}

.althio-cta {
  --cream: #FBF7F0;
  --ink: #23201C;
  --line: rgba(35, 32, 28, 0.12);
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  padding: 0 28px 90px;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  scroll-margin-top: 90px;
  -webkit-font-smoothing: antialiased;
}
.althio-cta *, .althio-cta *::before, .althio-cta *::after { margin: 0; padding: 0; box-sizing: border-box; }

.althio-cta .panel {
  position: relative;
  max-width: 1120px; margin: 0 auto;
  border-radius: 32px; overflow: hidden;
  padding: clamp(70px, 10vw, 130px) 28px;
  text-align: center;
  box-shadow: 0 30px 80px -40px rgba(35, 32, 28, 0.35);
}
.althio-cta .panel .sky {
  position: absolute; inset: -6%;
  background: url("${SKY_CTA}") center 70% / cover no-repeat;
  animation: althio-cta-ken 32s ease-in-out infinite alternate;
  z-index: 0;
}
.althio-cta .panel .copy { position: relative; z-index: 1; }
.althio-cta h2 {
  font-family: var(--display);
  font-size: clamp(30px, 4.2vw, 44px);
  font-weight: 500; letter-spacing: -0.02em; line-height: 1.15;
  margin-bottom: 14px;
  text-wrap: balance;
}
.althio-cta p { color: rgba(35, 32, 28, 0.72); max-width: 44ch; margin: 0 auto 30px; }

.althio-cta .btn {
  position: relative;
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--ink); color: var(--cream);
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  padding: 9px 18px; border-radius: 999px;
  text-decoration: none; border: none; cursor: pointer;
  overflow: hidden; isolation: isolate;
  box-shadow: 0 1px 2px rgba(35, 32, 28, 0.12);
  transition: transform .35s cubic-bezier(.22,.9,.3,1), box-shadow .35s cubic-bezier(.22,.9,.3,1);
}
.althio-cta .btn::before {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 48%, transparent 66%);
  transform: translateX(-120%);
  transition: transform .7s cubic-bezier(.3,.8,.3,1);
  z-index: -1;
}
.althio-cta .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -12px rgba(35,32,28,0.45); }
.althio-cta .btn:hover::before { transform: translateX(120%); }
.althio-cta .btn:active { transform: scale(0.98); transition-duration: .1s; }
.althio-cta .btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
.althio-cta .btn .arw { display: inline-block; transition: transform .35s cubic-bezier(.22,.9,.3,1); }
.althio-cta .btn:hover .arw { transform: translateX(3px); }

@keyframes althio-cta-ken {
  from { transform: scale(1.02); }
  to { transform: scale(1.08) translateY(-1.5%); }
}

@media (prefers-reduced-motion: reduce) {
  .althio-cta .btn, .althio-cta .btn::before, .althio-cta .btn .arw, .althio-cta .panel .sky { transition: none; animation: none; }
  .althio-cta .btn:hover { transform: none; }
  .althio-cta .btn:hover::before { transform: translateX(-120%); }
  .althio-cta .btn:hover .arw { transform: none; }
}

@media (max-width: 1199px) {
  .althio-cta { padding: 0 24px 76px; }
  .althio-cta .panel { border-radius: 28px; padding: clamp(64px, 9vw, 100px) 24px; }
}

@media (max-width: 809px) {
  .althio-cta { padding: 0 20px 64px; }
  .althio-cta .panel { border-radius: 24px; padding: 56px 22px; }
  .althio-cta .panel .sky { background-position: center bottom; }
  .althio-cta p { font-size: 16px; max-width: 34ch; margin-bottom: 26px; }
  .althio-cta .btn { padding: 11px 20px; }
}

@media (min-width: 1200px) {
  .althio-cta { padding: 0 1.944vw 6.25vw; font-size: 1.181vw; }
  .althio-cta .panel {
    max-width: 77.778vw;
    border-radius: 2.222vw;
    padding: 9.028vw 1.944vw;
  }
  .althio-cta h2 { font-size: 3.056vw; margin-bottom: 0.972vw; }
  .althio-cta p { margin-bottom: 2.083vw; }
  .althio-cta .btn { padding: 0.625vw 1.25vw; font-size: 0.972vw; gap: 0.486vw; }
}
`

interface AlthioCTAProps {
    anchorId: string
    heading: string
    body: string
    buttonLabel: string
    buttonLink: string
    style?: CSSProperties
}

/**
 * Althio CTA
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioCTA(props: AlthioCTAProps) {
    const { anchorId, heading, body, buttonLabel, buttonLink } = props

    return (
        <section
            className="althio-cta"
            id={anchorId || undefined}
            style={props.style}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="panel">
                <div className="sky" aria-hidden="true" />
                <div className="copy">
                    <h2>{heading}</h2>
                    <p>{body}</p>
                    <a className="btn" href={buttonLink}>
                        {buttonLabel}{" "}
                        <span className="arw" aria-hidden="true">
                            &rarr;
                        </span>
                    </a>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(AlthioCTA, {
    anchorId: {
        type: ControlType.String,
        title: "Anchor",
        defaultValue: "demo-cta",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Bring the other 167 hours into care.",
        displayTextArea: true,
    },
    body: {
        type: ControlType.String,
        title: "Body",
        defaultValue:
            "Althio is in pilot with clinics now. See a live session brief and the patient experience, end to end.",
        displayTextArea: true,
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Request a demo",
    },
    buttonLink: {
        type: ControlType.String,
        title: "Link",
        defaultValue: "/demo",
    },
})
