import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, type CSSProperties } from "react"

const SKY_DAY =
    "https://framerusercontent.com/images/YTgwKd8dFTqttTosKcOOtZXfF7k.jpg"
const SKY_NIGHT =
    "https://framerusercontent.com/images/gsLH8HuBy8l4orvqoXweyyNPWVA.jpg"

/**
 * Framer's phone breakpoint. The pinned scene runs at every width; this only
 * tunes it down for phones and sizes the reduced-motion fallback.
 */
const MOBILE_MAX = 809

interface Dot {
    x: number
    y: number
    /** Scene progress at which this dot starts to appear. */
    t: number
    /** True for the handful of dots that stand for the therapy hour itself. */
    hour: boolean
    r: number
    blue: boolean
    tw: number
}

interface Line {
    a: number
    b: number
    t: number
}

/** Deterministic field so the sky is identical on every render and every visit. */
function buildSky(): { dots: Dot[]; lines: Line[] } {
    let seed = 42
    const rng = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296

    const dots: Dot[] = []
    for (let i = 0; i < 150; i++) {
        const y = 0.05 + rng() * 0.9
        // Lower stars arrive later, once the day's clouds have dissolved.
        const lag = y * 0.1
        dots.push({
            x: 0.04 + rng() * 0.92,
            y,
            t: (i < 8 ? 0.6 : 0.64 + rng() * 0.22) + lag,
            hour: i < 8,
            r: i < 8 ? 1.7 : 0.6 + rng() * 0.9,
            blue: rng() < 0.72,
            tw: rng() * 6.28,
        })
    }

    // Join each dot to its nearest neighbour, keeping each pair once.
    const seen = new Set<string>()
    const lines: Line[] = []
    for (let i = 0; i < dots.length; i++) {
        let best = -1
        let bestDist = Infinity
        for (let j = 0; j < dots.length; j++) {
            if (i === j) continue
            const dx = dots[i].x - dots[j].x
            const dy = dots[i].y - dots[j].y
            const d = dx * dx + dy * dy
            if (d < bestDist) {
                bestDist = d
                best = j
            }
        }
        if (bestDist >= 0.02 || best < 0) continue
        const key = `${Math.min(i, best)}-${Math.max(i, best)}`
        if (seen.has(key)) continue
        seen.add(key)
        lines.push({
            a: Math.min(i, best),
            b: Math.max(i, best),
            t: 0.78 + rng() * 0.16,
        })
    }
    return { dots, lines }
}

const SKY = buildSky()

/**
 * The reduced-motion "week" step paints the same field the canvas animates.
 * Brighter and larger than the drawn stars: these sit on a pale daytime sky
 * with no darkening pass behind them, and at canvas values they vanished —
 * which left the caption promising lights that were not there.
 */
const STAR_GRADIENTS = SKY.dots
    .filter((dot) => !dot.hour)
    .slice(0, 46)
    .map((dot) => {
        const size = (dot.r * 2.4).toFixed(1)
        const alpha = dot.blue ? 0.9 : 0.98
        return `radial-gradient(${size}px ${size}px at ${(dot.x * 100).toFixed(1)}% ${(dot.y * 100).toFixed(1)}%, rgba(255,255,255,${alpha}) 0%, transparent 100%)`
    })
    .join(",\n    ")

