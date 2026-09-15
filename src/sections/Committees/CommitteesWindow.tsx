import { useState } from "react";
import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import "./CommitteesWindow.css";

/*
  Committees' window (§8.4) — the card wallet's single window, reusing
  the generic system built for About/Education: same paper-family title
  bar/button chrome, same emerge-from/retract-to-the-wallet motion via
  originRect (see WindowManager.originRects, keyed by "committees").

  Wider than the shared 460px default (min(94vw, 780px)) — two real
  membership cards side by side, each an ID-card layout (org identity +
  role as the header, joined date as a small detail, personal line as
  body text), not a single stacked document like Education's record.
  Each card is its own bordered/shadowed surface with a slight opposite
  tilt, reading as two distinct physical cards rather than two text
  blocks split by a divider.

  §9's hidden discovery detail ("Member, Beats DJS") lives entirely
  inside this window now — a prior version put the reveal on the open
  desktop (disconnected from the wallet it's supposed to belong to) and
  used a small pink "peek" nub wedged between the two cards that read as
  an unexplained UI artifact rather than a designed detail. Both are
  gone. The trigger is now a small icon button in the title bar itself
  (Window's `extraControl`, §7.3's shared button chip — same lighting/
  hover language as minimize/close, not a bespoke style), and the reveal
  is a panel that expands/fades in above the two cards, inside the
  window, never on the desktop and never a third equal card.
*/
export function CommitteesWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();
  const [beatsRevealed, setBeatsRevealed] = useState(false);

  return (
    <Window
      windowId={windowId}
      title="Committees"
      material="paper"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onCloseStart={() => setBeatsRevealed(false)}
      onMinimize={() => minimizeWindow(windowId)}
      originRect={originRects.committees ?? null}
      style={{ width: "min(94vw, 780px)" }}
      extraControl={{
        label: beatsRevealed ? "Hide hidden detail" : "Reveal hidden detail",
        pressed: beatsRevealed,
        onClick: () => setBeatsRevealed((v) => !v),
        icon: (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <line x1="7.4" y1="1.6" x2="7.4" y2="7.6" />
            <path
              d="M7.4,1.6 C9,1.9 9.3,3.3 8,4.1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="5.7" cy="8.7" r="1.7" fill="currentColor" />
          </svg>
        ),
      }}
    >
      <div className="committees-window">
        <div
          className={`committees-window__discovery${beatsRevealed ? " committees-window__discovery--revealed" : ""}`}
          aria-hidden={!beatsRevealed}
        >
          <p className="committees-window__discovery-text">
            a member of beats djs as well!
          </p>
        </div>

        <div className="committees-window__cards">
          <div className="committees-window__card committees-window__card--acm">
            <div className="committees-window__card-header">
              <p className="committees-window__card-title">ACM</p>
              <span className="committees-window__card-tag label-mono">
                Infotech
              </span>
            </div>
            <p className="committees-window__card-role">
              Co-committee member, Infotech
            </p>
            <p className="committees-window__card-joined label-mono">
              Joined August 2026
            </p>
            <p className="committees-window__card-personal">
              {
                "I'm drawn to Infotech because I enjoy understanding how technology works and how different systems come together. I want to strengthen my backend skills while improving my frontend, especially through web and game development."
              }
            </p>
            <div className="committees-window__card-status">
              <p className="committees-window__card-status-text">
                {
                  "Current status: currently working on the ACM website alongside the team, and building games for the DigiHunt event."
                }
              </p>
            </div>
          </div>

          <div className="committees-window__card committees-window__card--unicode">
            <div className="committees-window__card-header">
              <p className="committees-window__card-title">Unicode</p>
              <span className="committees-window__card-tag label-mono">
                UI/UX
              </span>
            </div>
            <p className="committees-window__card-role">Mentee, UI/UX</p>
            <p className="committees-window__card-joined label-mono">
              Joined August 2026
            </p>
            <p className="committees-window__card-personal">
              {
                "I'm drawn to UI/UX because I've always enjoyed the creative side of technology. I like experimenting with layouts, visuals, and small details while thinking about how someone will actually interact with what I design."
              }
            </p>
          </div>
        </div>
      </div>
    </Window>
  );
}
