import { useLayoutEffect, useRef } from "react";
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

  The stroke-dashoffset draw-on technique strokes each glyph's outline in
  sequence rather than tracing one true single-width pen line (that would
  need the font's own outline paths extracted via something like
  opentype.js) — but for a connected script face, animating the outline
  stroke left-to-right reads convincingly as "the signature being
  written," which is what a segmented letter-by-letter ignition (this
  replaces) never could for a script this connected.
*/

const WORDMARK_TEXT = "Rianna Trivedi";

interface WordmarkProps {
  animate?: boolean;
  onComplete?: () => void;
}

export function Wordmark({ animate = false, onComplete }: WordmarkProps) {
  const textRef = useRef<SVGTextElement>(null);
  const glowRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    if (!animate) return;
    let cancelled = false;
    let tl: gsap.core.Timeline | undefined;

    // Wait for the real font to be ready before measuring — measuring
    // against a fallback font's metrics would give the wrong stroke
    // length and the draw-on would visibly jump once the real face swaps in.
    document.fonts.ready.then(() => {
      if (cancelled || !textRef.current || !glowRef.current) return;
      const length = textRef.current.getComputedTextLength();

      gsap.set(textRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length,
        fillOpacity: 0,
      });
      gsap.set(glowRef.current, { opacity: 0 });

      tl = gsap.timeline({ onComplete });
      tl.to(textRef.current, {
        strokeDashoffset: 0,
        duration: 2.4,
        ease: "power1.inOut",
      })
        .to(textRef.current, { fillOpacity: 1, duration: 0.5 }, "-=0.15")
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
        <filter id="wordmark-bloom" x="-80%" y="-120%" width="260%" height="360%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      {/* Soft outer bloom — appears only once the stroke finishes drawing.
          The ambient ellipse is the "plausibly illuminates nearby
          surfaces" light-spill from §4, not just a tight glow around the
          letterforms. */}
      <g ref={glowRef} className="wordmark__glow" filter="url(#wordmark-bloom)">
        <ellipse className="wordmark__ambient-glow" cx="450" cy="120" rx="430" ry="150" />
        <text x="450" y="150" textAnchor="middle" className="wordmark__glyphs">
          {WORDMARK_TEXT}
        </text>
      </g>
      <text
        ref={textRef}
        x="450"
        y="150"
        textAnchor="middle"
        className="wordmark__glyphs wordmark__glyphs--crisp"
      >
        {WORDMARK_TEXT}
      </text>
    </svg>
  );
}