const CSS = `
/* Open Runde — Laurids Kern, SIL Open Font License 1.1 */
@font-face{font-family:"Open Runde";font-weight:400;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Regular.woff2") format("woff2")}
@font-face{font-family:"Open Runde";font-weight:500;font-style:normal;font-display:swap;src:url("https://cdn.jsdelivr.net/gh/lauridskern/open-runde@1.0.1/src/web/OpenRunde-Medium.woff2") format("woff2")}

.althio-sky {
  --cream: #FBF7F0;
  --ink: #23201C;
  --ink-soft: rgba(35, 32, 28, 0.6);
  --display: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Open Runde", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  position: relative;
  width: 100%;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}
.althio-sky *, .althio-sky *::before, .althio-sky *::after { margin: 0; padding: 0; box-sizing: border-box; }

/* --p runs 0 -> 1 across the scene's scroll length. --pz is the zoom ramp,
   which finishes early so the panel is full-bleed before the fog clears. */
.althio-sky .scene { height: 380vh; --p: 0; --pz: clamp(0, calc(var(--p) * 3.5), 1); }
.althio-sky .sticky {
  position: sticky; top: 0; height: 100svh;
  display: grid; place-items: center;
  overflow: hidden;
}
.althio-sky .panel {
  position: relative;
  width: calc(min(1088px, 92vw) + (100vw - min(1088px, 92vw)) * var(--pz));
  height: calc(min(560px, 72svh) + (100svh - min(560px, 72svh)) * var(--pz));
  border-radius: calc(32px * (1 - var(--pz)));
  overflow: hidden;
  background: url("${SKY_DAY}") center 45% / cover no-repeat;
}
/* The haze: what a clinician normally cannot see through. */
.althio-sky .fog {
  position: absolute; inset: -25%;
  pointer-events: none;
  filter: blur(26px);
  opacity: clamp(0, calc((0.72 - var(--p)) * 2.6), 1);
}
.althio-sky .fog.f1 {
  background:
    radial-gradient(40% 34% at 30% 30%, rgba(255,255,255,0.96), transparent 70%),
    radial-gradient(46% 40% at 74% 62%, rgba(255,255,255,0.9), transparent 70%),
    radial-gradient(60% 50% at 50% 88%, rgba(255,255,255,0.88), transparent 70%);
  transform: translateX(calc(var(--p) * -9%));
  backdrop-filter: blur(clamp(0px, calc((0.72 - var(--p)) * 34px), 14px));
}
.althio-sky .fog.f2 {
  background:
    radial-gradient(44% 38% at 62% 22%, rgba(255,255,255,0.92), transparent 70%),
    radial-gradient(52% 44% at 20% 68%, rgba(255,255,255,0.94), transparent 70%);
  transform: translateX(calc(var(--p) * 9%));
}
/* Night falls as the patterns resolve. */
.althio-sky .nightlayer {
  position: absolute; inset: 0;
  background: url("${SKY_NIGHT}") center 45% / cover no-repeat;
  opacity: clamp(0, calc((var(--p) - 0.6) * 2.8), 1);
  pointer-events: none;
}
.althio-sky canvas.stars {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none;
}
.althio-sky .phase {
  position: absolute; inset: 0;
  display: grid; place-content: center; gap: 14px;
  text-align: center; padding: 0 24px;
  font-family: var(--display);
  font-size: clamp(26px, 3.6vw, 44px);
  letter-spacing: -0.02em; line-height: 1.18;
  text-wrap: balance;
  text-shadow: 0 1px 30px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.6);
  pointer-events: none;
}
.althio-sky .phase small {
  font-family: var(--sans); font-size: 12.5px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink-soft); text-shadow: none;
  max-width: 44ch; margin: 0 auto;
}
.althio-sky .ph1 { opacity: clamp(0, calc((0.35 - var(--p)) * 6), 1); }
.althio-sky .ph2 { opacity: min(clamp(0, calc((var(--p) - 0.40) * 10), 1), clamp(0, calc((0.68 - var(--p)) * 10), 1)); }
.althio-sky .ph3 {
  opacity: clamp(0, calc((var(--p) - 0.76) * 8), 1);
  color: #E9EDF8;
  text-shadow: 0 1px 30px rgba(8,12,28,0.9), 0 0 12px rgba(8,12,28,0.5);
}
.althio-sky .ph3 small { color: rgba(233, 237, 248, 0.72); }

.althio-sky .caption {
  max-width: 62ch; margin: 0 auto;
  text-align: center; padding: 40px 28px 0;
  font-size: 15px; color: var(--ink-soft);
}

/* Three plain sections, shown only under reduced motion. */
.althio-sky .stack { display: none; }
.althio-sky .step {
  position: relative;
  min-height: 78svh;
  display: grid; place-items: center;
  overflow: hidden;
  background-size: cover; background-repeat: no-repeat; background-position: center 45%;
}
.althio-sky .step figcaption {
  position: relative; z-index: 1;
  display: grid; gap: 14px;
  text-align: center; padding: 0 24px;
}
.althio-sky .step .st {
  font-family: var(--display);
  font-size: clamp(26px, 7.4vw, 38px);
  letter-spacing: -0.02em; line-height: 1.18;
  text-wrap: balance;
}
.althio-sky .step small {
  font-family: var(--sans); font-size: 12px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink-soft);
  max-width: 32ch; margin: 0 auto;
}
.althio-sky .step-hour, .althio-sky .step-week { background-image: url("${SKY_DAY}"); }
.althio-sky .step-night { background-image: url("${SKY_NIGHT}"); }
.althio-sky .step-night .st { color: #fff; text-shadow: 0 1px 24px rgba(10,14,24,0.5); }
.althio-sky .step-night small { color: rgba(255,255,255,0.74); }
/* The haze, matched to the desktop scene's opening state. */
.althio-sky .step-hour::after {
  content: ""; position: absolute; inset: 0;
  background:
    radial-gradient(46% 40% at 32% 34%, rgba(255,255,255,0.96), transparent 72%),
    radial-gradient(52% 46% at 72% 64%, rgba(255,255,255,0.92), transparent 72%),
    radial-gradient(70% 54% at 50% 90%, rgba(255,255,255,0.9), transparent 72%);
}
/* The lights: one per moment the patient shared. */
.althio-sky .step-week::after {
  content: ""; position: absolute; inset: 0;
  background:
    ${STAR_GRADIENTS};
}

/* The three plain sections are the fallback for anyone who asked not to be
   moved — at any width, not only on phones. */
@media (prefers-reduced-motion: reduce) {
  .althio-sky .scene { display: none; }
  .althio-sky .stack { display: block; }
}

/* Tablet: a shorter scroll so the scene does not outstay its welcome on a
   screen you hold, and a panel that starts closer to full width. */
@media (max-width: 1199px) {
  .althio-sky .scene { height: 300vh; }
  .althio-sky .panel {
    width: calc(min(1088px, 94vw) + (100vw - min(1088px, 94vw)) * var(--pz));
    height: calc(min(520px, 66svh) + (100svh - min(520px, 66svh)) * var(--pz));
  }
  .althio-sky .phase { font-size: clamp(24px, 4vw, 34px); }
  .althio-sky .phase small { font-size: 12px; max-width: 38ch; }
  .althio-sky .caption { padding: 32px 24px 0; max-width: 56ch; }
}

/* Phones run the same pinned scene: shorter to scroll through, and starting
   smaller so the zoom to full-bleed still reads on a narrow screen. */
@media (max-width: ${MOBILE_MAX}px) {
  .althio-sky .scene { height: 280vh; }
  .althio-sky .panel {
    width: calc(88vw + (100vw - 88vw) * var(--pz));
    height: calc(56svh + (100svh - 56svh) * var(--pz));
    border-radius: calc(20px * (1 - var(--pz)));
  }
  .althio-sky .phase {
    font-size: clamp(21px, 6.2vw, 27px);
    gap: 10px;
    padding: 0 22px;
  }
  .althio-sky .phase small { font-size: 11px; max-width: 30ch; }
  .althio-sky .step { min-height: 70svh; }
  .althio-sky .caption { padding: 28px 20px 0; font-size: 14.5px; }
}

/* One desktop rendering: fractions of a 1440px reference. The panel's start
   size scales with the viewport too, so the zoom covers the same distance on
   every screen; it still ends full-bleed, which is the point of the scene. */
@media (min-width: 1200px) {
  .althio-sky .panel {
    width: calc(75.556vw + (100vw - 75.556vw) * var(--pz));
    height: calc(
      min(38.889vw, 72svh) + (100svh - min(38.889vw, 72svh)) * var(--pz)
    );
    border-radius: calc(2.222vw * (1 - var(--pz)));
  }
  .althio-sky .phase { font-size: 3.056vw; gap: 0.972vw; }
  .althio-sky .phase small { font-size: 0.868vw; }
  .althio-sky .caption { padding: 2.778vw 1.944vw 0; font-size: 1.042vw; }
}
`

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

