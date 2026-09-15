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
const WORDMARK_CHARS = WORDMARK_TEXT.split("");

// Resting opacity for the specular shine (see the layout effect's shine
// sizing and the CSS default below, which must match — the animated
// boot path fades in TO this exact value via GSAP, since an inline
// style set by GSAP would otherwise permanently override the CSS
// default rather than falling back to it).
const SHINE_RESTING_OPACITY = 0.55;

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
  const glyphGradientId = `${uid}-glyph-gradient`;
  const shineFilterId = `${uid}-shine-blur`;
  const shineGradientId = `${uid}-shine-gradient`;

  const textRef = useRef<SVGTextElement>(null);
  const glowRef = useRef<SVGGElement>(null);
  const innerGlowRef = useRef<SVGEllipseElement>(null);
  const outerGlowRef = useRef<SVGEllipseElement>(null);
  const shineRef = useRef<SVGEllipseElement>(null);
  const rLegPatchRef = useRef<SVGPathElement>(null);
  const tspanRefs = useRef<(SVGTSpanElement | null)[]>([]);

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
      // getBBox()'s own vertical center is NOT a good glow-center
      // reference: the script face's descenders/flourishes extend well
      // below the baseline and its capital loops well above cap-height,
      // inflating box.height (past the viewBox's own 220 units) and
      // pulling the geometric center away from where the letterforms'
      // actual visual weight sits. Anchoring to the real baseline (the
      // <text>'s own y attribute) minus a fraction of font-size —
      // approximating the midpoint between baseline and cap-height for a
      // typical Latin face — keeps the glow centered on the MAIN body of
      // the glyphs regardless of how far outlying flourishes reach.
      const fontSize = parseFloat(getComputedStyle(textRef.current).fontSize);
      const baselineY = parseFloat(textRef.current.getAttribute("y") ?? "0");
      const cy = baselineY - fontSize * 0.35;
      if (innerGlowRef.current) {
        gsap.set(innerGlowRef.current, {
          attr: {
            cx,
            cy,
            // rx stays derived from the text's own measured width (the
            // one dimension getBBox() measures reliably) so the glow
            // genuinely spans the full wordmark, not just its middle —
            // ry is derived from font-size instead of box.height for the
            // reason above, keeping the ellipse a wide, flat band
            // hugging the actual line of text rather than a tall,
            // near-circular blob that only covers a few middle letters.
            rx: box.width * 0.4,
            ry: fontSize * 0.55,
          },
        });
      }
      if (outerGlowRef.current) {
        gsap.set(outerGlowRef.current, {
          attr: {
            cx,
            cy,
            rx: box.width * 0.58,
            ry: fontSize * 0.85,
          },
        });
      }
      // The specular shine — a bright, tight streak riding along the
      // upper portion of the linework (roughly the cap-height band),
      // reading as light catching the tops of the strokes rather than a
      // second competing bloom. Same wide-flat-ellipse language as the
      // glow above, just smaller/brighter/higher up.
      if (shineRef.current) {
        gsap.set(shineRef.current, {
          attr: {
            cx,
            cy: baselineY - fontSize * 0.58,
            rx: box.width * 0.32,
            ry: fontSize * 0.13,
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

      // Dasharray/dashoffset must be sized PER GLYPH, not once for the
      // whole string: a single shared value (the old approach used the
      // full phrase's getComputedTextLength()) is compared against each
      // glyph's own outline length independently, so a glyph with a
      // shorter outline than that shared value — the R chief among them —
      // reaches "fully revealed" long before its neighbors even though
      // every glyph receives the same raw offset. Measuring and animating
      // each tspan against its own length keeps every glyph at the same
      // proportional reveal at every instant, regardless of shape.
      const tspans = tspanRefs.current.filter(
        (el): el is SVGTSpanElement => el !== null,
      );
      tspans.forEach((tspan) => {
        const glyphLength = tspan.getComputedTextLength();
        gsap.set(tspan, {
          strokeDasharray: glyphLength,
          strokeDashoffset: glyphLength,
        });
      });
      gsap.set(textRef.current, {
        fillOpacity: 0,
        strokeOpacity: 1,
      });
      gsap.set(glowRef.current, { opacity: 0 });
      if (rLegPatchRef.current) {
        gsap.set(rLegPatchRef.current, { fillOpacity: 0 });
      }
      if (shineRef.current) {
        gsap.set(shineRef.current, { opacity: 0 });
      }

      tl = gsap.timeline({ onComplete });
      tl.to(tspans, {
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
        .to(shineRef.current, { opacity: SHINE_RESTING_OPACITY, duration: 0.5 }, "<")
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
        {/* Glossy material fill (§10) for the letterforms themselves —
            replaces a flat solid pearl fill, which read as completely
            flat/uniform with no light response at all, inconsistent
            with every other glossy object on the site. Vertical sweep
            (bright pearl at top, catching light, settling to the
            palette's own icy-blue undertone then a warmer magenta
            toward the bottom) reads as a rounded/glossy stroke profile
            rather than a flat cutout, using objectBoundingBox (the
            default) so it automatically spans the live text's own
            rendered box regardless of how the phrase reflows. */}
        <linearGradient id={glyphGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-pearl)" />
          <stop offset="45%" stopColor="var(--color-ice-300)" />
          <stop offset="100%" stopColor="var(--color-magenta-300)" />
        </linearGradient>
        <filter id={shineFilterId} x="-50%" y="-150%" width="200%" height="400%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <radialGradient id={shineGradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
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
        fill={`url(#${glyphGradientId})`}
      >
        {WORDMARK_CHARS.map((char, i) => (
          <tspan
            key={i}
            ref={(el) => {
              tspanRefs.current[i] = el;
            }}
          >
            {char}
          </tspan>
        ))}
      </text>

      {/* Fills the hollow hole inside the capital R's own leg stroke —
          see R_LEG_HOLE_PATCH_D above. Positioned via a runtime transform
          (set in the effect once the real glyph position is known), fill
          only, no stroke. Same gradient as the live text so the patch
          reads as part of the same glossy ink, not a flatter graft. */}
      <path
        ref={rLegPatchRef}
        d={R_LEG_HOLE_PATCH_D}
        className="wordmark__glyphs"
        fill={`url(#${glyphGradientId})`}
        stroke="none"
      />

      {/* Specular shine (§10): a bright, tight streak riding along the
          upper/cap-height band of the linework, screen-blended and
          rendered ON TOP of the glyphs so it brightens the ink it
          overlaps — reading as light catching the tops of the strokes,
          the same language as every other glossy object's catch-light,
          adapted from a simple shape to a streak that can ride along a
          horizontal line of script. Sized/positioned in the layout
          effect once the real text geometry is known. */}
      <ellipse
        ref={shineRef}
        className="wordmark__shine"
        fill={`url(#${shineGradientId})`}
        filter={`url(#${shineFilterId})`}
      />
    </svg>
  );
}
