import { useId, useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import "./Wordmark.css";

/*
  The wordmark per §4: a light source, not a lit object — the one place
  in the whole material system that emits light rather than reflecting
  it (contrast .material-glossy's catch-light reflections). Used in two
  modes:

  - Desktop renders it statically (animate=false, the default): already
    fully drawn and glowing, no animation.
  - Boot renders it with animate, playing the draw-then-bloom sequence
    once and calling onComplete when it settles — this IS the boot
    sequence per §6 ("the wordmark switching on IS the boot"). Boot then
    fades its black overlay away to reveal the identical static version
    already sitting underneath, so there's no visible handoff/reset.

  Both Boot and Desktop can be mounted at once (Boot overlays Desktop
  during the boot sequence), so every id here is instance-scoped via
  useId() — sharing hardcoded ids across two simultaneous <svg> instances
  is invalid markup and risks a browser resolving url(#id) against the
  wrong instance's geometry.

  The stroke-dashoffset draw-on technique strokes each glyph's outline in
  sequence rather than tracing one true single-width pen line (that would
  need the font's own outline paths extracted via something like
  opentype.js) — but for a connected script face, animating the outline
  stroke left-to-right reads convincingly as "the signature being
  written," which a segmented letter-by-letter ignition never could for
  a script this connected.

  Capital R: back to Mrs Saint Delafield's own glyph (a prior pass
  substituted Fraunces italic for just this letter; reverted per
  direction — no second typeface). The font has no GSUB table and no
  alternate R glyph to swap in (verified against the binary), so if the
  resting, filled state is still ambiguous, the fix has to be a manual
  SVG path edit reinforcing the glyph's own leg stroke, not a font swap.
*/

const WORDMARK_TEXT = "Rianna Trivedi";

// Mrs Saint Delafield's capital R, extracted via opentype.js, is one
// outer contour plus two counter-holes (fill-rule evenodd): one is the
// loop's own counter (upper right), the other sits INSIDE the leg's own
// downstroke (x:5.7-65, y:-67.8 to 6.1 at this 150-unit em) — meaning
// the leg isn't a faint stroke, it's a hollow outline ribbon with no ink
// in the middle, which is exactly why it reads as insubstantial next to
// the bold closed loop above it ("Pianna" at a glance). This is that
// hole's own path, extracted at font-size 150 (matching .wordmark__glyphs'
// font-size) — filling it in solid, positioned exactly over the live
// text's own "R" via getStartPositionOfChar, turns the leg into real ink
// without touching the loop or drawing anything freehand.
const R_LEG_HOLE_PATCH_D =
  "M6.45,6.15 L6.45,6.15 Q9.90,6.15 21.15,-5.40 Q32.40,-16.95 45.45,-34.95 " +
  "Q58.50,-52.95 64.95,-67.80 L64.95,-67.80 Q41.25,-47.40 23.47,-25.65 " +
  "Q5.70,-3.90 5.70,5.10 L5.70,5.10 Q5.70,6.15 6.45,6.15";

interface WordmarkProps {
  animate?: boolean;
  onComplete?: () => void;
}

export function Wordmark({ animate = false, onComplete }: WordmarkProps) {
  const uid = useId();
  const bloomFilterId = `${uid}-bloom`;
  const innerGlowId = `${uid}-inner-glow`;
  const outerGlowId = `${uid}-outer-glow`;

  const textRef = useRef<SVGTextElement>(null);
  const glowRef = useRef<SVGGElement>(null);
  const innerGlowRef = useRef<SVGEllipseElement>(null);
  const outerGlowRef = useRef<SVGEllipseElement>(null);
  const rLegPatchRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let tl: gsap.core.Timeline | undefined;

    document.fonts.ready.then(() => {
      if (cancelled || !textRef.current) return;

      // Size the glow to the wordmark's own rendered silhouette instead
      // of a fixed shape, so it reads as light coming from the letters
      // themselves rather than a decorative shape sitting behind them.
      const box = textRef.current.getBBox();
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      // ry multipliers were 1.05/1.9 — against a bbox already taller than
      // the SVG's own 220-unit viewBox (the oversized cap + the script's
      // own descenders/flourishes push box.height past 260 units), that
      // produced an outer radius of ~496 units: a glow nearly 2.25x the
      // viewBox's own height, confirmed in isolation (Phase B.4) as a
      // ~670x790px blob covering almost the full frame. Brought down to
      // be proportionate to the width multipliers instead of compounding
      // an already-oversized measurement.
      if (innerGlowRef.current) {
        gsap.set(innerGlowRef.current, {
          attr: {
            cx,
            cy,
            rx: box.width * 0.42,
            ry: box.height * 0.5,
          },
        });
      }
      if (outerGlowRef.current) {
        gsap.set(outerGlowRef.current, {
          attr: {
            cx,
            cy,
            rx: box.width * 0.62,
            ry: box.height * 0.8,
          },
        });
      }

      // Position the leg patch exactly over the live text's own "R" —
      // getStartPositionOfChar gives the real browser-rendered glyph
      // origin (accounting for textAnchor="middle" centering the whole
      // string), so this stays correct regardless of font metrics/kerning.
      if (rLegPatchRef.current) {
        const start = textRef.current.getStartPositionOfChar(0);
        gsap.set(rLegPatchRef.current, {
          attr: { transform: `translate(${start.x}, ${start.y})` },
        });
      }

      if (!animate || !glowRef.current) return;

      const length = textRef.current.getComputedTextLength();
      gsap.set(textRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length,
        fillOpacity: 0,
        strokeOpacity: 1,
      });
      gsap.set(glowRef.current, { opacity: 0 });
      if (rLegPatchRef.current) {
        gsap.set(rLegPatchRef.current, { fillOpacity: 0 });
      }

      tl = gsap.timeline({ onComplete });
      tl.to(textRef.current, {
        strokeDashoffset: 0,
        duration: 2.4,
        ease: "power1.inOut",
      })
        .to(
          [textRef.current, rLegPatchRef.current].filter(Boolean),
          { fillOpacity: 1, duration: 0.5 },
          "-=0.15",
        )
        .to(textRef.current, { strokeOpacity: 0, duration: 0.5 }, "<")
        .to(glowRef.current, { opacity: 1, duration: 0.9 }, "-=0.3");
    });

    return () => {
      cancelled = true;
      tl?.kill();
    };
  }, [animate, onComplete]);

  return (
    <svg
      className="wordmark"
      viewBox="0 0 900 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={WORDMARK_TEXT}
    >
      <defs>
        <filter id={bloomFilterId} x="-100%" y="-150%" width="300%" height="400%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <radialGradient id={innerGlowId}>
          <stop offset="0%" stopColor="var(--color-pearl)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--color-magenta-300)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-magenta-300)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={outerGlowId}>
          <stop offset="0%" stopColor="var(--color-magenta-300)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="var(--color-magenta-400)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-magenta-400)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft outer bloom — appears only once the stroke finishes drawing.
          Two layered, heavily-blurred gradients (tight bright inner +
          much broader soft outer), both fading to fully transparent with
          no hard edge anywhere, screen-blended so they add light onto
          whatever's behind them instead of a flat tinted overpaint. */}
      <g ref={glowRef} className="wordmark__glow" filter={`url(#${bloomFilterId})`}>
        <ellipse ref={outerGlowRef} fill={`url(#${outerGlowId})`} />
        <ellipse ref={innerGlowRef} fill={`url(#${innerGlowId})`} />
      </g>

      <text
        ref={textRef}
        x="450"
        y="150"
        textAnchor="middle"
        className="wordmark__glyphs"
      >
        {WORDMARK_TEXT}
      </text>

      {/* Fills the hollow hole inside the capital R's own leg stroke —
          see R_LEG_HOLE_PATCH_D above. Positioned via a runtime transform
          (set in the effect once the real glyph position is known), fill
          only, no stroke. */}
      <path
        ref={rLegPatchRef}
        d={R_LEG_HOLE_PATCH_D}
        className="wordmark__glyphs"
        stroke="none"
      />
    </svg>
  );
}
