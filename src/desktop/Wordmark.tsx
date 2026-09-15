import { useId, useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { useTimeOfDay } from "../boot/timeOfDay";
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
// Dusk/dawn's busier, brighter sky sits right behind the shine's own
// screen-blended streak, eating into the contrast it needs to still read
// as a distinct highlight rather than night's calmer near-black backdrop
// — boosted here (both the CSS default below, via .wordmark__shine--
// bright, and this animated boot path's own target) rather than left at
// night's more subtle level.
const SHINE_BRIGHT_OPACITY = 0.85;

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

// Two earlier passes tried shifting dusk/dawn to a distinctly different
// SATURATED hue family (rich jewel tones, then lighter coral/violet) to
// hold contrast — both read as "a colored logo" rather than the same
// white/pearl signature night uses, which was never the actual ask.
// This version keeps the gradient overwhelmingly pearl/white (matching
// night's own base) and only breathes in a trace of each state's own
// ambient light: --color-horizon-color is never itself the palette's
// lightest tone (see Wallpaper.tsx — it's "the richest, most saturated
// point in the scene," and the mountains/clouds derive their OWN lighter
// tints from mixing it heavily with pearl, e.g. duskCloudColor =
// mixHex(pearl, duskHorizon, 0.35)), so these stops replicate that exact
// mostly-pearl-plus-a-touch-of-horizon-hue recipe rather than inventing
// a new one — a nested color-mix() reproducing Wallpaper.tsx's own
// duskHorizon/dawnHorizon formulas (same token ingredients, same mix
// ratios), then blending that at just 15%/25% into pearl. The result
// reads as "white catching a hint of the sky around it," not a color
// swap — contrast against the sky comes from the soft shadow and the
// boosted shine below, not from hue-shifting the letters themselves.
// Reproduces Wallpaper.tsx's own duskHorizon formula exactly (same
// tokens, same two mix ratios: magenta-vivid-600/horizon-gold at 65/35,
// then blended 75/25 with plum-500 for the same restrained-coral
// muting) — kept in sync with that file's atmosphere-pass palette rather
// than an independent guess, since this tint is meant to read as "the
// wordmark catching dusk's own horizon light," not a color of its own.
const DUSK_HORIZON_TINT =
  "color-mix(in srgb, color-mix(in srgb, var(--color-magenta-vivid-600) 65%, var(--color-horizon-gold) 35%) 75%, var(--color-plum-500) 25%)";
// Same idea for dawn: Wallpaper.tsx's dawnHorizon is horizon-gold muted
// down with chrome-300's own desaturated lavender (45/55) into a
// restrained peach, replicated here token-for-token.
const DAWN_HORIZON_TINT =
  "color-mix(in srgb, var(--color-horizon-gold) 45%, var(--color-chrome-300) 55%)";

const BRIGHT_SKY_GRADIENTS: Record<"dusk" | "dawn", { offset: string; color: string }[]> = {
  dusk: [
    { offset: "0%", color: "var(--color-pearl)" },
    {
      offset: "45%",
      color: `color-mix(in srgb, var(--color-pearl) 85%, ${DUSK_HORIZON_TINT} 15%)`,
    },
    {
      offset: "100%",
      color: `color-mix(in srgb, var(--color-pearl) 75%, ${DUSK_HORIZON_TINT} 25%)`,
    },
  ],
  dawn: [
    { offset: "0%", color: "var(--color-pearl)" },
    {
      offset: "45%",
      color: `color-mix(in srgb, var(--color-pearl) 85%, ${DAWN_HORIZON_TINT} 15%)`,
    },
    {
      offset: "100%",
      color: `color-mix(in srgb, var(--color-pearl) 75%, ${DAWN_HORIZON_TINT} 25%)`,
    },
  ],
};

// A soft, blurred dark halo (never a stroke/outline — see the file
// header note below) behind the letterforms — now doing MOST of the
// contrast work, since the gradient itself stays close to pearl/white
// rather than shifting hue for separation. Strengthened from the
// coral/violet-era values accordingly; blur/opacity differ slightly per
// state since dusk's warmer tint and dawn's cooler one read slightly
// differently against their own skies.
const BRIGHT_SKY_SHADOWS: Record<"dusk" | "dawn", { blur: number; opacity: number }> = {
  dusk: { blur: 4, opacity: 0.45 },
  dawn: { blur: 6, opacity: 0.55 },
};

export function Wordmark({ animate = false, onComplete }: WordmarkProps) {
  const uid = useId();
  const glowTightBlurId = `${uid}-glow-tight`;
  const glowSoftBlurId = `${uid}-glow-soft`;
  const glyphGradientId = `${uid}-glyph-gradient`;
  const shineFilterId = `${uid}-shine-blur`;
  const shineGradientId = `${uid}-shine-gradient`;

  // Night's sky sits near-black behind the wordmark, so the gradient's
  // pearl/icy-blue/magenta sweep (tuned against that dark backdrop) reads
  // with strong contrast there. Dusk and dawn's sky is bright and close
  // in hue to a pale gradient, so it washes out. Two earlier passes tried
  // fixing this by changing what color the letters ARE (a hard outline
  // filter — reverted, read as a traced sticker border; then a shift to
  // saturated coral/violet — reverted, read as a colored logo instead of
  // the same white/pearl signature). This version keeps the letters
  // white/pearl (see BRIGHT_SKY_GRADIENTS above) and gets its contrast
  // from the soft blurred shadow and boosted shine below instead.
  const timeOfDay = useTimeOfDay();
  const brightSky = timeOfDay === "dusk" || timeOfDay === "dawn";
  const dropShadowFilterId = `${uid}-drop-shadow`;
  const shadowConfig = brightSky ? BRIGHT_SKY_SHADOWS[timeOfDay] : null;

  const textRef = useRef<SVGTextElement>(null);
  const glowRef = useRef<SVGGElement>(null);
  const shineRef = useRef<SVGEllipseElement>(null);
  const rLegPatchRef = useRef<SVGPathElement>(null);
  const tspanRefs = useRef<(SVGTSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    let cancelled = false;
    let tl: gsap.core.Timeline | undefined;

    document.fonts.ready.then(() => {
      if (cancelled || !textRef.current) return;

      // The glow no longer needs any manual sizing here — it's built by
      // blurring the actual text glyphs (see the glow-tight/glow-soft
      // duplicate <text> elements in the JSX below), so it automatically
      // traces the real letterforms' own silhouette at every size/reflow
      // instead of an independently-sized shape that has to be measured
      // and kept in sync. The measurements below are still needed for
      // the shine streak and the R-leg patch, both untouched.
      const box = textRef.current.getBBox();
      const cx = box.x + box.width / 2;
      const fontSize = parseFloat(getComputedStyle(textRef.current).fontSize);
      const baselineY = parseFloat(textRef.current.getAttribute("y") ?? "0");
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
        .to(
          shineRef.current,
          { opacity: brightSky ? SHINE_BRIGHT_OPACITY : SHINE_RESTING_OPACITY, duration: 0.5 },
          "<",
        )
        .to(glowRef.current, { opacity: 1, duration: 0.9 }, "-=0.3");
    });

    return () => {
      cancelled = true;
      tl?.kill();
    };
    // timeOfDay (via brightSky) decides the boot draw's final shine
    // target only — re-running this effect on a time-of-day change just
    // redoes the cheap geometry sizing above; boot's own animate=true
    // pass always completes (~3.3s) long before the ~20s idle cycle can
    // advance, so it never actually re-triggers mid-draw in practice.
  }, [animate, onComplete, brightSky]);

  return (
    <svg
      className="wordmark"
      viewBox="0 0 900 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={WORDMARK_TEXT}
    >
      <defs>
        {/* The glow (§4: "a light source, not a lit object") is built by
            blurring the actual glyph shapes (see the two duplicate <text>
            layers below), not a separately-shaped graphic sitting behind
            them — a wide flat ellipse independently sized from the text's
            bounding box read as a horizontal band/spotlight rather than
            light genuinely coming from the letters, since its silhouette
            had nothing to do with where the ink actually is. Blurring the
            glyphs themselves means the glow's brightness naturally
            concentrates wherever the letterforms are dense (the loops,
            the joins) and falls off radially around each stroke, exactly
            hugging the text's real shape at every size/reflow. Two
            layers, tight-then-soft, same "hot center fading to broad
            ambient touch" language the old ellipse pair used — just
            correctly shaped now. */}
        <filter id={glowTightBlurId} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={glowSoftBlurId} x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
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
          {brightSky ? (
            BRIGHT_SKY_GRADIENTS[timeOfDay].map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))
          ) : (
            <>
              <stop offset="0%" stopColor="var(--color-pearl)" />
              <stop offset="45%" stopColor="var(--color-ice-300)" />
              <stop offset="100%" stopColor="var(--color-magenta-300)" />
            </>
          )}
        </linearGradient>
        <filter id={shineFilterId} x="-50%" y="-150%" width="200%" height="400%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <radialGradient id={shineGradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Dusk/dawn-only soft shadow (see the brightSky note above) — a
            genuinely blurred dark halo (feDropShadow, same "soft blurred
            highlight" language as every glossy object's catch-light, just
            inverted dark) sitting BEHIND the letterforms for atmospheric
            separation from the sky, never a crisp/traced edge at any zoom
            level. Only defined/referenced when a shadow is actually wanted
            for the current candidate. */}
        {shadowConfig && (
          <filter
            id={dropShadowFilterId}
            x="-40%"
            y="-80%"
            width="180%"
            height="260%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation={shadowConfig.blur}
              floodColor="var(--color-ink)"
              floodOpacity={shadowConfig.opacity}
            />
          </filter>
        )}
      </defs>

      {/* Soft bloom — appears only once the stroke finishes drawing. Two
          blurred duplicates of the live glyphs themselves (tight-blur
          layer, then a broader soft-blur layer sitting behind it),
          filled with the SAME per-state gradient as the real letters so
          the glow reads as that exact ink's own light rather than a
          separate white halo — screen-blended so it adds light onto
          whatever's behind it (including a soft, radial touch on the sky
          immediately around the text) instead of a flat tinted overpaint,
          with no hard edge anywhere at any layer. */}
      <g ref={glowRef} className="wordmark__glow">
        <text
          x="450"
          y="150"
          textAnchor="middle"
          aria-hidden="true"
          className="wordmark__glyphs"
          fill={`url(#${glyphGradientId})`}
          filter={`url(#${glowSoftBlurId})`}
          opacity="0.55"
        >
          {WORDMARK_TEXT}
        </text>
        <text
          x="450"
          y="150"
          textAnchor="middle"
          aria-hidden="true"
          className="wordmark__glyphs"
          fill={`url(#${glyphGradientId})`}
          filter={`url(#${glowTightBlurId})`}
          opacity="0.9"
        >
          {WORDMARK_TEXT}
        </text>
      </g>

      {/* Grouped so the dusk/dawn soft shadow (see brightSky above) wraps
          the live text AND its R-leg patch as one silhouette, reading as
          one shadowed shape rather than two overlapping ones. `filter` is
          only ever set when a shadow is actually wanted; at night (and
          for a shadow-less candidate) this is a plain, filter-less group
          with zero rendering cost or visual change. */}
      <g filter={shadowConfig ? `url(#${dropShadowFilterId})` : undefined}>
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
      </g>

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
        className={`wordmark__shine${brightSky ? " wordmark__shine--bright" : ""}`}
        fill={`url(#${shineGradientId})`}
        filter={`url(#${shineFilterId})`}
      />
    </svg>
  );
}
