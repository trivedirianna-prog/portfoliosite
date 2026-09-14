import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import "./AboutWindow.css";

/*
  About's window (§7.3/§7.4 test case). Per direction, this is now the
  same plain rectangle every window uses — journal character (the
  spine-colored stripe, the small ribbon-tab accent) is surface
  decoration layered on top of that rectangle, not a replacement for its
  shape (an earlier pass scaled the desktop icon's own page/ribbon
  outline up as the entire window silhouette; that read as unreadable
  and overlapped neighboring desktop elements, so it was reverted).
  Content is placeholder/lorem — real About copy is a later phase.
*/
export function AboutWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId } =
    useWindowManager();

  return (
    <Window
      title="About"
      material="paper"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
    >
      <div className="about-window">
        {/* Spine stripe — a hint of the journal cover's own plum-700,
            decorating the rectangle's left edge rather than shaping it. */}
        <div className="about-window__spine" aria-hidden="true" />
        {/* Small ribbon-tab accent tucked into the top edge. */}
        <div className="about-window__ribbon-tab" aria-hidden="true" />

        <div className="about-window__content">
          <p className="about-window__placeholder-tag label-mono">
            placeholder — real copy next phase
          </p>
          <h2 className="about-window__heading">Rianna Trivedi</h2>
          <p className="about-window__body-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
            enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
          <p className="about-window__body-text">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>
      </div>
    </Window>
  );
}
