import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { projectFanPosition } from "./projectFan";
import { PROJECT_KINDS } from "./projectRegistry";
import "./AgriVerseWindow.css";

const FAN_POSITION = projectFanPosition(
  PROJECT_KINDS.indexOf("agriverse"),
  PROJECT_KINDS.length,
);

/*
  AgriVerse — the "concept/pitch stage" tier of the three project
  windows (§8.3), and allowed to look less finished than the other two;
  that's intentional, not a gap to hide. Text-only, matching Portfolio
  and Pandora's own proportions rather than being diagram-heavy — an
  earlier version included an original schematic diagram, which was a
  misread of the brief and has been removed entirely (no leftover SVG,
  markup, or CSS sizing built around it).

  Shaped distinctly from the other two: an asymmetric, slightly uneven
  corner mix (draft/sketch feel) plus a dashed outer border, rather than
  Portfolio's crisp rectangle or Pandora's soft artboard rounding —
  content changed, silhouette unchanged.
*/
export function AgriVerseWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();

  return (
    <Window
      title="AgriVerse"
      material="glossy"
      className="agriverse-window--shape"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      originRect={originRects.projects ?? null}
      style={{ ...FAN_POSITION, width: "min(92vw, 460px)" }}
    >
      <div className="agriverse-window">
        <p className="agriverse-window__lead">
          AgriVerse — a smart agriculture platform designed to help farmers
          reduce water wastage, improve productivity, and make more informed
          farming decisions.
        </p>
        <p className="agriverse-window__paragraph">
          Developed as a venture idea for the Soonami.io IDEATHON 2025 at
          TCET Zephyr &apos;25, exploring a technology-driven approach to
          sustainable agriculture.
        </p>
        <p className="agriverse-window__paragraph">
          A wireframe for the platform was also developed, but is not
          currently available.
        </p>
      </div>
    </Window>
  );
}
