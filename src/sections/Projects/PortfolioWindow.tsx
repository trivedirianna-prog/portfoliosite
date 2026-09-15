import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { projectFanPosition } from "./projectFan";
import { PROJECT_KINDS } from "./projectRegistry";
import portfolioHero from "./portfolio-hero.png";
import "./PortfolioWindow.css";

const FAN_POSITION = projectFanPosition(
  PROJECT_KINDS.indexOf("portfolio"),
  PROJECT_KINDS.length,
);

/*
  Personal Portfolio — the "most finished/real" tier of the three project
  windows (§8.3): real shipped code, so this window is deliberately the
  plainest and least abstract of the three — a near-default rectangle
  (just a touch sharper-cornered than the shared base, via `className`),
  no framing gimmick, the screenshot presented plainly like a browser
  preview. Glossy material (Projects belongs to the glossy family, §10),
  same title bar/button chrome as every other window on the site.
*/
export function PortfolioWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();

  return (
    <Window
      windowId={windowId}
      title="Personal Portfolio"
      material="glossy"
      className="portfolio-window--shape"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      originRect={originRects.projects ?? null}
      style={{ ...FAN_POSITION, width: "min(92vw, 480px)" }}
    >
      <div className="portfolio-window">
        <img
          className="portfolio-window__screenshot"
          src={portfolioHero}
          alt="Personal Portfolio hero section screenshot"
        />
        <div className="portfolio-window__content">
          <h2 className="portfolio-window__title">Personal Portfolio</h2>
          <p className="portfolio-window__description">
            Built using HTML, CSS and JavaScript.
          </p>
          <p className="portfolio-window__meta">
            Hand-coded, no framework — not currently live or deployed
            anywhere. Not to be confused with this desktop site itself; this
            is a separate, earlier project.
          </p>
          <a
            className="portfolio-window__link label-mono"
            href="https://github.com/trivedirianna-prog/Rianna_InfoTech_ACM"
            target="_blank"
            rel="noreferrer"
          >
            github.com/trivedirianna-prog/Rianna_InfoTech_ACM
          </a>
        </div>
      </div>
    </Window>
  );
}
