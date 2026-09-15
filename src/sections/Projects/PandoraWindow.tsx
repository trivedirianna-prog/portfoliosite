import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { projectFanPosition } from "./projectFan";
import { PROJECT_KINDS } from "./projectRegistry";
import pandoraHero from "./pandora-hero.png";
import pandoraDestinations from "./pandora-destinations.png";
import "./PandoraWindow.css";

const FAN_POSITION = projectFanPosition(
  PROJECT_KINDS.indexOf("pandora"),
  PROJECT_KINDS.length,
);

/*
  Pandora Tourism Website — the "designed but not built" middle tier of
  the three project windows (§8.3): a Figma prototype, never coded or
  live. Shaped distinctly from Portfolio's plain rectangle — rounder
  corners and a dashed inner frame around each screen, reading as an
  artboard/mockup rather than a real running window. Pandora's own navy/
  teal palette is left completely untouched (§8.3 — never recolor it to
  match the site); the site's coherence here comes only from the shared
  title bar/button chrome around it.
*/
export function PandoraWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();

  return (
    <Window
      windowId={windowId}
      title="Pandora"
      material="glossy"
      className="pandora-window--shape"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      originRect={originRects.projects ?? null}
      style={{ ...FAN_POSITION, width: "min(92vw, 460px)" }}
    >
      <div className="pandora-window">
        <span className="pandora-window__tag label-mono">Figma prototype</span>

        <div className="pandora-window__frame">
          <img
            className="pandora-window__image"
            src={pandoraHero}
            alt="Pandora Expeditions hero screen: Welcome to Pandora"
          />
        </div>
        <div className="pandora-window__frame">
          <img
            className="pandora-window__image"
            src={pandoraDestinations}
            alt="Pandora Expeditions Explore Destinations grid"
          />
        </div>

        <div className="pandora-window__content">
          <h2 className="pandora-window__title">Pandora Tourism Website</h2>
          <p className="pandora-window__description">
            An immersive tourism website inspired by Pandora, designed to
            promote exploration and responsible tourism.
          </p>
          <p className="pandora-window__meta">
            Designed prototype in Figma — not coded, not live.
          </p>
          <a
            className="pandora-window__link label-mono"
            href="https://www.figma.com/design/MRXbKVhoetdDq8DwmVNEyY/pandora-website"
            target="_blank"
            rel="noreferrer"
          >
            View in Figma
          </a>
        </div>
      </div>
    </Window>
  );
}
