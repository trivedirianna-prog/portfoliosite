import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { CLUSTER_EMPHASIS } from "../../windows/windowCluster";
import "./AboutPhotoWindow.css";

/*
  About's SECOND window (§8.1) — opens simultaneously with AboutWindow
  (the text/journal window), not staggered; see About.tsx's click
  handler (openClusterPair), which opens THIS one first so AboutWindow
  lands on top of it. This window's heavier visual weight comes entirely
  from its own `emphasis` shadow and the thick pearl mat/border below —
  not from being the topmost layer.

  Positioned as the EMPHASIS half of the editorial cluster
  (windowCluster.ts) — overlapping a real portion of AboutWindow's edge,
  at a modest footprint (smaller than a prior, too-large version of this
  window). Upright, not rotated — the cluster feeling comes from offset
  position and real overlap alone.

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
