// @ts-nocheck
import { useEffect, useRef } from "react"

// Full-bleed not-found screen on the day sky, matching the hero image.

const DAY = "https://framerusercontent.com/images/YTgwKd8dFTqttTosKcOOtZXfF7k.jpg"

const CSS = `
#althio-404 {
  --cream: #FBF7F0;
  --ink: #23201C;
  --serif: "Charter", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
}
#althio-404 * { margin: 0; padding: 0; box-sizing: border-box; }

#althio-404 .nf {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  text-align: center;
  overflow: hidden;
  background-image: url("${DAY}");
  background-size: cover;
  background-position: center 40%;
}
/* Just enough shade behind the type for white to hold on a bright sky, and
   nothing at the edges so the clouds stay clean. */
#althio-404 .nf::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(66% 56% at 50% 46%, rgba(26, 36, 56, 0.44) 0%, rgba(26, 36, 56, 0.2) 60%, rgba(26, 36, 56, 0) 84%);
}
#althio-404 .nf-inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  padding: 120px 28px 90px;
}
#althio-404 .nf-code {
  font-family: var(--serif);
  font-size: clamp(112px, 21vw, 250px);
  font-weight: 700;
  line-height: 0.86;
  letter-spacing: -0.045em;
  color: #FFFFFF;
  text-shadow: 0 2px 30px rgba(24, 34, 54, 0.42);
}
#althio-404 .nf-title {
  font-family: var(--serif);
  font-size: clamp(24px, 3.6vw, 34px);
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: #FFFFFF;
  margin-top: 26px;
  text-shadow: 0 1px 18px rgba(24, 34, 54, 0.38);
}
#althio-404 .nf-sub {
  font-family: var(--sans);
  font-size: 16.5px;
  line-height: 1.65;
  color: #FFFFFF;
  margin-top: 14px;
  text-shadow: 0 1px 3px rgba(20, 28, 46, 0.55), 0 1px 20px rgba(20, 28, 46, 0.5);
}
#althio-404 .nf-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}
#althio-404 .nf-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--serif);
  font-size: 13.5px;
  padding: 8px 16px;
  border-radius: 999px;
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  background: var(--ink);
  color: var(--cream);
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(24, 34, 54, 0.22);
  transition: opacity .25s ease;
}
#althio-404 .nf-btn.ghost {
  background: rgba(251, 247, 240, 0.9);
  color: var(--ink);
  border-color: rgba(35, 32, 28, 0.12);
}
#althio-404 .nf-btn:hover { opacity: .85; }
#althio-404 .nf-btn .arw { transition: transform .3s cubic-bezier(.22,.9,.3,1); }
#althio-404 .nf-btn:hover .arw { transform: translateX(3px); }

@media (prefers-reduced-motion: reduce) {
  #althio-404 .nf-btn, #althio-404 .nf-btn .arw { transition: none; }
}
`

const MARKUP = `
<section class="nf">
  <div class="nf-inner">
    <p class="nf-code">404</p>
    <h1 class="nf-title">This page drifted off.</h1>
    <p class="nf-sub">The link may be old, or the page may have moved. The rest of Althio is still here — start from the beginning, or read what the clinical team has been writing.</p>
    <div class="nf-actions">
      <a class="nf-btn" href="/">Back to home <span class="arw">&rarr;</span></a>
      <a class="nf-btn ghost" href="/blog">Read the journal</a>
    </div>
  </div>
</section>
`

/**
 * Althio 404
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function AlthioNotFound(props: { style?: any }) {
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        // The nav only frosts after a scroll; this screen never scrolls, so it
        // would otherwise sit fully transparent over the sky.
        const bar = document.querySelector("#althio-nav nav")
        if (bar) bar.classList.add("scrolled")
        return () => {
            if (bar && window.scrollY <= 8) bar.classList.remove("scrolled")
        }
    }, [])

    return (
        <div
            id="althio-404"
            ref={rootRef}
            style={{ position: "relative", width: "100%", ...props.style }}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div dangerouslySetInnerHTML={{ __html: MARKUP }} />
        </div>
    )
}
