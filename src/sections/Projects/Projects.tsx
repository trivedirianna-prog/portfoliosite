import { useId, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useSectionWindow } from "../../windows/useSectionWindow";
import { useWindowManager } from "../../windows/WindowManager";
import { FAN_STAGGER_MS } from "./projectFan";
import "./Projects.css";

/*
  CD-R jewel case (§8.3) — glossy material, warm plum-700 -> magenta-600.
  Shown AJAR, not flat-closed: the lid is a foreshortened trapezoid
  hinged along the case's OWN top edge (nested in the same transform
  group so the hinge line is shared geometry, not two independently
  positioned shapes touching by coincidence), and the disc slides out
  over the case's own front-right edge rather than sitting flush inside
  it — the "caught mid-gesture" quality the coherence rule asks for.
  Ring text runs around the disc via a real SVG textPath, not a drawn
  approximation.

  First attempt drew the lid as an independently rotated rect floating
  above the case with no shared edge — it read as a flat, disconnected
  stray rectangle rather than part of this object. Fixed by hinging it
  to the case's actual top edge and foreshortening it into a trapezoid,
  so it reads as tilting open in depth instead of just sitting rotated
  in-plane.

  §8.3's fan-out mechanic: click -> the lid swings further open, the
  disc tilts (a quick rotate+squash standing in for "tilting a CD to
  catch light" in 2D), a few light-split streaks flash off its edge,
  and — timed to ride those streaks out — each of the three project
  windows opens with a short stagger. Every window shares the same
  originRect (this icon's own rect), same mechanism every other
  section's window already uses to emerge from/retract to its spawning
  object; the "riding out along a light-split" feeling comes from that
  shared origin plus each window's own distinct final position
  (projectFan.ts) and the stagger, not a bespoke flight-path animation
  per window. Built off PROJECT_KINDS's length (see projectFan.ts /
  projectRegistry.ts), not hardcoded to three — adding a fourth project
  window later only means adding its own component + one more
  useSectionWindow call here, the stagger/positioning math already
  adapts.

  Stacking order is deliberate, not incidental: Portfolio (shipped,
  most concrete) ends up frontmost, Pandora (designed prototype) in the
  middle, AgriVerse (concept/pitch stage) furthest back — mirroring the
  three projects' finished-ness tiers from §8.3. See handleOpen's
  reversed open sequence for how that's actually achieved.
*/
export function Projects() {
  const uid = useId();
  const caseGradId = `${uid}-case`;
  const lidGradId = `${uid}-lid`;
  const discGradId = `${uid}-disc`;
  const ringPathId = `${uid}-ring`;
  const dominantHighlightId = `${uid}-hl-dominant`;
  const secondaryHighlightId = `${uid}-hl-secondary`;

  const iconRef = useRef<HTMLButtonElement>(null);
  const lidRef = useRef<SVGPathElement>(null);
  const discRef = useRef<SVGGElement>(null);
  const lightSplitRef = useRef<SVGGElement>(null);

  const { setOriginRect } = useWindowManager();
  const portfolio = useSectionWindow("projects", "portfolio");
  const pandora = useSectionWindow("projects", "pandora");
  const agriverse = useSectionWindow("projects", "agriverse");
  const projects = [portfolio, pandora, agriverse] as const;
  const labels = ["Portfolio", "Pandora", "AgriVerse"] as const;
  const windowsOpen = projects.some((p) => p.isOpen);

  function handleOpen() {
    if (iconRef.current) {
      setOriginRect("projects", iconRef.current.getBoundingClientRect());
    }

    // The physical gesture: lid swings further open, the disc tilts to
    // catch light, light splits off its edge — quick and mechanical
    // (power2 easing, no bounce/spring), matching §12's motion rule.
    const tl = gsap.timeline();
    if (lidRef.current) {
      tl.to(
        lidRef.current,
        { attr: { d: "M4,0 L56,0 L46,-38 L14,-30 Z" }, duration: 0.3, ease: "power2.out" },
        0,
      );
    }
    if (discRef.current) {
      tl.to(
        discRef.current,
        { rotate: "+=26", scaleY: 0.78, duration: 0.3, ease: "power2.out" },
        0,
      );
    }
    if (lightSplitRef.current) {
      tl.to(lightSplitRef.current, { opacity: 1, duration: 0.1, ease: "power1.out" }, 0.12)
        .to(lightSplitRef.current, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.3);
    }

    // Each project window rides out along the gesture, staggered so the
    // fan-out reads as one continuous beat rather than a simultaneous
    // pop. Opened back-to-front by finished-ness tier (§8.3): AgriVerse
    // (concept/pitch stage) first, Pandora (designed prototype) next,
    // Portfolio (shipped, most concrete) last — WindowManager stacks
    // purely by open order (last-opened lands on top, the same
    // mechanism About's cluster uses), so opening Portfolio last is what
    // puts it frontmost, with AgriVerse ending up furthest back. This is
    // the actual z-order mechanism, not a z-index override layered on
    // afterward.
    [...projects].reverse().forEach((project, i) => {
      tl.call(() => project.openOrRestore(), undefined, 0.16 + (i * FAN_STAGGER_MS) / 1000);
    });
  }

  return (
    <div
      className={`section-object section-object--projects${windowsOpen ? " section-object--windows-open" : ""}`}
    >
      <button
        ref={iconRef}
        type="button"
        className="section-object__hit-area"
        onClick={handleOpen}
        aria-label="Open Projects"
      >
        <svg
          className="section-object__art"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Projects"
        >
          <defs>
            <linearGradient id={caseGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" className="projects-object__stop-case-a" />
              <stop offset="100%" className="projects-object__stop-case-b" />
            </linearGradient>
            <linearGradient id={lidGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" className="projects-object__stop-lid-a" />
              <stop offset="100%" className="projects-object__stop-lid-b" />
            </linearGradient>
            <linearGradient id={discGradId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" className="projects-object__stop-disc-a" />
              <stop offset="100%" className="projects-object__stop-disc-b" />
            </linearGradient>
            {/* Not rendered directly — only exists so textPath below can
                trace the disc's own ring. */}
            <circle id={ringPathId} cx="0" cy="0" r="16" />

            {/* Two highlight recipes, matching materials.css's own
                .material-glossy::before (dominant: near-white, tight,
                sharp falloff) / ::after (secondary: far dimmer, smaller) —
                reused here as real radial gradients (soft falloff) rather
                than flat-filled ellipses, which is what read as hard-edged
                cartoon "eyes" alongside the hub. Only ONE dominant
                highlight exists on the whole object now (on the case
                body, its main surface); the disc gets only the fainter
                secondary treatment, and the lid gets none at all. */}
            <radialGradient id={dominantHighlightId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={secondaryHighlightId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Disc, drawn FIRST/behind here so the case body (next) covers
              most of it — only its right crescent peeks out, reading as
              "sliding out from under the case" rather than two same-size
              round/rect shapes sitting side by side (which read as a face:
              two highlight ovals + a dark hub = eyes + nose). */}
          <g ref={discRef} transform="translate(66,66) rotate(8)">
            <circle r="21" fill={`url(#${discGradId})`} />
            <text className="projects-object__ring-text">
              <textPath href={`#${ringPathId}`} startOffset="2%">
                RIANNA TRIVEDI · PROJECTS ·
              </textPath>
            </text>
            {/* Hub, shrunk and pushed toward the rim rather than dead
                center — centered + a nearby bright highlight is exactly
                what paired into "eyes" with the case's own highlight. */}
            <circle cx="4" cy="3" r="4" className="projects-object__hub" />
            {/* Secondary (dim, small) highlight only — the disc's own
                catch is real (a CD rim does catch light) but subordinate
                to the case's dominant one, and positioned at the far
                upper rim, well clear of the hub. */}
            <ellipse
              className="projects-object__highlight-shape"
              fill={`url(#${secondaryHighlightId})`}
              cx="-11"
              cy="-16"
              rx="5"
              ry="3"
              transform="rotate(-20 -11 -16)"
            />
          </g>

          {/* Light-split streaks — the real physical justification for the
              fan-out (§8.3): as the disc tilts, light catches its edge
              and visibly splits. Rendered as a few thin bands in the
              locked palette (pearl/ice/magenta — no invented rainbow hue)
              fanning from the disc's own edge, flashed in/out by the
              open timeline rather than sitting visible at rest. */}
          <g ref={lightSplitRef} className="projects-object__light-split" opacity="0">
            <line x1="70" y1="58" x2="98" y2="30" className="projects-object__split projects-object__split--a" />
            <line x1="72" y1="63" x2="100" y2="58" className="projects-object__split projects-object__split--b" />
            <line x1="70" y1="70" x2="94" y2="92" className="projects-object__split projects-object__split--c" />
          </g>

          {/* Case body — the front-facing plane, tilted rather than
              square-on, per the "never flat/symmetric" coherence rule.
              Wide enough to cover most of the disc above, leaving only its
              right edge sliding out past the case's own right edge. */}
          <g transform="translate(4,44) rotate(-4)">
            {/* Lid, hinged along the case's OWN top edge (shared points at
                local y=0) rather than floating as an independently
                positioned/rotated rectangle — that disconnection was what
                read as a flat, stray floating shape rather than part of
                this object. Drawn as a foreshortened trapezoid (narrower/
                shorter than the case's own top edge, with an asymmetric
                skew) so it reads as tilting back and open in depth, not
                just a rect rotated flat in-plane like a tilted card. Its
                `d` is animated further open on click (see handleOpen). */}
            <path ref={lidRef} d="M4,0 L56,0 L50,-30 L8,-26 Z" fill={`url(#${lidGradId})`} />
            {/* No highlight on the lid — its own darker, cooler gradient
                (plum-800 -> plum-600, vs. the case's warmer plum-700 ->
                magenta-600) is enough to read as a distinct plane without
                adding a third highlight to the composition. */}

            <rect width="62" height="42" rx="6" fill={`url(#${caseGradId})`} />
            {/* The one dominant highlight on the whole object — tight,
                bright, sharp falloff, on the case body since it's the
                main glossy surface. */}
            <ellipse
              className="projects-object__highlight-shape"
              fill={`url(#${dominantHighlightId})`}
              cx="13"
              cy="8"
              rx="11"
              ry="5"
              transform="rotate(-15 13 8)"
            />
          </g>
        </svg>
      </button>

      {projects.map((project, i) =>
        project.isMinimized ? (
          <button
            key={labels[i]}
            type="button"
            className={`section-object__dock-tab label-mono${i === 1 ? " section-object__dock-tab--secondary" : i === 2 ? " section-object__dock-tab--tertiary" : ""}`}
            onClick={() => {
              if (iconRef.current) {
                setOriginRect("projects", iconRef.current.getBoundingClientRect());
              }
              project.restore();
            }}
          >
            {labels[i]}
          </button>
        ) : null,
      )}

      <span className="section-object__caption label-mono">Projects</span>
    </div>
  );
}
