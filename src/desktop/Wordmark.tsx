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

  Mrs Saint Delafield ships with no GSUB table at all (verified directly
  against the font binary — zero stylistic-alternate features, and no
  second glyph mapped to "R" anywhere in its glyph set), so the capital
  R's swash loop can't be swapped for a clearer alternate at the font
  level. Scaling that same glyph up only made the ambiguous closed-loop
  shape more dominant, not more legible — the leg that actually reads as
  "R" rather than "P" stayed just as thin relative to it. Pairing the
  script with Fraunces' own italic capital for just that one letter is a
  real fix instead: mixing a clear display capital with a connecting
  script for an initial is an established convention, and it also ties
  the wordmark back to the site's own serif rather than introducing an
  unrelated third typeface.
*/

const WORDMARK_TEXT = "Rianna Trivedi";

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
      if (innerGlowRef.current) {
        gsap.set(innerGlowRef.current, {
          attr: {
            cx,
            cy,
            rx: box.width * 0.42,
            ry: box.height * 1.05,
          },
        });
      }
      if (outerGlowRef.current) {
        gsap.set(outerGlowRef.current, {
          attr: {
            cx,
            cy,
            rx: box.width * 0.62,
            ry: box.height * 1.9,
          },
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

      tl = gsap.timeline({ onComplete });
      tl.to(textRef.current, {
        strokeDashoffset: 0,
        duration: 2.4,
        ease: "power1.inOut",
      })
        .to(
          textRef.current,
          { fillOpacity: 1, strokeOpacity: 0, duration: 0.5 },
          "-=0.15",
        )
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
        <tspan className="wordmark__cap">R</tspan>
        <tspan dx="4">ianna Trivedi</tspan>
      </text>
    </svg>
  );
}
