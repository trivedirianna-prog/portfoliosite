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
  that's intentional, not a gap to hide. No visual asset exists for this
  one (unrecoverable, per direction) — content is text-only (origin +
  mechanic) plus one small ORIGINAL schematic built fresh for this site,
  illustrating the real stated mechanic (weather + soil data -> app ->
  farmer decision -> improved yield/reduced waste) in the site's own
  glossy material language, not a generic flowchart or invented content.

  Shaped distinctly from the other two: an asymmetric, slightly uneven
  corner mix (draft/sketch feel) plus a dashed outer border, rather than
  Portfolio's crisp rectangle or Pandora's soft artboard rounding.
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
        <h2 className="agriverse-window__title">AgriVerse</h2>
        <p className="agriverse-window__origin">
          Built for Soonami.io&rsquo;s IDEATHON 2025 (Web3 &amp; AI
          Innovation Challenge), part of TCET&rsquo;s Zephyr &rsquo;25.
        </p>
        <p className="agriverse-window__description">
          Uses weather data and soil sensor data to help farmers maximize
          crop yield and minimize resource waste.
        </p>

        <svg
          className="agriverse-window__schematic"
          viewBox="0 0 300 250"
          role="img"
          aria-label="Schematic: weather data and soil sensor data feed into AgriVerse, informing a farmer's decision, resulting in improved yield and reduced waste"
        >
          <defs>
            <marker
              id="agriverse-arrow"
              viewBox="0 0 8 8"
              refX="4"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8 Z" className="agriverse-window__arrowhead" />
            </marker>
          </defs>

          {/* Weather Data + Soil Sensor Data -> converge down to the app */}
          <rect x="8" y="10" width="128" height="38" rx="6" className="agriverse-window__node" />
          <text x="72" y="33" className="agriverse-window__node-text">
            Weather Data
          </text>

          <rect x="164" y="10" width="128" height="38" rx="6" className="agriverse-window__node" />
          <text x="228" y="33" className="agriverse-window__node-text">
            Soil Sensor Data
          </text>

          <path
            d="M72,48 L128,78"
            className="agriverse-window__arrow"
            markerEnd="url(#agriverse-arrow)"
          />
          <path
            d="M228,48 L172,78"
            className="agriverse-window__arrow"
            markerEnd="url(#agriverse-arrow)"
          />

          {/* AgriVerse App */}
          <rect x="100" y="80" width="100" height="38" rx="6" className="agriverse-window__node agriverse-window__node--core" />
          <text x="150" y="103" className="agriverse-window__node-text">
            AgriVerse App
          </text>

          <path
            d="M150,118 L150,148"
            className="agriverse-window__arrow"
            markerEnd="url(#agriverse-arrow)"
          />

          {/* Farmer Decision */}
          <rect x="92" y="150" width="116" height="38" rx="6" className="agriverse-window__node" />
          <text x="150" y="173" className="agriverse-window__node-text">
            Farmer Decision
          </text>

          <path
            d="M150,188 L150,208"
            className="agriverse-window__arrow"
            markerEnd="url(#agriverse-arrow)"
          />

          {/* Outcome */}
          <rect x="58" y="210" width="184" height="34" rx="6" className="agriverse-window__node agriverse-window__node--outcome" />
          <text x="150" y="231" className="agriverse-window__node-text agriverse-window__node-text--outcome">
            Improved Yield · Reduced Waste
          </text>
        </svg>
      </div>
    </Window>
  );
}
