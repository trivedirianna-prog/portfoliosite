import { useEffect, useRef, useState } from "react";
import { gsap } from "../../lib/gsap";
import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { WindowHost } from "../../windows/WindowHost";
import { MirrorProvider } from "../../windows/mirrorContext";
import { Wallpaper } from "../../boot/Wallpaper";
import { Desktop } from "../../desktop/Desktop";
import { projectFanPosition } from "./projectFan";
import { PROJECT_KINDS } from "./projectRegistry";
import "./TakeTwoWindow.css";

const FAN_POSITION = projectFanPosition(
  PROJECT_KINDS.indexOf("taketwo"),
  PROJECT_KINDS.length,
);

// Width of the mirrored view inside the window; its height follows the
// real viewport's own aspect ratio (see useViewportSize below) so the
// mirror never looks stretched relative to the actual desktop.
const MIRROR_WIDTH = 480;

function useViewportSize() {
  const [size, setSize] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  useEffect(() => {
    function handleResize() {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

/*
  Proof-of-life for the mirror (§8.3): a small dot that tracks the
  visitor's REAL cursor position in real time, reusing the exact
  pointermove-tracking technique the custom cursor system already
  established (§13) — gsap.quickTo driven by a raw `pointermove`
  listener, kept off React state so it doesn't re-render anything.
  Guarantees something is visibly moving inside the mirror even when the
  visitor has no other windows open (the common case), which a static
  screenshot could never fake.

  Positioned with plain viewport coordinates (clientX/clientY) as a
  `position: fixed` element — same as every other mirrored layer, it
  gets reparented to the scaled stage below as its containing block
  (see .taketwo-window__mirror-stage's transform in the CSS), so it
  lands in the visually-correct spot once the stage is scaled down,
  with no manual scale math needed here.
*/
function CursorEcho() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.12, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.12, ease: "power3" });

    function handleMove(e: PointerEvent) {
      xTo(e.clientX);
      yTo(e.clientY);
    }

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return <div ref={ref} className="taketwo-window__cursor-echo" aria-hidden="true" />;
}

/*
  Take Two — the "meta" project (§8.3): this Y2K desktop site itself,
  the second attempt at a personal portfolio after the hand-coded
  Personal Portfolio project. The most "real/finished" of the three
  (it's the very thing being interacted with right now), so it opens
  frontmost in the fan-out stacking — see Projects.tsx's handleOpen.

  The live mirror: a genuine second rendering of the SAME shared app
  components (Wallpaper, Desktop, WindowHost) — never a screenshot or
  screen-capture — scaled down via a single CSS transform on a wrapper
  sized to the real viewport. Because .wallpaper and .window are both
  `position: fixed`, a `transform` on that wrapper makes it their
  containing block instead of the real viewport (a standard CSS
  mechanism), so everything inside lands at the correct proportional
  position automatically once scaled — no per-element math needed.

  Excludes only THIS window's own id from the mirrored WindowHost
  (infinite-recursion guard) — every other open window/object still
  renders live, including other Project windows if they're open too.

  Wrapped in MirrorContext so the mirrored Window instances skip their
  own open/close entrance animation and settle directly (see
  mirrorContext.ts) — without this, a window mid-open-tween on the real
  desktop would replay that same tween a second time inside the tiny
  mirror using the real desktop's coordinates, which reads as glitchy
  rather than the settled live view this is meant to be. The CD-R's own
  transient lid/disc-tilt animation is local presentational state (not
  shared app state), so the mirror's own Projects icon simply doesn't
  replay it — a deliberate, minor scope boundary, not a bug.
*/
export function TakeTwoWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();
  const { w: viewportWidth, h: viewportHeight } = useViewportSize();
  const scale = MIRROR_WIDTH / viewportWidth;
  const mirrorHeight = viewportHeight * scale;

  return (
    <Window
      title="Take Two"
      material="glossy"
      className="taketwo-window--shape"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      originRect={originRects.projects ?? null}
      style={{ ...FAN_POSITION, width: "min(94vw, 640px)" }}
    >
      <div className="taketwo-window">
        <div
          className="taketwo-window__mirror"
          style={{ width: MIRROR_WIDTH, height: mirrorHeight }}
        >
          <div
            className="taketwo-window__mirror-stage"
            style={{
              width: viewportWidth,
              height: viewportHeight,
              transform: `scale(${scale})`,
            }}
          >
            <MirrorProvider value={true}>
              <Wallpaper />
              <Desktop />
              <WindowHost excludeWindowId={windowId} />
              <CursorEcho />
            </MirrorProvider>
          </div>
          <div className="taketwo-window__mirror-bezel" aria-hidden="true" />
          <span className="taketwo-window__mirror-led" aria-hidden="true" />
        </div>

        <div className="taketwo-window__content">
          <h2 className="taketwo-window__title">Take Two</h2>
          <p className="taketwo-window__tagline">second time&apos;s the charm!</p>
          <p className="taketwo-window__description">
            A ground-up second attempt at a personal portfolio — this time
            as a fully interactive Y2K desktop, built with TypeScript,
            React, Vite, and GSAP. A different approach entirely from the
            first hand-coded HTML/CSS/JS version.
          </p>
          <p className="taketwo-window__meta label-mono">
            You&apos;re looking at it right now.
          </p>
        </div>
      </div>
    </Window>
  );
}