interface AlthioSkySceneProps {
    phase1Title: string
    phase1Note: string
    phase2Title: string
    phase2Note: string
    phase3Title: string
    phase3Note: string
    caption: string
    momentumScroll: boolean
    style?: CSSProperties
}

/**
 * Althio Sky Scene
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioSkyScene(props: AlthioSkySceneProps) {
    const {
        phase1Title,
        phase1Note,
        phase2Title,
        phase2Note,
        phase3Title,
        phase3Note,
        caption,
        momentumScroll,
    } = props

    const sceneRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isStatic = useIsStaticRenderer()
    const { dots, lines } = SKY

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const scene = sceneRef.current
        const canvas = canvasRef.current
        if (!scene || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const controller = new AbortController()
        const { signal } = controller
        let alive = true
        const frames: number[] = []
        const schedule = (cb: FrameRequestCallback) => {
            if (alive) frames.push(window.requestAnimationFrame(cb))
        }

        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const fine = window.matchMedia("(pointer: fine)").matches
        // Phones run the scene too; only reduced motion falls back to the stack.
        const pinned = !calm

        // Scene progress. Scroll sets a target and the value eases toward it, so
        // a single wheel step glides instead of jumping.
        let progress = pinned ? 0 : 1
        let target = progress

        const readTarget = () => {
            const rect = scene.getBoundingClientRect()
            const travel = rect.height - window.innerHeight || 1
            target = clamp01(-rect.top / travel)
        }

        if (!pinned) {
            // Phones and reduced-motion get the finished state; the scene is a
            // plain section there, so scroll must not drive the panel.
            scene.style.setProperty("--p", "1")
        } else {
            window.addEventListener("scroll", readTarget, { passive: true, signal })
            window.addEventListener("resize", readTarget, { signal })
            readTarget()
            progress = target
            const ease = () => {
                progress += (target - progress) * 0.16
                if (Math.abs(target - progress) < 0.0004) progress = target
                scene.style.setProperty("--p", progress.toFixed(4))
                schedule(ease)
            }
            schedule(ease)
        }

        // Desktop momentum scrolling. The wheel drives a target the page eases
        // toward; native scroll position still moves, so sticky/fixed keep working.
        // Wheel only — touch and trackpad-as-touch keep the operating system feel.
        if (momentumScroll && pinned && fine) {
            const previousBehavior = document.documentElement.style.scrollBehavior
            // Our glide owns the animation, so native smooth scrolling must be off.
            document.documentElement.style.scrollBehavior = "auto"
            signal.addEventListener("abort", () => {
                document.documentElement.style.scrollBehavior = previousBehavior
            })

            let glideTarget = window.scrollY
            let glidePos = window.scrollY
            let gliding = false
            const maxY = () =>
                document.documentElement.scrollHeight - window.innerHeight

            const glide = () => {
                glidePos += (glideTarget - glidePos) * 0.11
                if (Math.abs(glideTarget - glidePos) < 0.4) {
                    glidePos = glideTarget
                    gliding = false
                }
                window.scrollTo(0, glidePos)
                if (gliding) schedule(glide)
            }
            const glideTo = (y: number) => {
                glideTarget = Math.max(0, Math.min(maxY(), y))
                if (gliding) return
                gliding = true
                glidePos = window.scrollY
                schedule(glide)
            }

            window.addEventListener(
                "wheel",
                (event) => {
                    if (event.ctrlKey) return
                    event.preventDefault()
                    const step =
                        event.deltaMode === 1
                            ? event.deltaY * 16
                            : event.deltaMode === 2
                              ? event.deltaY * window.innerHeight
                              : event.deltaY
                    glideTo(glideTarget + step)
                },
                { passive: false, signal }
            )
            window.addEventListener(
                "scroll",
                () => {
                    if (!gliding) glideTarget = glidePos = window.scrollY
                },
                { passive: true, signal }
            )
            // In-page anchors have to ride the same glide or they fight it.
            document.addEventListener(
                "click",
                (event) => {
                    const target = event.target
                    if (!(target instanceof Element)) return
                    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]')
                    const hash = anchor?.getAttribute("href")
                    if (!hash || hash === "#") return
                    const destination = document.querySelector(hash)
                    if (!destination) return
                    event.preventDefault()
                    glideTo(
                        destination.getBoundingClientRect().top + window.scrollY
                    )
                },
                { signal }
            )
        }

        // The cursor feeds the constellation: nearby stars brighten and thin
        // lines reach from the hand to the closest moments.
        let pointerX = -1e4
        let pointerY = -1e4
        if (fine && !calm) {
            window.addEventListener(
                "pointermove",
                (event) => {
                    pointerX = event.clientX
                    pointerY = event.clientY
                },
                { passive: true, signal }
            )
        }

        const draw = (now: number) => {
            const w = canvas.clientWidth
            const h = canvas.clientHeight
            // Phones are dense and slow in equal measure; 1.5x is plenty for
            // one-pixel stars and keeps the canvas cheap to repaint.
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                window.innerWidth <= MOBILE_MAX ? 1.5 : 2
            )
            if (
                canvas.width !== Math.round(w * dpr) ||
                canvas.height !== Math.round(h * dpr)
            ) {
                canvas.width = Math.round(w * dpr)
                canvas.height = Math.round(h * dpr)
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)

            // Night factor: as the sky darkens, dots become faint stars.
            const night = clamp01((progress - 0.6) * 2.8)
            const mix = (day: number, dark: number) =>
                Math.round(day + (dark - day) * night)
            const rect = canvas.getBoundingClientRect()
            const handX = pointerX - rect.left
            const handY = pointerY - rect.top

            ctx.lineWidth = 0.5
            for (const line of lines) {
                const a = dots[line.a]
                const b = dots[line.b]
                const alpha =
                    clamp01((progress - line.t) * 6) *
                    clamp01((progress - a.t) * 8) *
                    clamp01((progress - b.t) * 8)
                if (alpha <= 0) continue
                ctx.strokeStyle = `rgba(${mix(35, 205)}, ${mix(32, 215)}, ${mix(28, 245)}, ${alpha * (0.14 + 0.16 * night)})`
                ctx.beginPath()
                ctx.moveTo(a.x * w, a.y * h)
                ctx.lineTo(b.x * w, b.y * h)
                ctx.stroke()
            }

            const near: { x: number; y: number; dist: number; boost: number }[] = []
            for (const dot of dots) {
                const alpha = dot.hour
                    ? 0.7 * clamp01((progress - 0.6) * 5)
                    : clamp01((progress - dot.t) * 8) * (0.45 + 0.25 * night)
                if (alpha <= 0) continue
                const x = dot.x * w
                const y = dot.y * h
                const dist = Math.hypot(x - handX, y - handY)
                const boost = clamp01(1 - dist / 200)
                if (boost > 0.05) near.push({ x, y, dist, boost })
                const twinkle = calm ? 1 : 0.88 + 0.12 * Math.sin(now * 0.0012 + dot.tw)
                const colour = dot.hour
                    ? `${mix(35, 232)}, ${mix(32, 238)}, ${mix(28, 252)}`
                    : dot.blue
                      ? `${mix(64, 205)}, ${mix(104, 220)}, ${mix(160, 250)}`
                      : `${mix(190, 248)}, ${mix(122, 236)}, ${mix(100, 215)}`
                ctx.fillStyle = `rgba(${colour}, ${Math.min(1, alpha * (1 + boost * 2)) * twinkle})`
                ctx.beginPath()
                ctx.arc(x, y, dot.r * (1 + boost * 0.9), 0, Math.PI * 2)
                ctx.fill()
            }

            // Touch the sky: lines from the hand to the closest moments.
            near.sort((u, v) => u.dist - v.dist)
            ctx.lineWidth = 0.8
            for (const point of near.slice(0, 5)) {
                ctx.strokeStyle = `rgba(${mix(35, 225)}, ${mix(32, 232)}, ${mix(28, 252)}, ${0.5 * point.boost})`
                ctx.beginPath()
                ctx.moveTo(handX, handY)
                ctx.lineTo(point.x, point.y)
                ctx.stroke()
            }

            schedule(draw)
        }
        schedule(draw)

        return () => {
            alive = false
            for (const frame of frames) window.cancelAnimationFrame(frame)
            controller.abort()
        }
    }, [isStatic, momentumScroll])

    return (
        <section className="althio-sky" style={props.style}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            <div
                className="scene"
                ref={sceneRef}
                style={isStatic ? ({ "--p": 1 } as CSSProperties) : undefined}
                aria-label="An hour of therapy versus a week of listening"
            >
                <div className="sticky">
                    <div className="panel">
                        <div className="fog f1" aria-hidden="true" />
                        <div className="fog f2" aria-hidden="true" />
                        <div className="nightlayer" aria-hidden="true" />
                        <canvas className="stars" ref={canvasRef} aria-hidden="true" />
                        <p className="phase ph1">
                            {phase1Title}
                            <small>{phase1Note}</small>
                        </p>
                        <p className="phase ph2">
                            {phase2Title}
                            <small>{phase2Note}</small>
                        </p>
                        <p className="phase ph3">
                            {phase3Title}
                            <small>{phase3Note}</small>
                        </p>
                    </div>
                </div>
            </div>

            <div className="stack" aria-label="How the picture builds">
                <figure className="step step-hour">
                    <figcaption>
                        <span className="st">{phase1Title}</span>
                        <small>{phase1Note}</small>
                    </figcaption>
                </figure>
                <figure className="step step-week">
                    <figcaption>
                        <span className="st">{phase2Title}</span>
                        <small>{phase2Note}</small>
                    </figcaption>
                </figure>
                <figure className="step step-night">
                    <figcaption>
                        <span className="st">{phase3Title}</span>
                        <small>{phase3Note}</small>
                    </figcaption>
                </figure>
            </div>

            <p className="caption">{caption}</p>
        </section>
    )
}

addPropertyControls(AlthioSkyScene, {
    phase1Title: {
        type: ControlType.String,
        title: "Phase 1",
        defaultValue: "An hour a week can only hear so much.",
        displayTextArea: true,
    },
    phase1Note: {
        type: ControlType.String,
        title: "Note 1",
        defaultValue: "These few moments are what a clinician usually gets",
        displayTextArea: true,
    },
    phase2Title: {
        type: ControlType.String,
        title: "Phase 2",
        defaultValue: "Althio listens through all 168 hours.",
        displayTextArea: true,
    },
    phase2Note: {
        type: ControlType.String,
        title: "Note 2",
        defaultValue: "Each light is a moment the patient shared",
        displayTextArea: true,
    },
    phase3Title: {
        type: ControlType.String,
        title: "Phase 3",
        defaultValue: "Patterns surface. Care becomes continuous.",
        displayTextArea: true,
    },
    phase3Note: {
        type: ControlType.String,
        title: "Note 3",
        defaultValue: "The full picture reaches the clinician before every session",
        displayTextArea: true,
    },
    caption: {
        type: ControlType.String,
        title: "Caption",
        defaultValue:
            "A clinician sees a handful of moments. Althio sees the week — and connects it into one clear picture, so every session starts from understanding, not catch-up.",
        displayTextArea: true,
    },
    momentumScroll: {
        type: ControlType.Boolean,
        title: "Glide Scroll",
        defaultValue: true,
        description: "Eased wheel scrolling on desktop pointers.",
    },
})
