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
  /** Extra hue breakpoint between skyTop and skyMid (see Wallpaper.css) —
   *  gives states room for a genuine multi-hue journey (night's icy-blue
   *  note in particular) without touching the skyMid/skyBottom timing
   *  that Step 2 tuned against the mountain ridge line. */
  skyAccent: string;
  skyMid: string;
  /** Also the horizon-glow bloom's own color — the richest, most
   *  saturated point in the scene, and the single source every mountain
   *  layer's tint is blended from (see mountainTints). */
  horizonColor: string;
  horizonGlowOpacity: number;
  /** Each mountain layer now shades top (ridge, catching horizon light)
   *  to bottom (base, toward ink) instead of one flat fill — see
   *  shadeTint. Hard edges BETWEEN layers stay (each layer is still its
   *  own flat-fill-free but self-contained shape); this is only variation
   *  WITHIN a layer. */
  farMountainTop: string;
  farMountainBottom: string;
  midMountainTop: string;
  midMountainBottom: string;
  nearMountainTop: string;
  nearMountainBottom: string;
  /** Frontmost rock/terrain silhouette below the near mountain layer —
   *  flat, hard-edged, no internal gradient (matches the mountains'
   *  ORIGINAL flat-fill silhouette language, before Step 3 added
   *  internal shading to the mountains themselves). */
  rockTint: string;
  /** Solid, crisply-edged cloud clusters beside the two peaks (not a
   *  blurred atmosphere blend) — see CLOUD_SHAPE_PATH. Each cloud gets
   *  the same top/bottom shading treatment as the mountains. */
  cloudTop: string;
  cloudBottom: string;
  cloudOpacity: number;
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
//
// Was "M0,100 L0,90 C20,87 35,91 50,88 C65,85 80,90 100,87 L100,100 Z" — a
// top edge that only wandered between y=85 and y=91 (6% of the frame).
// Combined with a fill nearly crushed to pure ink (see mountainTints),
// that shallow a curve reads as a flat rectangular band rather than a
// ridge, especially once the trees that used to break up its silhouette
// were removed — the "leftover artifact" strip at the bottom edge is this
// shape being too flat, not a separate hidden layer. Widened to an 80-90
// range (12%) so it reads as rolling foothills.
const NEAR_MOUNTAIN_PATH =
  "M0,100 L0,88 C15,84 25,90 38,85 C50,80 62,88 75,83 C85,80 92,86 100,84 L100,100 Z";

// A crisp four-pointed sparkle silhouette (the classic "twinkle" shape:
// thin elongated points radiating from a pinched center), not a circular
// blur. Centered at (0,0), points reaching to +/-1 on each axis, with
// control points pulled in tight to near-origin (+/-0.18) so the waist
// between points pinches sharply rather than bowing outward into a
// four-lobed blob — that pinch is what reads as "sparkle icon" rather
// than "soft plus sign." Positioned/sized per star via a wrapping
// <g transform="translate(...) scale(...)">, same technique as the cloud
// puffs above.
const STAR_SPARKLE_PATH =
  "M0,-1 C0.18,-0.18 0.18,-0.18 1,0 C0.18,0.18 0.18,0.18 0,1 " +
  "C-0.18,0.18 -0.18,0.18 -1,0 C-0.18,-0.18 -0.18,-0.18 0,-1 Z";

// A dark foreground strip below the near mountain — separate silhouette,
// not a fix baked into the near layer itself, per the explicit "add a
// rock/boulder or uneven terrain layer" direction.
//
// Went through two prior versions: first a smooth 4%-range curve (too
// shallow to register as its own shape at all), then a sharp, many-bump
// jagged silhouette (overcorrected — read as spiky rather than "rocky").
// This version splits the difference: a handful of broad, gentle bumps
// (top edge wandering y=82-90, calmer than the jagged version but still
// clearly uneven, never a dead-straight line — and its highest points
// stay 2 units below the near mountain's own highest points at y=80, so
// it never pokes above the silhouette in front of which it sits) and —
// the main change — a much taller overall band (top edge averaging ~86
// vs. the previous ~92) so it actually fills the lower frame instead of
// reading as a thin trim. Contrast against the near mountain comes from
// rockTint's own value step alone now — no highlight stroke/seam line
// (removed; it read as an artificial outline rather than a natural
// boundary).
const ROCK_PATH =
  "M0,100 L0,88 C15,84 28,90 42,86 C55,82 68,88 82,85 " +
  "C90,83 95,87 100,85 L100,100 Z";

