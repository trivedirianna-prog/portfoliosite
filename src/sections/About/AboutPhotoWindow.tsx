import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { CLUSTER_EMPHASIS } from "../../windows/windowCluster";
import "./AboutPhotoWindow.css";

/*
  About's SECOND window (§8.1) — opens simultaneously with AboutWindow
  (the text/journal window), not staggered; see About.tsx's click
  handler, which opens this one second so it lands on top of the DOM
  stack (matching its heavier visual weight). Uses the same Window shell
  (material="paper", same close/minimize controls) but leans more
  editorial/physical than the plain content window: a thick pearl mat/
  border like a printed photo, and `emphasis` for a heavier shadow.

  Positioned/rotated as the EMPHASIS half of the editorial cluster
  (windowCluster.ts) — overlapping a real portion of AboutWindow's edge,
  rotated the opposite direction, at a more modest size gap than the
  first version of this window used.

  STILL A PLACEHOLDER: no real photo has been supplied yet. Per
  explicit direction, this project never generates/invents an image —
  the gray block + label stays until the actual photo file is provided,
  at which point it drops into this same mat/frame treatment.
*/
export function AboutPhotoWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId } =
    useWindowManager();

  return (
    <Window
      title="Photo"
      material="paper"
      emphasis
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      style={CLUSTER_EMPHASIS.style}
      rotate={CLUSTER_EMPHASIS.rotate}
    >
      <div className="about-photo-window">
        <div className="about-photo-window__mat">
          <div className="about-photo-window__placeholder">
            <span className="about-photo-window__placeholder-tag label-mono">
              placeholder — real photo next phase
            </span>
          </div>
        </div>
        <p className="about-photo-window__caption label-mono">
          Rianna Trivedi — photo
        </p>
      </div>
    </Window>
  );
}
