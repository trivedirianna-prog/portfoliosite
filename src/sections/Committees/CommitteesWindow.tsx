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

  §9's hidden discovery detail lives here too, same interaction pattern
  as About's ribbon (click to reveal/retract, not hover) but a different
  visual: a small paper tag peeking out from behind/between the two main
  cards (not a third equal card), which slides out further on click to
  show "Member, Beats DJS".
*/
export function CommitteesWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();
  const [beatsRevealed, setBeatsRevealed] = useState(false);

  return (
    <>
      <div
        className={`committees-window__beats-reveal${beatsRevealed ? " committees-window__beats-reveal--revealed" : ""}`}
        style={{ left: "50%", top: "50%" }}
        aria-hidden={!beatsRevealed}
      >
        <span className="committees-window__beats-kicker label-mono--bold">
          Member
        </span>
        <p className="committees-window__beats-text">Beats DJS</p>
      </div>

      <Window
        title="Committees"
        material="paper"
        focused={focusedId === windowId}
        onFocus={() => focusWindow(windowId)}
        onClose={() => closeWindow(windowId)}
        onCloseStart={() => setBeatsRevealed(false)}
        onMinimize={() => minimizeWindow(windowId)}
        originRect={originRects.committees ?? null}
        style={{ width: "min(94vw, 780px)" }}
      >
        <div className="committees-window">
          <div className="committees-window__cards">
            {/* Small paper tag tucked behind/between the two cards — the
                §9 discovery trigger. Deliberately smaller than either
                real card and mostly occluded, so it reads as a peeking
                detail, not a third equal membership. */}
            <button
              type="button"
              className="committees-window__beats-peek"
              aria-pressed={beatsRevealed}
              aria-label="Reveal hidden detail"
              onClick={() => setBeatsRevealed((v) => !v)}
            />

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
    </>
  );
}
