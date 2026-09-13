import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { getCssVar } from "../lib/theme";
import { useWindowManager } from "../windows/WindowManager";
import "./Wallpaper.css";

/*
  Wallpaper system per design spec §5: ONE continuous environment across
  three time-of-day states (dusk/night/dawn), not three unrelated scenes.
  Per the explicit build constraint for this pass: the environment is a
  coded, parametric scene (gradient sky, blurred glow shapes, an SVG
  horizon silhouette, sparse SVG stars) — never a generated image — so
  the three states are genuinely the same shape set with different
  color/opacity/position values, not three separately-authored pictures
  that only loosely resemble each other.

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
  skyBottom: string;
  /** The single moving celestial glow — sun/moon — shared across all three
   *  states; only its color/opacity/position change. */
  glowAColor: string;
  glowAOpacity: number;
  glowATop: string;
  glowALeft: string;
  /** A second, fixed-position ambient wash — ground/horizon light. */
  glowBColor: string;
  glowBOpacity: number;
  skylineTint: string;
  skylineOpacity: number;
  starOpacity: number;
}

function buildScenes(): Record<TimeOfDay, SceneConfig> {
  const plum950 = getCssVar("--color-plum-950");
  const plum900 = getCssVar("--color-plum-900");
  const plum800 = getCssVar("--color-plum-800");
  const plum600 = getCssVar("--color-plum-600");
  const magenta600 = getCssVar("--color-magenta-600");
  const magenta400 = getCssVar("--color-magenta-400");
  const magenta300 = getCssVar("--color-magenta-300");
  const ice500 = getCssVar("--color-ice-500");
  const ice400 = getCssVar("--color-ice-400");
  const ice300 = getCssVar("--color-ice-300");
  const ink = getCssVar("--color-ink");

  return {
    dusk: {
      skyTop: plum800,
      skyBottom: magenta600,
      glowAColor: magenta400,
      glowAOpacity: 0.55,
      glowATop: "62%",
      glowALeft: "72%",
      glowBColor: ice500,
      glowBOpacity: 0.18,
      skylineTint: ink,
      skylineOpacity: 0.92,
      starOpacity: 0.15,
    },
    night: {
      skyTop: plum950,
      skyBottom: plum900,
      glowAColor: ice300,
      glowAOpacity: 0.45,
      glowATop: "16%",
      glowALeft: "22%",
      glowBColor: plum600,
      glowBOpacity: 0.35,
      skylineTint: ink,
      skylineOpacity: 0.95,
      starOpacity: 0.85,
    },
    dawn: {
      skyTop: ice300,
      skyBottom: magenta300,
      glowAColor: magenta300,
      glowAOpacity: 0.6,
      glowATop: "58%",
      glowALeft: "30%",
      glowBColor: ice400,
      glowBOpacity: 0.3,
      skylineTint: plum800,
      skylineOpacity: 0.82,
      starOpacity: 0.05,
    },
  };
}

function parseSeconds(cssDuration: string) {
  return parseFloat(cssDuration) || 0;
}

export function Wallpaper() {
  const { isIdle } = useWindowManager();
  const skyRef = useRef<HTMLDivElement>(null);
  const glowARef = useRef<HTMLDivElement>(null);
  const glowBRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<SVGSVGElement>(null);
  const skylineRef = useRef<SVGSVGElement>(null);
  const cycleIndexRef = useRef(0);

  // Read inside the interval via a ref so the interval itself doesn't need
  // to be torn down and recreated every time idle state flips.
  const isIdleRef = useRef(isIdle);
  isIdleRef.current = isIdle;

  useEffect(() => {
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
            "--sky-bottom": scene.skyBottom,
            duration,
          },
          0,
        );
      }
      if (glowARef.current) {
        tl.to(
          glowARef.current,
          {
            "--glow-color": scene.glowAColor,
            opacity: scene.glowAOpacity,
            top: scene.glowATop,
            left: scene.glowALeft,
            duration,
          },
          0,
        );
      }
      if (glowBRef.current) {
        tl.to(
          glowBRef.current,
          {
            "--glow-color": scene.glowBColor,
            opacity: scene.glowBOpacity,
            duration,
          },
          0,
        );
      }
      if (starsRef.current) {
        tl.to(starsRef.current, { opacity: scene.starOpacity, duration }, 0);
      }
      if (skylineRef.current) {
        tl.to(
          skylineRef.current,
          {
            "--skyline-tint": scene.skylineTint,
            opacity: scene.skylineOpacity,
            duration,
          },
          0,
        );
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

  return (
    <div className="wallpaper" aria-hidden="true">
      <div ref={skyRef} className="wallpaper__sky" />
      <div ref={glowARef} className="wallpaper__glow wallpaper__glow--a" />
      <div ref={glowBRef} className="wallpaper__glow wallpaper__glow--b" />

      <svg
        ref={starsRef}
        className="wallpaper__stars"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle cx="8" cy="15" r="0.5" />
        <circle cx="22" cy="8" r="0.4" />
        <circle cx="40" cy="20" r="0.6" />
        <circle cx="60" cy="10" r="0.4" />
        <circle cx="75" cy="25" r="0.5" />
        <circle cx="90" cy="14" r="0.4" />
      </svg>

      <svg
        ref={skylineRef}
        className="wallpaper__skyline"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        <path
          className="wallpaper__skyline-path"
          d="M0,20 L0,14 C10,11 18,15 26,12 C36,9 42,14 52,11 C62,9 70,13 80,10 C88,8 94,11 100,9 L100,20 Z"
        />
      </svg>
    </div>
  );
}
