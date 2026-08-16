import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useMemo, type CSSProperties } from "react"

/**
 * Splits text into words of individually indexed characters. Words stay whole
 * and the spaces between them stay real text nodes, so the browser still has
 * its usual break opportunities and the line wraps exactly as before —
 * splitting on every character including spaces would not.
 */
function splitLetters(text: string): { chars: { ch: string; i: number }[] }[] {
    let index = 0
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({
            chars: Array.from(word).map((ch) => ({ ch, i: index++ })),
        }))
}

const SKY_DAY =
    "https://framerusercontent.com/images/YTgwKd8dFTqttTosKcOOtZXfF7k.jpg"

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:600;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Semibold.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:700;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Bold.woff2") format("woff2")}

.althio-hero {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --card: #FFFFFF;
  --skyblue: #D9E7F6;
  --pink: #F6E0D8;
  --lav: #E5E3F2;
  --line: rgba(35, 32, 28, 0.12);
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  text-align: center;
  padding: 170px 0 90px;
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
.althio-hero *, .althio-hero *::before, .althio-hero *::after { margin: 0; padding: 0; box-sizing: border-box; }
.althio-hero .wrap { max-width: 1120px; margin: 0 auto; padding: 0 28px; }

/* Announcement pill: a bordered chip, the headline of the post, and an arrow. */
.althio-hero .pill {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 5px 14px 5px 5px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  color: var(--ink);
  font-size: 14px;
  text-decoration: none;
  transition: border-color .25s ease, background .25s ease, transform .25s cubic-bezier(.22,.9,.3,1);
}
.althio-hero .pill:hover { border-color: rgba(35, 32, 28, 0.26); background: rgba(255, 255, 255, 0.86); }
.althio-hero .pill:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
.althio-hero .pill .tag {
  padding: 3px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--cream);
  font-size: 12.5px;
  font-weight: 500;
}
/* The same arrow the buttons use, so the pill reads as the one thing to click. */
.althio-hero .pill .chev {
  display: inline-block;
  line-height: 1;
  color: var(--ink-soft);
  transition: transform .3s cubic-bezier(.22,.9,.3,1);
}
.althio-hero .pill:hover .chev { transform: translateX(3px); }

.althio-hero h1 {
  font-family: var(--display);
  font-weight: 500;
  font-size: clamp(42px, 6vw, 78px);
  line-height: 1.06;
  letter-spacing: -0.025em;
  max-width: 17ch;
  margin: 26px auto 0;
  text-wrap: balance;
}
/* The hero arrives as one sequence on a single clock, derived from --n, the
   number of letters in the headline lead, so the pacing holds if the copy
   changes:
     pill      0ms
     letters   80ms, one every 20ms
     accent    140ms + n*20ms
     subhead   780ms + n*20ms — a held beat after the title settles
     buttons   1000ms + n*20ms
   Everything is scoped to .play, which the static render leaves off: these
   animations fill backwards from opacity 0, so without that guard the export
   would ship an invisible hero. */
@keyframes althioHeroReveal {
  from { opacity: 0; filter: blur(10px); }
  to { opacity: 1; filter: blur(0px); }
}
/* Blocks also rise slightly. The headline groups cannot: transform has no
   effect on a non-replaced inline box, and they must stay inline to wrap. */
@keyframes althioHeroRise {
  from { opacity: 0; filter: blur(10px); transform: translateY(10px); }
  to { opacity: 1; filter: blur(0px); transform: none; }
}
.althio-hero.play h1 .ltr {
  display: inline;
  animation: althioHeroReveal .4s ease-out both;
  animation-delay: calc(80ms + var(--i, 0) * 20ms);
  will-change: opacity, filter;
}
/* The accent clears as one piece, not per letter: its sky fill is a single
   background image clipped to the text, so a per-letter split would restart
   the image inside every character and shatter the picture. */
.althio-hero.play h1 .accent {
  display: inline;
  animation: althioHeroReveal .58s cubic-bezier(.22,.61,.36,1) both;
  animation-delay: calc(140ms + var(--n, 0) * 20ms);
  will-change: opacity, filter;
}
.althio-hero.play .pill,
.althio-hero.play .sub,
.althio-hero.play .actions {
  animation: althioHeroRise .66s cubic-bezier(.22,.61,.36,1) both;
  will-change: opacity, filter, transform;
}
.althio-hero.play .pill { animation-delay: 0ms; }
.althio-hero.play .sub { animation-delay: calc(780ms + var(--n, 0) * 20ms); }
.althio-hero.play .actions { animation-delay: calc(1000ms + var(--n, 0) * 20ms); }