// One puffy cloud silhouette, built like the old pine treeline was —
// several overlapping rounded bumps merging into one shape via cubic
// beziers — rather than a single blurred ellipse. Drawn in its own small
// local coordinate space (roughly 44 wide x 20 tall) and positioned via a
// wrapping <g transform="translate(...) scale(...)"> per instance, so the
// same shape can be reused at different sizes/offsets for a "cluster."
const CLOUD_SHAPE_PATH =
  "M4,19 C-2,19 -2,12 4,10 C3,3 13,0 18,5 C21,-3 33,-3 35,5 " +
  "C43,2 47,10 41,14 C47,15 46,20 39,20 L7,20 C2,20 1,20 4,19 Z";

// Cloud clusters sit in the OPEN SKY beside each peak's outer slope —
// "beside," not "clipped to a sliver of open sky left of the peak": the
// mid mountain's own top edge RISES steeply near each peak (e.g. left
// side: y=70 at x=0, y=62 at x=8, y=40 at the x=22 apex), so at x<15 or
// so there's already tens of units of open sky above the local terrain —
// plenty of room for a much bigger cloud than the previous pass used
// without it ever visually sitting on the rock. Clouds render BEFORE the
// mountains in DOM order specifically so if a cloud's footprint ever did
// graze the rising slope, the mountain silhouette occludes it cleanly
// (never the reverse) — that safety net is what allows sizing these
// generously instead of squeezing them into a tiny corner triangle.
//
// Previous pass put these at y=12-22 (near the very top of the frame,
// per the "tucked in far corners, near the top edge" complaint) at scale
// 0.11-0.16 (a ~5-8 unit wide puff — invisible without a zoomed crop).
// Moved down to y=33-50 (roughly level with the peak apex at y=40 down
// through its upper flank, i.e. "the horizon glow/mid-sky band, near
// where the peaks meet the sky") and scaled up to 0.3-0.42 (a ~15-21
// unit wide puff — clearly readable at normal size).
//
// CLOUD_SHAPE_PATH's own bbox is x:[-2,47] y:[-3,20] (49 wide, 23 tall) —
// translate/scale below account for that so the visible puff actually
// lands where intended rather than the transform origin doing so.
const CLOUD_CLUSTERS: {
  x: number;
  y: number;
  scale: number;
}[] = [
  // Left cluster — two overlapping puffs beside the left peak's outer
  // (left) flank, floating in open sky well clear of the rising terrain.
  { x: -6, y: 33, scale: 0.42 },
  { x: -11, y: 44, scale: 0.3 },
  // Right cluster — mirrored, beside the right peak's outer (right)
  // flank.
  { x: 90, y: 33, scale: 0.42 },
  { x: 97, y: 45, scale: 0.3 },
];

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
  const ice500 = getCssVar("--color-ice-500");
  const pearl = getCssVar("--color-pearl");
  const ink = getCssVar("--color-ink");

  // Every mountain layer's tint is a blend of THIS state's own horizon
  // color and ink — more haze (less ink) the farther back the layer
  // sits — so sky and mountains share one color source instead of two
  // independently-chosen palettes meeting at a visible seam. Wide spread
  // so each layer still reads as a distinct flat, hard-edged shape rather
  // than blending into its neighbor. near was 0.96 — crushed almost to
  // pure ink, which read as a flat black strip disconnected from the mid
  // layer's own hue (the "bottom strip" artifact). Pulled back to 0.85 so
  // it keeps a visible hue link to the rest of the range while staying
  // the darkest, nearest layer.
  function mountainTints(horizon: string) {
    return {
      far: mixHex(horizon, ink, 0.35),
      mid: mixHex(horizon, ink, 0.72),
      near: mixHex(horizon, ink, 0.85),
    };
  }

  // The frontmost rock/terrain strip below the near mountain. Was
  // mixHex(horizon, ink, 0.94) computed independently from the horizon
  // color — at that blend ratio it landed within a few rgb units of the
  // near mountain's OWN bottom-edge shade (also blended heavily toward
  // ink), so the two were nearly indistinguishable at the seam (the "one
  // flat dark curve" complaint) despite being different colors on paper.
  // Deriving the rock tint FROM the near layer's own bottom color instead
  // of independently guarantees a real, visible step down in brightness
  // regardless of the specific horizon hue in play. Still flat/hard-edged
  // — no internal gradient, unlike the shaded mountains above it.
  function rockTint(nearBottomColor: string) {
    return mixHex(nearBottomColor, ink, 0.55);
  }

  // Shades a flat tint into a top (ridge)/bottom (base) pair for the
  // internal-gradient fill below — lighter near the top, as if catching
  // the horizon glow it's facing, darkening toward the base. Hard edges
  // BETWEEN mountain layers are untouched by this; it only varies color
  // within each layer's own shape.
  function shadeTint(tint: string, horizon: string) {
    return {
      top: mixHex(tint, horizon, 0.22),
      bottom: mixHex(tint, ink, 0.32),
    };
  }

  // Dusk: warmest/most golden.
  const duskHorizon = mixHex(magentaVivid600, horizonGold, 0.4);
  // Night: pulled toward magenta more than before (0.3 -> 0.55) so the
  // horizon has its own distinct hue-shift from the violet mid-sky
  // instead of sitting in the same violet family top to bottom — while
  // magentaVivid700 itself (unlike dusk's magentaVivid600) is dark/muted
  // enough that this still reads as "night," not a second dusk.
  const nightHorizon = mixHex(magentaVivid700, violet800, 0.55);
  // Dawn: cooler than dusk, but still rich — never pale/washed out.
  const dawnHorizon = mixHex(magentaVivid400, violet500, 0.25);

  const duskTints = mountainTints(duskHorizon);
  const nightTints = mountainTints(nightHorizon);
  const dawnTints = mountainTints(dawnHorizon);

  const duskShades = {
    far: shadeTint(duskTints.far, duskHorizon),
    mid: shadeTint(duskTints.mid, duskHorizon),
    near: shadeTint(duskTints.near, duskHorizon),
  };
  const nightShades = {
    far: shadeTint(nightTints.far, nightHorizon),
    mid: shadeTint(nightTints.mid, nightHorizon),
    near: shadeTint(nightTints.near, nightHorizon),
  };
  const dawnShades = {
    far: shadeTint(dawnTints.far, dawnHorizon),
    mid: shadeTint(dawnTints.mid, dawnHorizon),
    near: shadeTint(dawnTints.near, dawnHorizon),
  };

  // Extra hue breakpoint inserted early in the sky gradient (12%, well
  // before skyMid's 25%/skyBottom's 45% — see Wallpaper.css), so it only
  // touches the upper quarter and never shifts when the vivid horizon
  // color arrives relative to the mountain ridge line (Step 2). Dusk/dawn
  // get a value close to a plain top->mid interpolation (near-invisible
  // change); night's is deliberately pulled toward the icy-blue accent
  // tokens.css calls out as needing "a real functional home," breaking up
  // what was otherwise one continuous violet band top to bottom.
  const duskSkyAccent = mixHex(indigo950, violet600, 0.5);
  const nightSkyAccent = mixHex(violet800, ice500, 0.35);
  const dawnSkyAccent = mixHex(indigo950, violet500, 0.45);

  // Cloud base tint: mostly PEARL (bright, near-white) with only a
  // minority tint of the state's own horizon color, rather than the
  // previous horizon-majority mix. The clouds now sit at y=33-50 — right
  // where the sky gradient is already transitioning toward its own most
  // vivid horizon color (the --sky-mid -> --sky-bottom stretch, 25%-45%)
  // — so a cloud tint built the SAME way as the sky/mountain tints (mostly
  // horizon-derived) sits at nearly the same value/saturation as the sky
  // behind it and disappears, which is exactly the low-contrast complaint.
  // Real sunset/dawn clouds read as bright, lit objects against a deeply
  // colored sky, not same-toned ones — so lean hard toward pearl for
  // actual value contrast, and let the horizon-color minority keep them
  // tied to the same light source without matching its depth of color.
  const duskCloudColor = mixHex(pearl, duskHorizon, 0.35);
  const nightCloudColor = mixHex(pearl, nightHorizon, 0.45);
  const dawnCloudColor = mixHex(pearl, dawnHorizon, 0.3);
  // Shaded lit-top (further toward pearl, brighter still)/shadowed-
  // underside (toward this state's own horizon color — a richer, more
  // saturated shadow rather than flat ink, keeping the underside tied to
  // the same light source) — real cloud shading, still readably lighter
  // than the sky at every point on the shape.
  const duskCloudShade = {
    top: mixHex(duskCloudColor, pearl, 0.35),
    bottom: mixHex(duskCloudColor, duskHorizon, 0.4),
  };
  const nightCloudShade = {
    top: mixHex(nightCloudColor, pearl, 0.35),
    bottom: mixHex(nightCloudColor, nightHorizon, 0.4),
  };
  const dawnCloudShade = {
    top: mixHex(dawnCloudColor, pearl, 0.35),
    bottom: mixHex(dawnCloudColor, dawnHorizon, 0.4),
  };

  return {
    dusk: {
      // The zenith stays near-black indigo across all three states (the
      // top of the sky barely changes through the night) — only the
      // horizon transforms, reinforcing "one continuous environment."
      skyTop: indigo950,
      skyAccent: duskSkyAccent,
      skyMid: violet600,
      horizonColor: duskHorizon,
      // Reduced from 1 — now that the sky itself carries real vividness
      // up to the ridge line (Step 2), the glow is a contained accent at
      // the valley seam, not the thing doing all the color work.
      horizonGlowOpacity: 0.7,
      farMountainTop: duskShades.far.top,
      farMountainBottom: duskShades.far.bottom,
      midMountainTop: duskShades.mid.top,
      midMountainBottom: duskShades.mid.bottom,
      nearMountainTop: duskShades.near.top,
      nearMountainBottom: duskShades.near.bottom,
      rockTint: rockTint(duskShades.near.bottom),
      cloudTop: duskCloudShade.top,
      cloudBottom: duskCloudShade.bottom,
      // Most present at dusk — warm, golden-lit clouds catching the last
      // light, per "more present at dusk/dawn."
      cloudOpacity: 0.9,
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
      skyAccent: nightSkyAccent,
      skyMid: violet800,
      horizonColor: nightHorizon,
      horizonGlowOpacity: 0.3,
      farMountainTop: nightShades.far.top,
      farMountainBottom: nightShades.far.bottom,
      midMountainTop: nightShades.mid.top,
      midMountainBottom: nightShades.mid.bottom,
      nearMountainTop: nightShades.near.top,
      nearMountainBottom: nightShades.near.bottom,
      rockTint: rockTint(nightShades.near.bottom),
      cloudTop: nightCloudShade.top,
      cloudBottom: nightCloudShade.bottom,
      // Most subdued — dim, barely-lit silhouettes that don't compete
      // with the stars for attention, per "more subdued at night."
      cloudOpacity: 0.35,
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
      skyAccent: dawnSkyAccent,
      skyMid: violet500,
      horizonColor: dawnHorizon,
      horizonGlowOpacity: 0.55,
      farMountainTop: dawnShades.far.top,
      farMountainBottom: dawnShades.far.bottom,
      midMountainTop: dawnShades.mid.top,
      midMountainBottom: dawnShades.mid.bottom,
      nearMountainTop: dawnShades.near.top,
      nearMountainBottom: dawnShades.near.bottom,
      rockTint: rockTint(dawnShades.near.bottom),
      cloudTop: dawnCloudShade.top,
      cloudBottom: dawnCloudShade.bottom,
      // Present, cooler-lit than dusk's golden version — per "more
      // present at dusk/dawn."
      cloudOpacity: 0.8,
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
  const farGradientId = `${uid}-far-gradient`;
  const midGradientId = `${uid}-mid-gradient`;
  const nearGradientId = `${uid}-near-gradient`;
  const cloudGradientId = `${uid}-cloud-gradient`;

  const { isIdle } = useWindowManager();
  const skyRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const horizonGlowGroupRef = useRef<SVGGElement>(null);
  const horizonInnerStopRef = useRef<SVGStopElement>(null);
  const horizonOuterStopRef = useRef<SVGStopElement>(null);
  // Each mountain layer is now a linearGradient (objectBoundingBox, top to
  // bottom) instead of a flat fill — these are the two stops per layer,
  // tweened independently so the ridge-top/base shading can differ from
  // the flat tint that used to be the whole fill (see shadeTint).
  const farTopStopRef = useRef<SVGStopElement>(null);
  const farBottomStopRef = useRef<SVGStopElement>(null);
  const midTopStopRef = useRef<SVGStopElement>(null);
  const midBottomStopRef = useRef<SVGStopElement>(null);
  const nearTopStopRef = useRef<SVGStopElement>(null);
  const nearBottomStopRef = useRef<SVGStopElement>(null);
  const rockRef = useRef<SVGPathElement>(null);
  const cloudTopStopRef = useRef<SVGStopElement>(null);
  const cloudBottomStopRef = useRef<SVGStopElement>(null);
  const cloudsGroupRef = useRef<SVGGElement>(null);
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
            "--sky-accent": scene.skyAccent,
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
      if (farTopStopRef.current) {
        tl.to(
          farTopStopRef.current,
          { attr: { "stop-color": scene.farMountainTop }, duration },
          0,
        );
      }
      if (farBottomStopRef.current) {
        tl.to(
          farBottomStopRef.current,
          { attr: { "stop-color": scene.farMountainBottom }, duration },
          0,
        );
      }
      if (midTopStopRef.current) {
        tl.to(
          midTopStopRef.current,
          { attr: { "stop-color": scene.midMountainTop }, duration },
          0,
        );
      }
      if (midBottomStopRef.current) {
        tl.to(
          midBottomStopRef.current,
          { attr: { "stop-color": scene.midMountainBottom }, duration },
          0,
        );
      }
      if (nearTopStopRef.current) {
        tl.to(
          nearTopStopRef.current,
          { attr: { "stop-color": scene.nearMountainTop }, duration },
          0,
        );
      }
      if (nearBottomStopRef.current) {
        tl.to(
          nearBottomStopRef.current,
          { attr: { "stop-color": scene.nearMountainBottom }, duration },
          0,
        );
      }
      if (rockRef.current) {
        tl.to(rockRef.current, { fill: scene.rockTint, duration }, 0);
      }
      if (cloudTopStopRef.current) {
        tl.to(
          cloudTopStopRef.current,
          { attr: { "stop-color": scene.cloudTop }, duration },
          0,
        );
      }
      if (cloudBottomStopRef.current) {
        tl.to(
          cloudBottomStopRef.current,
          { attr: { "stop-color": scene.cloudBottom }, duration },
          0,
        );
      }
      if (cloudsGroupRef.current) {
        tl.to(cloudsGroupRef.current, { opacity: scene.cloudOpacity, duration }, 0);
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

  // Was 6 points — read as sparse even at night's full opacity. Expanded
  // to ~28, spread across the upper ~35% of the frame (clear of the
  // mountain ridge line, which starts at y=40 at its highest). Per-state
  // density still comes from starOpacity dimming this SAME set (dusk/dawn
  // stay "noticeably lower than night" via that existing per-state dial,
  // not a separate smaller point list) — scale varies per star so the
  // field has real depth (a few bigger/brighter "key" stars among many
  // smaller ones) rather than uniform dots.
  const starPoints = [
    { cx: 4, cy: 10, scale: 1.1 },
    { cx: 9, cy: 22, scale: 0.7 },
    { cx: 14, cy: 6, scale: 0.9 },
    { cx: 19, cy: 16, scale: 1.3 },
    { cx: 25, cy: 28, scale: 0.6 },
    { cx: 30, cy: 9, scale: 0.8 },
    { cx: 36, cy: 19, scale: 1.0 },
    { cx: 41, cy: 4, scale: 0.7 },
    { cx: 47, cy: 24, scale: 0.9 },
    { cx: 52, cy: 12, scale: 1.2 },
    { cx: 58, cy: 30, scale: 0.6 },
    { cx: 63, cy: 7, scale: 1.0 },
    { cx: 68, cy: 20, scale: 0.8 },
    { cx: 73, cy: 32, scale: 0.7 },
    { cx: 77, cy: 14, scale: 1.1 },
    { cx: 82, cy: 25, scale: 0.9 },
    { cx: 87, cy: 5, scale: 0.6 },
    { cx: 91, cy: 17, scale: 1.3 },
    { cx: 95, cy: 27, scale: 0.8 },
    { cx: 2, cy: 30, scale: 0.7 },
    { cx: 12, cy: 33, scale: 0.6 },
    { cx: 22, cy: 3, scale: 0.9 },
    { cx: 33, cy: 34, scale: 0.7 },
    { cx: 44, cy: 15, scale: 0.6 },
    { cx: 55, cy: 3, scale: 0.8 },
    { cx: 65, cy: 35, scale: 0.6 },
    { cx: 85, cy: 33, scale: 0.7 },
    { cx: 98, cy: 11, scale: 0.9 },
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
          {/* Only for the tiny core bleed behind each sparkle now — was
              previously the star's ENTIRE visible shape (a soft circular
              blob), which is exactly the "glow blob, not a sparkle point"
              complaint. Kept small/tight underneath the crisp sparkle
              path below rather than removed outright, since "a very tight
              bright core glow at the center is fine." */}
          <radialGradient id={starGlowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={starsRef} className="wallpaper__stars">
          {starPoints.map((p) => (
            <g
              key={`${p.cx}-${p.cy}`}
              transform={`translate(${p.cx}, ${p.cy}) scale(${p.scale})`}
            >
              <circle r="0.45" fill={`url(#${starGlowId})`} />
              <path d={STAR_SPARKLE_PATH} fill="#ffffff" />
            </g>
          ))}
        </g>
      </svg>

      <div ref={moonRef} className="wallpaper__moon">
        <div className="wallpaper__moon-halo" />
        <div className="wallpaper__moon-ring" />
        <div className="wallpaper__moon-disc" />
        <div className="wallpaper__moon-highlight" />
        <div className="wallpaper__moon-glow2" />
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

          {/* Per-layer internal shading (Step 3): objectBoundingBox means
              y1=0/y2=1 always map to THIS shape's own top/bottom, so the
              lighter "catch" sits at each layer's own ridge line and the
              darker tone at its own base regardless of the wavy path
              underneath — no manual masking needed. Hard edges BETWEEN
              layers are untouched; this only varies color within one. */}
          <linearGradient id={farGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop ref={farTopStopRef} offset="0%" />
            <stop ref={farBottomStopRef} offset="100%" />
          </linearGradient>
          <linearGradient id={midGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop ref={midTopStopRef} offset="0%" />
            <stop ref={midBottomStopRef} offset="100%" />
          </linearGradient>
          <linearGradient id={nearGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop ref={nearTopStopRef} offset="0%" />
            <stop ref={nearBottomStopRef} offset="100%" />
          </linearGradient>

          {/* Shared by every cloud puff — objectBoundingBox maps y1=0/
              y2=1 to EACH path's own bbox independently, so one gradient
              definition shades every puff (lit top, shadowed underside)
              without needing a separate gradient per instance. */}
          <linearGradient id={cloudGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop ref={cloudTopStopRef} offset="0%" />
            <stop ref={cloudBottomStopRef} offset="100%" />
          </linearGradient>
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

        {/* Solid, crisply-edged cloud clusters beside each peak's outer
            slope — NOT a blurred/wispy shape and NOT blended into the sky
            gradient (that earlier approach read as decoration, not
            objects). No filter/blur and no mix-blend-mode here on
            purpose: real fill, hard vector edges, same rendering as the
            mountains themselves. Rendered before the mountains so any
            stray overlap at a peak's outer edge is occluded by the
            mountain silhouette in front of it, never the reverse. */}
        <g ref={cloudsGroupRef} className="wallpaper__clouds">
          {CLOUD_CLUSTERS.map((c) => (
            <path
              key={`${c.x}-${c.y}`}
              d={CLOUD_SHAPE_PATH}
              transform={`translate(${c.x}, ${c.y}) scale(${c.scale})`}
              fill={`url(#${cloudGradientId})`}
            />
          ))}
        </g>

        <path
          className="wallpaper__mountain"
          d={FAR_MOUNTAIN_PATH}
          fill={`url(#${farGradientId})`}
        />

        <path
          className="wallpaper__mountain"
          d={MID_MOUNTAIN_PATH}
          fill={`url(#${midGradientId})`}
        />

        <path
          className="wallpaper__mountain"
          d={NEAR_MOUNTAIN_PATH}
          fill={`url(#${nearGradientId})`}
        />

        {/* Frontmost rock/terrain strip — flat, hard-edged, no internal
            gradient (fill tweened directly, not via a linearGradient) so
            it stays visually distinct from the shaded mountain layer
            above it rather than reading as a fourth ridge. */}
        <path ref={rockRef} className="wallpaper__rocks" d={ROCK_PATH} />
      </svg>
    </div>
  );
}
