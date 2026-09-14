import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { getCssVar } from "../lib/theme";
import { useWindowManager } from "../windows/WindowManager";
import "./Wallpaper.css";

/*
  Wallpaper system per design spec §5: ONE continuous environment across
  three time-of-day states (dusk/night/dawn), not three unrelated scenes.
  The environment is a coded, parametric scene — gradient sky, layered
  SVG mountain/pine silhouettes with atmospheric perspective, a shaded
  glossy moon, sparse glowing stars — never a generated image, so the
  three states are the same shape set with different color/opacity/
  position values, not three separately-authored pictures.

  The mountain/star layers use an SVG stretched via preserveAspectRatio
  "none" (organic silhouettes tolerate non-uniform stretch fine), but the
  moon is built as plain HTML/CSS instead: SVG elements inside a non-
  uniformly-stretched viewBox render as ellipses, not circles, and GSAP's
  transform math for SVG assumes uniform scaling — both break down here.
  A CSS div with aspect-ratio:1 stays a true circle regardless of page
  aspect ratio, and reuses the same flat-base + radial-shading + tight-
  highlight language as .material-glossy (src/styles/materials.css) —
  fitting, since the moon is a reflecting glossy sphere, not a light
  source (§4 reserves emitted light for the wordmark alone).

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
  skyBottom: string;
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

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
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

// Blends two hex tokens into a concrete rgb() string GSAP can interpolate
// between (GSAP can't animate to/from a color-mix() string). Used to
// derive the mountain layers' atmospheric-perspective tint from each
// scene's own sky color, so distant layers automatically pick up the
// haze color of that state instead of needing hand-tuned values per layer.
function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Procedural pine-ridge silhouette: two overlaid sine waves give a jagged,
// organic treeline without hand-authoring dozens of path points.
function buildTreelinePath(baseY: number, amplitude: number, count: number) {
  const points: string[] = [];
  for (let i = 0; i <= count; i++) {
    const x = (i / count) * 100;
    const jitter =
      Math.sin(i * 1.7) * amplitude * 0.6 + Math.sin(i * 0.6 + 1) * amplitude * 0.4;
    const y = baseY - Math.abs(jitter) - (i % 2 === 0 ? amplitude * 0.3 : 0);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M0,100 L${points.join(" L")} L100,100 Z`;
}

const FAR_MOUNTAIN_PATH =
  "M0,100 L0,66 C15,58 25,64 35,56 C45,48 55,62 65,54 C75,48 85,60 100,52 L100,100 Z";
const MID_MOUNTAIN_PATH =
  "M0,100 L0,78 C12,66 20,76 30,68 C40,60 50,74 62,64 C74,56 84,72 100,62 L100,100 Z";
const NEAR_TREELINE_PATH = buildTreelinePath(92, 9, 40);

function buildScenes(): Record<TimeOfDay, SceneConfig> {
  const indigo950 = getCssVar("--color-indigo-950");
  const violet800 = getCssVar("--color-violet-800");
  const violet600 = getCssVar("--color-violet-600");
  const violet500 = getCssVar("--color-violet-500");
  const violetShadow = getCssVar("--color-violet-shadow");
  const magentaVivid700 = getCssVar("--color-magenta-vivid-700");
  const magentaVivid600 = getCssVar("--color-magenta-vivid-600");
  const magentaVivid400 = getCssVar("--color-magenta-vivid-400");
  const moonlight = getCssVar("--color-moonlight");
  const moonlightWarm = getCssVar("--color-moonlight-warm");
  const ink = getCssVar("--color-ink");

  // Atmospheric perspective: each layer's tint is a blend of THIS state's
  // own horizon color and ink — more haze (less ink) the farther back the
  // layer sits — so the mountains automatically stay tonally consistent
  // with whichever sky they're in front of, rather than needing separate
  // hand-picked colors per layer per state. Wider spread (0.35/0.72/0.96)
  // than a soft blend, so each layer reads as a distinct flat, hard-edged
  // shape rather than fading into its neighbor.
  function mountainTints(skyBottom: string) {
    return {
      far: mixHex(skyBottom, ink, 0.35),
      mid: mixHex(skyBottom, ink, 0.72),
      near: mixHex(skyBottom, ink, 0.96),
    };
  }

  const duskTints = mountainTints(magentaVivid600);
  const nightTints = mountainTints(violet800);
  const dawnTints = mountainTints(magentaVivid400);

  return {
    dusk: {
      // The zenith stays near-black indigo across all three states (the
      // top of the sky barely changes through the night) — only the
      // horizon band transforms, which is what actually reads as "time
      // passing" in one continuous environment rather than a hue swap.
      skyTop: indigo950,
      skyMid: violet600,
      skyBottom: magentaVivid600,
      farMountainTint: duskTints.far,
      midMountainTint: duskTints.mid,
      nearMountainTint: duskTints.near,
      moonTop: 62,
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
      skyBottom: magentaVivid700,
      farMountainTint: nightTints.far,
      midMountainTint: nightTints.mid,
      nearMountainTint: nightTints.near,
      moonTop: 26,
      moonLeft: 40,
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
      skyBottom: magentaVivid400,
      farMountainTint: dawnTints.far,
      midMountainTint: dawnTints.mid,
      nearMountainTint: dawnTints.near,
      // Left of center (mirroring dusk's rise-on-the-right at moonLeft 68)
      // so it clears the large centered wordmark horizontally — at 50/56
      // it sat almost exactly on top of "TRIVEDI".
      moonTop: 48,
      moonLeft: 20,
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
  const { isIdle } = useWindowManager();
  const skyRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
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
  // unstyled defaults (full-opacity stars, default moon colors) first.
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
            "--sky-bottom": scene.skyBottom,
            duration,
          },
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
          <radialGradient id="wallpaper-star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={starsRef} className="wallpaper__stars">
          {starPoints.map((p) => (
            <g key={`${p.cx}-${p.cy}`}>
              <circle cx={p.cx} cy={p.cy} r="1.3" fill="url(#wallpaper-star-glow)" />
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
        <path ref={farRef} className="wallpaper__mountain" d={FAR_MOUNTAIN_PATH} />
        <path ref={midRef} className="wallpaper__mountain" d={MID_MOUNTAIN_PATH} />
        <path ref={nearRef} className="wallpaper__mountain" d={NEAR_TREELINE_PATH} />
      </svg>
    </div>
  );
}