/* The accent clause is filled with the daytime sky rather than a flat colour. */
.althio-hero h1 .skytext {
  background: url("${SKY_DAY}") 2% 4% / 260% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-style: italic;
  filter: saturate(2.1) contrast(1.06);
}
.althio-hero .sub {
  margin: 26px auto 0;
  max-width: 54ch;
  font-size: 19px;
  color: var(--ink-soft);
}
.althio-hero .actions {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
  margin-top: 34px;
}

.althio-hero .btn {
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
/* A slow band of light crosses the surface, like sun moving over the panel. */
.althio-hero .btn::before {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 48%, transparent 66%);
  transform: translateX(-120%);
  transition: transform .7s cubic-bezier(.3,.8,.3,1);
  z-index: -1;
}
.althio-hero .btn:hover::before { transform: translateX(120%); }
.althio-hero .btn:active { transform: scale(0.98); transition-duration: .1s; }
.althio-hero .btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
.althio-hero .btn.ghost {
  background: transparent; color: var(--ink);
  border: 1px solid var(--line); box-shadow: none;
}
.althio-hero .btn.ghost::before { background: linear-gradient(105deg, transparent 30%, rgba(35,32,28,0.05) 48%, transparent 66%); }
.althio-hero .btn.ghost:hover { background: var(--card); }

@media (prefers-reduced-motion: reduce) {
  .althio-hero.play h1 .ltr,
  .althio-hero.play h1 .accent,
  .althio-hero.play .pill,
  .althio-hero.play .sub,
  .althio-hero.play .actions {
    animation: none;
    opacity: 1;
    filter: none;
    transform: none;
  }
  .althio-hero .btn, .althio-hero .btn::before,
  .althio-hero .pill, .althio-hero .pill .chev { transition: none; }
  .althio-hero .btn:hover { transform: none; }
  .althio-hero .btn:hover::before { transform: translateX(-120%); }
  .althio-hero .pill:hover .chev { transform: none; }
}

/* Tablet: the bar is shorter here, so the hero starts higher. */
@media (max-width: 1199px) {
  .althio-hero { padding: 138px 0 76px; }
  .althio-hero .wrap { padding: 0 24px; }
  .althio-hero h1 { font-size: clamp(44px, 7vw, 62px); max-width: 15ch; margin-top: 24px; }
  .althio-hero .sub { font-size: 16.5px; max-width: 52ch; margin-top: 22px; }
  .althio-hero .actions { margin-top: 30px; }
}

@media (max-width: 809px) {
  /* A full first screen: the hero runs to the bottom of the viewport and
     centres its content between the bar and the fold. */
  .althio-hero {
    min-height: 100svh;
    display: flex; align-items: center;
    padding: 92px 0 52px;
  }
  .althio-hero .wrap { width: 100%; padding: 0 20px; }
  .althio-hero .pill { font-size: 13px; gap: 8px; padding: 4px 12px 4px 4px; }
  .althio-hero .pill .tag { font-size: 12px; padding: 3px 9px; }
  .althio-hero .pill .chev { font-size: 13px; }
  .althio-hero h1 { font-size: clamp(37px, 11vw, 54px); max-width: 13ch; margin-top: 20px; }
  .althio-hero .sub { font-size: 15px; max-width: 42ch; margin-top: 18px; }
  .althio-hero .actions { margin-top: 26px; gap: 10px; }
  .althio-hero .btn { padding: 11px 20px; }
}

/* The narrowest phones: keep both buttons on one row. They still fit, and
   flex-wrap on .actions catches anything narrower than they do. */
@media (max-width: 400px) {
  .althio-hero .actions { gap: 8px; }
  .althio-hero .btn { padding: 11px 16px; }
}

/* One desktop rendering. Above 1200px every size is a fraction of a 1440px
   reference (1vw = 14.4px there), so a 1280 laptop and a 2560 monitor show the
   same composition at the same proportions instead of differently-sized type
   in a differently-shaped column. Hairlines stay at 1px so they stay crisp. */
