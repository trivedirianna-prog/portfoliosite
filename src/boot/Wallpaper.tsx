import { useId, useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { getCssVar } from "../lib/theme";
import { useWindowManager } from "../windows/WindowManager";
import "./Wallpaper.css";

/*
  Wallpaper system per design spec §5: ONE continuous environment across
  three time-of-day states (dusk/night/dawn), not three unrelated scenes.
  The environment is a coded, parametric scene — gradient sky, a horizon
  light bloom, layered SVG mountain/pine silhouettes with atmospheric
  perspective, a shaded glossy moon, sparse glowing stars — never a
  generated image, so the three states are the same shape set with
  different color/opacity/position values, not three separately-authored
  pictures.

  Sky and mountains share one color source: every mountain layer's tint
  is derived from the SAME horizon-glow color that also drives the glow
  bloom itself (see mountainTints below), rather than each being picked
  independently — that's what keeps them reading as one lit world instead
  of two disconnected palettes stitched together at the seam.

  The mountain/star/glow layers use an SVG stretched via preserveAspectRatio
  "none" (organic silhouettes and soft blurred blobs tolerate non-uniform
  stretch fine), but the moon is built as plain HTML/CSS instead: SVG
  elements inside a non-uniformly-stretched viewBox render circles as
  ellipses, and GSAP's transform math for SVG assumes uniform scaling —
  both break down for a moving circular element. A CSS div with
  aspect-ratio:1 stays a true circle regardless of page aspect ratio,
  and reuses the same flat-base + radial-shading + tight-highlight
  language as .material-glossy (src/styles/materials.css) — fitting,
  since the moon is a reflecting glossy sphere, not a light source (§4
  reserves emitted light for the wordmark alone).

  The wallpaper only transitions while idle (no window open, see
  WindowManager's isIdle) — it never competes for attention with content
  the user is actively reading.
*/

export type TimeOfDay = "dusk" | "night" | "dawn";

const CYCLE: TimeOfDay[] = ["dusk", "night", "dawn"];

// Placeholder pacing — how long a state holds before the system attempts
// to advance (and only then if idle). Real timing is a later tuning pass.
const HOLD_MS = 20000;

interface SceneConfig {
  skyTop: string;
  skyMid: string;
  /** Also the horizon-glow bloom's own color — the richest, most
   *  saturated point in the scene, and the single source every mountain
   *  layer's tint is blended from (see mountainTints). */
  horizonColor: string;
  horizonGlowOpacity: number;
  farMountainTint: string;
  midMountainTint: string;
  nearMountainTint: string;
  moonTop: number;
  moonLeft: number;
  moonLightColor: string;
  moonShadowColor: string;
  haloColor: string;
  haloOpacity: number;
  starOpacity: number;
}

// Parses either a "#rrggbb"/"#rgb" token or an "rgb(r, g, b)" string —
// mixHex's own output is the latter, and mixHex calls are chained below
// (e.g. mountainTints feeds an already-mixed horizon color back in), so
// the parser has to accept its own output or every chained call silently
// collapses to black (parseInt("rgb(...)", 16) stops at the first
// non-hex-digit character and returns NaN, which coerces to 0 on every
// channel — this was live for a whole pass before being caught here).
function parseColor(input: string): [number, number, number] {
  const rgbMatch = input.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  const clean = input.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// Blends two colors into a concrete rgb() string GSAP can interpolate
// between (GSAP can't animate to/from a color-mix() string). Used to
// derive the mountain layers' atmospheric-perspective tint from the
// scene's own horizon-glow color, so distant layers automatically pick
// up the right light without needing separate hand-picked colors.
function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseColor(a);
  const [r2, g2, b2] = parseColor(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Two prominent peaks framing a central V-shaped valley notch — angular
// polyline (not smooth curves), so it reads as a mountain range rather
// than a soft dune. Apex at y=40 (shifted down 6 from the previous y=34)
// — extra headroom so more of the sky's now-earlier-arriving vivid color
// (see Wallpaper.css) is visible above the ridge line, while still
// staying within the canvas's lower ~60% so it never eats into the space
// reserved for the wordmark/objects above.
const MID_MOUNTAIN_PATH =
  "M0,100 L0,70 L8,62 L16,46 L22,40 L28,52 L34,58 L40,64 L46,68 L50,72 " +
  "L54,68 L60,64 L66,58 L72,52 L78,40 L84,46 L92,62 L100,70 L100,100 Z";

// Distant, hazy, low-contrast — mostly hidden behind the mid layer's
// peaks, but rises just enough at center to peek through the valley
// notch. Shifted down 5 to match the mid layer's lower peaks.
const FAR_MOUNTAIN_PATH =
  "M0,100 L0,91 C15,87 25,91 32,85 C38,77 44,65 50,57 C56,65 62,77 68,85 " +
  "C75,91 85,87 100,91 L100,100 Z";

// Frontmost, darkest layer — a plain, gently-undulating low ridge (no
// trees, no clouds: both were cut entirely per this pass's Step 1). Kept
// simple/smooth so it stays a quiet dark foundation, not a competing
// silhouette detail of its own.
const NEAR_MOUNTAIN_PATH =
  "M0,100 L0,90 C20,87 35,91 50,88 C65,85 80,90 100,87 L100,100 Z";

function buildScenes(): Record<TimeOfDay, SceneConfig> {
  const indigo950 = getCssVar("--color-indigo-950");
  const violet800 = getCssVar("--color-violet-800");
  const violet600 = getCssVar("--color-violet-600");
  const violet500 = getCssVar("--color-violet-500");
  const violetShadow = getCssVar("--color-violet-shadow");
  const magentaVivid700 = getCssVar("--color-magenta-vivid-700");
  const magentaVivid600 = getCssVar("--color-magenta-vivid-600");
  const magentaVivid400 = getCssVar("--color-magenta-vivid-400");
  const horizonGold = getCssVar("--color-horizon-gold");
  const moonlight = getCssVar("--color-moonlight");
  const moonlightWarm = getCssVar("--color-moonlight-warm");
  const ink = getCssVar("--color-ink");

  // Every mountain layer's tint is a blend of THIS state's own horizon
  // color and ink — more haze (less ink) the farther back the layer
  // sits — so sky and mountains share one color source instead of two
  // independently-chosen palettes meeting at a visible seam. Wide spread
  // (0.35/0.72/0.96) so each layer still reads as a distinct flat,
  // hard-edged shape rather than blending into its neighbor.
  function mountainTints(horizon: string) {
    return {
      far: mixHex(horizon, ink, 0.35),
      mid: mixHex(horizon, ink, 0.72),
      near: mixHex(horizon, ink, 0.96),
    };
  }

  // Dusk: warmest/most golden.
  const duskHorizon = mixHex(magentaVivid600, horizonGold, 0.4);
  // Night: most subdued — pulled toward violet rather than left vivid.
  const nightHorizon = mixHex(magentaVivid700, violet800, 0.3);
  // Dawn: cooler than dusk, but still rich — never pale/washed out.
  const dawnHorizon = mixHex(magentaVivid400, violet500, 0.25);

  const duskTints = mountainTints(duskHorizon);
  const nightTints = mountainTints(nightHorizon);
  const dawnTints = mountainTints(dawnHorizon);

  return {
    dusk: {
      // The zenith stays near-black indigo across all three states (the
      // top of the sky barely changes through the night) — only the
      // horizon transforms, reinforcing "one continuous environment."
      skyTop: indigo950,
      skyMid: violet600,
      horizonColor: duskHorizon,
      // Reduced from 1 — now that the sky itself carries real vividness
      // up to the ridge line (Step 2), the glow is a contained accent at
      // the valley seam, not the thing doing all the color work.
      horizonGlowOpacity: 0.7,
      farMountainTint: duskTints.far,
      midMountainTint: duskTints.mid,
      nearMountainTint: duskTints.near,
      // Checked against real bounding boxes (Phase A.5), not eyeballed:
      // at 1280x800 the disc is 281.6px (radius 140.8px); the wordmark's
      // own rect top edge sits at y=312.4px; the right peak's apex (now
      // at 78%,40% after Step 2's height reduction) is at pixel
      // (998.4, 320). Center (870, 160): disc bottom = 160+140.8 = 300.8,
      // clearing the wordmark's 312.4 top edge by ~12px; distance to the
      // peak apex is ~218px, clearing its 140.8px radius by ~78px. The
      // softer halo (see .wallpaper__moon-halo) may still gently graze
      // the wordmark's edge — that's an acceptable soft-glow overlap,
      // not the hard disc-through-shape collision this is checked against.
      moonTop: 20,
      moonLeft: 68,
      // Dim / just becoming visible — a muted, low-contrast disc rather
      // than a faded-out (transparent) one; the sphere itself is always
      // solid, only its illumination changes.
      moonLightColor: mixHex(moonlightWarm, violetShadow, 0.45),
      moonShadowColor: violetShadow,
      haloColor: magentaVivid600,
      haloOpacity: 0.3,
      starOpacity: 0.15,
    },
    night: {
      skyTop: indigo950,
      skyMid: violet800,
      horizonColor: nightHorizon,
      horizonGlowOpacity: 0.3,
      farMountainTint: nightTints.far,
      midMountainTint: nightTints.mid,
      nearMountainTint: nightTints.near,
      // Center (486, 128): disc bottom = 128+140.8 = 268.8, clearing the
      // wordmark's 312.4px top edge by ~44px; distance to the left peak
      // apex (281.6, 320) is ~281px, clearing its 140.8px radius by
      // ~140px — the most comfortable margin of the three, matching
      // night's "clear, high in the sky" read.
      moonTop: 16,
      moonLeft: 38,
      moonLightColor: moonlight,
      moonShadowColor: violetShadow,
      haloColor: moonlight,
      haloOpacity: 0.65,
      starOpacity: 0.85,
    },
    dawn: {
      // Still near-black indigo at the zenith and a genuinely saturated
      // violet band — brightening/warming toward vivid pink at the
      // horizon, never fading toward pale/pastel, to keep the same
      // moody, nighttime-leaning world even in its lightest state.
      skyTop: indigo950,
      skyMid: violet500,
      horizonColor: dawnHorizon,
      horizonGlowOpacity: 0.55,
      farMountainTint: dawnTints.far,
      midMountainTint: dawnTints.mid,
      nearMountainTint: dawnTints.near,
      // Center (358, 144): disc bottom = 144+140.8 = 284.8, clearing the
      // wordmark's 312.4px top edge by ~28px; distance to the left peak
      // apex (281.6, 320) is ~192px, clearing its 140.8px radius by
      // ~51px — the tightest of the three margins, but still a clean
      // disc-vs-disc/peak clearance.
      moonTop: 18,
      moonLeft: 28,
      // Fading — cooler-meets-warmer transitional tone, still a solid,
      // medium-bright disc rather than one dissolving into transparency.
      moonLightColor: mixHex(moonlight, moonlightWarm, 0.5),
      moonShadowColor: mixHex(violetShadow, magentaVivid700, 0.4),
      haloColor: moonlightWarm,
      haloOpacity: 0.4,
      starOpacity: 0.08,
    },
  };
}

function parseSeconds(cssDuration: string) {
  return parseFloat(cssDuration) || 0;
}

export function Wallpaper() {
  const uid = useId();
  const horizonGlowInnerId = `${uid}-horizon-inner`;
  const horizonGlowOuterId = `${uid}-horizon-outer`;
  const starGlowId = `${uid}-star-glow`;

  const { isIdle } = useWindowManager();
  const skyRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const horizonGlowGroupRef = useRef<SVGGElement>(null);
  const horizonInnerStopRef = useRef<SVGStopElement>(null);
  const horizonOuterStopRef = useRef<SVGStopElement>(null);
  const farRef = useRef<SVGPathElement>(null);
  const midRef = useRef<SVGPathElement>(null);
  const nearRef = useRef<SVGPathElement>(null);
  const starsRef = useRef<SVGGElement>(null);
  const cycleIndexRef = useRef(0);

  // Read inside the interval via a ref so the interval itself doesn't need
  // to be torn down and recreated every time idle state flips.
  const isIdleRef = useRef(isIdle);
  isIdleRef.current = isIdle;

  // Layout effect (not a plain effect) so the first scene is applied
  // before the browser paints — otherwise there's a one-frame flash of
  // unstyled defaults first.
  useLayoutEffect(() => {
    const scenes = buildScenes();
    const crossfadeDuration = parseSeconds(
      getCssVar("--duration-wallpaper-crossfade"),
    );

    function applyScene(scene: SceneConfig, duration: number) {
      const tl = gsap.timeline();
      if (skyRef.current) {
        tl.to(
          skyRef.current,
          {
            "--sky-top": scene.skyTop,
            "--sky-mid": scene.skyMid,
            "--sky-bottom": scene.horizonColor,
            duration,
          },
          0,
        );
      }
      if (horizonInnerStopRef.current) {
        tl.to(
          horizonInnerStopRef.current,
          { attr: { "stop-color": scene.horizonColor }, duration },
          0,
        );
      }
      if (horizonOuterStopRef.current) {
        tl.to(
          horizonOuterStopRef.current,
          { attr: { "stop-color": scene.horizonColor }, duration },
          0,
        );
      }
      if (horizonGlowGroupRef.current) {
        tl.to(
          horizonGlowGroupRef.current,
          { opacity: scene.horizonGlowOpacity, duration },
          0,
        );
      }
      if (farRef.current) {
        tl.to(farRef.current, { fill: scene.farMountainTint, duration }, 0);
      }
      if (midRef.current) {
        tl.to(midRef.current, { fill: scene.midMountainTint, duration }, 0);
      }
      if (nearRef.current) {
        tl.to(nearRef.current, { fill: scene.nearMountainTint, duration }, 0);
      }
      if (moonRef.current) {
        tl.to(
          moonRef.current,
          {
            top: `${scene.moonTop}%`,
            left: `${scene.moonLeft}%`,
            "--glow-color": scene.haloColor,
            "--halo-opacity": scene.haloOpacity,
            "--moon-light-color": scene.moonLightColor,
            "--moon-shadow-color": scene.moonShadowColor,
            duration,
          },
          0,
        );
      }
      if (starsRef.current) {
        tl.to(starsRef.current, { opacity: scene.starOpacity, duration }, 0);
      }
      return tl;
    }

    // Establish the first state instantly — nothing to crossfade from yet.
    applyScene(scenes[CYCLE[cycleIndexRef.current]], 0);

    const interval = window.setInterval(() => {
      if (!isIdleRef.current) return; // skip this tick; never interrupts active use
      cycleIndexRef.current = (cycleIndexRef.current + 1) % CYCLE.length;
      applyScene(scenes[CYCLE[cycleIndexRef.current]], crossfadeDuration);
    }, HOLD_MS);

    return () => window.clearInterval(interval);
    // Deliberately runs once: refs are stable for the component's lifetime,
    // and isIdle is read via isIdleRef instead of restarting the interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const starPoints = [
    { cx: 8, cy: 15 },
    { cx: 22, cy: 8 },
    { cx: 40, cy: 20 },
    { cx: 60, cy: 10 },
    { cx: 75, cy: 25 },
    { cx: 90, cy: 14 },
  ];

  return (
    <div className="wallpaper" aria-hidden="true">
      <div ref={skyRef} className="wallpaper__sky" />

      <svg
        className="wallpaper__stars-layer"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id={starGlowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={starsRef} className="wallpaper__stars">
          {starPoints.map((p) => (
            <g key={`${p.cx}-${p.cy}`}>
              <circle cx={p.cx} cy={p.cy} r="1.3" fill={`url(#${starGlowId})`} />
              <circle cx={p.cx} cy={p.cy} r="0.28" fill="#ffffff" />
            </g>
          ))}
        </g>
      </svg>

      <div ref={moonRef} className="wallpaper__moon">
        <div className="wallpaper__moon-halo" />
        <div className="wallpaper__moon-ring" />
        <div className="wallpaper__moon-disc" />
        <div className="wallpaper__moon-highlight" />
      </div>

      <svg
        className="wallpaper__mountains-layer"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Layered soft gradients (tight bright inner + broader outer),
              both fading fully transparent — the richest, most saturated
              point in the scene, anchored right at the sky/mountain seam
              so it bleeds upward into the sky and is only visible
              downward through the valley notch (mountains occlude it
              everywhere else, and derive their own tint from this same
              color — see mountainTints). */}
          <radialGradient id={horizonGlowInnerId} cx="50%" cy="50%" r="50%">
            <stop ref={horizonInnerStopRef} offset="0%" stopOpacity="0.95" />
            <stop offset="100%" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={horizonGlowOuterId} cx="50%" cy="50%" r="50%">
            <stop ref={horizonOuterStopRef} offset="0%" stopOpacity="0.55" />
            <stop offset="100%" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g ref={horizonGlowGroupRef} className="wallpaper__horizon-glow">
          {/* Narrowed from rx=46/24 (92%/48% of frame width) to rx=20/10
              (40%/20%) — the wide version bled around the OUTER shoulders
              of both peaks instead of staying contained in the central
              valley notch (confirmed in the Phase B.3 isolation
              screenshot). cy moved from 64 to 66 to sit at the new,
              lower valley seam (peaks/valley shifted down 6 in Step 2). */}
          <ellipse cx="50" cy="66" rx="20" ry="14" fill={`url(#${horizonGlowOuterId})`} />
          <ellipse cx="50" cy="66" rx="10" ry="7" fill={`url(#${horizonGlowInnerId})`} />
        </g>

        <path ref={farRef} className="wallpaper__mountain" d={FAR_MOUNTAIN_PATH} />

        <path ref={midRef} className="wallpaper__mountain" d={MID_MOUNTAIN_PATH} />

        <path ref={nearRef} className="wallpaper__mountain" d={NEAR_MOUNTAIN_PATH} />
      </svg>
    </div>
  );
}
