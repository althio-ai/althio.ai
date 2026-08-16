import { addPropertyControls, ControlType } from "framer"
import type { CSSProperties } from "react"

const SKY_DAY =
    "https://framerusercontent.com/images/YTgwKd8dFTqttTosKcOOtZXfF7k.jpg"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}

.althio-404 {
  --cream: #FBF7F0;
  --ink: #23201C;
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}
.althio-404 *, .althio-404 *::before, .althio-404 *::after { margin: 0; padding: 0; box-sizing: border-box; }

.althio-404 .screen {
  position: relative;
  min-height: 100svh;
  display: grid; place-items: center;
  text-align: center;
  overflow: hidden;
  background: url("${SKY_DAY}") center 40% / cover no-repeat;
}
/* Just enough shade behind the type for white to hold on a bright sky, and
   nothing at the edges so the clouds stay clean. */
.althio-404 .screen::after {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(66% 56% at 50% 46%, rgba(26,36,56,0.44) 0%, rgba(26,36,56,0.2) 60%, rgba(26,36,56,0) 84%);
}
.althio-404 .inner {
  position: relative; z-index: 1;
  max-width: 640px;
  padding: 120px 28px 90px;
}
.althio-404 .code {
  font-family: var(--display);
  font-size: clamp(112px, 21vw, 250px);
  font-weight: 700;
  line-height: 0.86;
  letter-spacing: -0.045em;
  color: #FFFFFF;
}
.althio-404 h1 {
  font-family: var(--display);
  font-size: clamp(24px, 3.6vw, 34px);
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: #FFFFFF;
  margin-top: 26px;
  text-shadow: 0 1px 18px rgba(24, 34, 54, 0.38);
}
.althio-404 .sub {
  font-size: 16.5px;
  line-height: 1.65;
  color: #FFFFFF;
  margin-top: 14px;
  text-shadow: 0 1px 3px rgba(20,28,46,0.55), 0 1px 20px rgba(20,28,46,0.5);
}
.althio-404 .actions {
  display: flex; align-items: center; justify-content: center;
  flex-wrap: wrap; gap: 12px;
  margin-top: 32px;
}
.althio-404 .btn {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  padding: 9px 18px;
  border-radius: 999px;
  text-decoration: none; cursor: pointer;
  background: var(--ink); color: var(--cream);
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(24, 34, 54, 0.22);
  transition: opacity .25s ease;
}
.althio-404 .btn.ghost {
  background: rgba(251, 247, 240, 0.9);
  color: var(--ink);
  border-color: rgba(35, 32, 28, 0.12);
}
.althio-404 .btn:hover { opacity: .85; }
.althio-404 .btn:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
.althio-404 .btn .arw { transition: transform .3s cubic-bezier(.22,.9,.3,1); }
.althio-404 .btn:hover .arw { transform: translateX(3px); }

@media (prefers-reduced-motion: reduce) {
  .althio-404 .btn, .althio-404 .btn .arw { transition: none; }
  .althio-404 .btn:hover .arw { transform: none; }
}

@media (max-width: 1199px) {
  .althio-404 .inner { padding: 100px 24px 80px; }
  .althio-404 .sub { max-width: 46ch; margin-left: auto; margin-right: auto; }
}

@media (max-width: 809px) {
  .althio-404 .inner { padding: 88px 20px 72px; }
  .althio-404 h1 { margin-top: 20px; font-size: clamp(22px, 6.4vw, 28px); }
  .althio-404 .sub { font-size: 15.5px; max-width: 34ch; }
  .althio-404 .actions { margin-top: 26px; }
}

@media (max-width: 400px) {
  .althio-404 .actions { flex-direction: column; align-items: stretch; }
  .althio-404 .btn { justify-content: center; }
}

/* One desktop rendering: fractions of a 1440px reference. The screen itself
   stays 100svh — filling the viewport is the point of it. */
@media (min-width: 1200px) {
  .althio-404 .inner { max-width: 44.444vw; padding: 8.333vw 1.944vw 6.25vw; }
  .althio-404 .code { font-size: 17.361vw; }
  .althio-404 h1 { font-size: 2.361vw; margin-top: 1.806vw; }
  .althio-404 .sub { font-size: 1.146vw; margin-top: 0.972vw; }
  .althio-404 .actions { margin-top: 2.222vw; gap: 0.833vw; }
  .althio-404 .btn { padding: 0.625vw 1.25vw; font-size: 0.972vw; gap: 0.486vw; }
}
`

interface AlthioNotFoundProps {
    code: string
    heading: string
    body: string
    primaryLabel: string
    primaryLink: string
    secondaryLabel: string
    secondaryLink: string
    style?: CSSProperties
}

/**
 * Althio Not Found
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioNotFound(props: AlthioNotFoundProps) {
    const {
        code,
        heading,
        body,
        primaryLabel,
        primaryLink,
        secondaryLabel,
        secondaryLink,
    } = props

    return (
        <div className="althio-404" style={props.style}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <section className="screen">
                <div className="inner">
                    <p className="code">{code}</p>
                    <h1>{heading}</h1>
                    <p className="sub">{body}</p>
                    <div className="actions">
                        <a className="btn" href={primaryLink}>
                            {primaryLabel}{" "}
                            <span className="arw" aria-hidden="true">
                                &rarr;
                            </span>
                        </a>
                        <a className="btn ghost" href={secondaryLink}>
                            {secondaryLabel}
                        </a>
                    </div>
                </div>
            </section>
        </div>
    )
}

addPropertyControls(AlthioNotFound, {
    code: {
        type: ControlType.String,
        title: "Code",
        defaultValue: "404",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "This page drifted off.",
        displayTextArea: true,
    },
    body: {
        type: ControlType.String,
        title: "Body",
        defaultValue:
            "The link may be old, or the page may have moved. The rest of Althio is still here — start from the beginning, or read what the clinical team has been writing.",
        displayTextArea: true,
    },
    primaryLabel: {
        type: ControlType.String,
        title: "Primary",
        defaultValue: "Back to home",
    },
    primaryLink: {
        type: ControlType.String,
        title: "Primary Link",
        defaultValue: "/",
    },
    secondaryLabel: {
        type: ControlType.String,
        title: "Secondary",
        defaultValue: "Read the journal",
    },
    secondaryLink: {
        type: ControlType.String,
        title: "Secondary Link",
        defaultValue: "/blog",
    },
})