@media (min-width: 1200px) {
  .althio-hero { padding: 11.806vw 0 6.25vw; font-size: 1.181vw; }
  .althio-hero .wrap { max-width: 77.778vw; padding: 0 1.944vw; }
  .althio-hero .pill {
    gap: 0.694vw;
    padding: 0.347vw 0.972vw 0.347vw 0.347vw;
    font-size: 0.972vw;
  }
  .althio-hero .pill .tag { padding: 0.208vw 0.764vw; font-size: 0.868vw; }
  .althio-hero h1 { font-size: 5.417vw; margin-top: 1.806vw; }
  .althio-hero .sub { margin-top: 1.806vw; font-size: 1.319vw; }
  .althio-hero .actions { margin-top: 2.361vw; gap: 0.833vw; }
  .althio-hero .btn { padding: 0.625vw 1.25vw; font-size: 0.972vw; gap: 0.486vw; }
}
`

interface AlthioHeroProps {
    showPill: boolean
    pillTag: string
    pillLabel: string
    pillLink: string
    headlineLead: string
    headlineAccent: string
    subhead: string
    primaryLabel: string
    primaryLink: string
    secondaryLabel: string
    secondaryLink: string
    style?: CSSProperties
}

/**
 * Althio Hero
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioHero(props: AlthioHeroProps) {
    const {
        showPill,
        pillTag,
        pillLabel,
        pillLink,
        headlineLead,
        headlineAccent,
        subhead,
        primaryLabel,
        primaryLink,
        secondaryLabel,
        secondaryLink,
    } = props

    // The static render has no animation to play, and a headline held at
    // opacity 0 by fill:both would be an invisible headline in the export.
    const isStatic = useIsStaticRenderer()
    const leadWords = useMemo(() => splitLetters(headlineLead), [headlineLead])
    const letterCount = useMemo(
        () => leadWords.reduce((total, word) => total + word.chars.length, 0),
        [leadWords]
    )

    return (
        <header
            className={`althio-hero${isStatic ? "" : " play"}`}
            style={
                { "--n": letterCount, ...props.style } as CSSProperties
            }
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="wrap">
                {showPill && (
                    <a className="pill" href={pillLink}>
                        <span className="tag">{pillTag}</span>
                        <span>{pillLabel}</span>
                        <span className="chev" aria-hidden="true">
                            &rarr;
                        </span>
                    </a>
                )}
                <h1>
                    {isStatic ? (
                        <>
                            {headlineLead}{" "}
                            <span className="skytext">{headlineAccent}</span>
                        </>
                    ) : (
                        <>
                            {leadWords.map((word, wordIndex) => (
                                <span key={wordIndex}>
                                    {word.chars.map(({ ch, i }) => (
                                        <span
                                            className="ltr"
                                            key={i}
                                            style={{ "--i": i } as CSSProperties}
                                        >
                                            {ch}
                                        </span>
                                    ))}{" "}
                                </span>
                            ))}
                            <span className="accent">
                                <span className="skytext">{headlineAccent}</span>
                            </span>
                        </>
                    )}
                </h1>
                <p className="sub">{subhead}</p>
                <div className="actions">
                    <a className="btn" href={primaryLink}>
                        {primaryLabel}
                    </a>
                    <a className="btn ghost" href={secondaryLink}>
                        {secondaryLabel}
                    </a>
                </div>
            </div>
        </header>
    )
}

addPropertyControls(AlthioHero, {
    showPill: {
        type: ControlType.Boolean,
        title: "Pill",
        defaultValue: true,
    },
    pillTag: {
        type: ControlType.String,
        title: "Tag",
        defaultValue: "New",
        hidden: (props) => !props.showPill,
    },
    pillLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "The 167 hours a therapist never sees",
        hidden: (props) => !props.showPill,
    },
    pillLink: {
        type: ControlType.String,
        title: "Link",
        defaultValue: "/blog/the-167-hours-a-therapist-never-sees",
        hidden: (props) => !props.showPill,
    },
    headlineLead: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Therapy is one hour a week. Althio holds",
        displayTextArea: true,
    },
    headlineAccent: {
        type: ControlType.String,
        title: "Accent",
        defaultValue: "the space between.",
    },
    subhead: {
        type: ControlType.String,
        title: "Subhead",
        defaultValue:
            "Althio is an AI context layer for clinical teams. It stays with your patients through the week, and it turns what happens between sessions into context their clinician can act on.",
        displayTextArea: true,
    },
    primaryLabel: {
        type: ControlType.String,
        title: "Primary",
        defaultValue: "Request a demo",
    },
    primaryLink: {
        type: ControlType.String,
        title: "Primary Link",
        defaultValue: "/demo",
    },
    secondaryLabel: {
        type: ControlType.String,
        title: "Secondary",
        defaultValue: "How it works",
    },
    secondaryLink: {
        type: ControlType.String,
        title: "Secondary Link",
        defaultValue: "#how",
    },
})
