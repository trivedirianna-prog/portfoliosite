import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import "./AboutPhotoWindow.css";

/*
  About's SECOND window (§8.1) — opens simultaneously with AboutWindow
  (the text/journal window), not staggered; see About.tsx's click
  handler. Uses the same Window shell (material="paper", same close/
  minimize controls) but leans more editorial/physical than the plain
  content window: a thick pearl mat/border like a printed photo, and
  `emphasis` for a heavier shadow so it reads as visually weightier even
  though both windows appear at the same instant. Placeholder image
  block for now — the real photo is a later phase.
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
      style={{ left: "60%", top: "56%", width: "min(94vw, 540px)" }}
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
