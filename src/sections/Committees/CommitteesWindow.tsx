import { useRef, useState, type KeyboardEvent } from "react";
import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import "./CommitteesWindow.css";

type CardId = "acm" | "unicode";

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

  Click-to-focus (spotlight): clicking either card brings just that one
  forward — centered, slightly enlarged, its own tilt/rotation settling
  to upright — while a dark scrim covers the rest of the window,
  including the other card. A plain CSS transition on the card's own
  transform/shadow (same duration/easing tokens as everything else,
  §12 — no bounce) handles the motion: the focused card switches from
  `position: relative` (in the flex row) to `position: absolute`
  (centered in `.committees-window__cards`, already the positioning
  context) and CSS animates that transform change on its own.

  One measurement IS needed, not for the motion but to stop the row
  collapsing: taking a card out of flow for centering means flexbox no
  longer sees it when sizing `.committees-window__cards`, so the row
  would shrink to fit only the remaining (shorter) card — pushing the
  centered spotlight card up, potentially under the title bar. `cardsRef`
  locks the row's own height (read from the DOM right before the state
  change, while both cards are still in flow) as an inline min-height
  for as long as a card is focused, then clears it on dismiss — a fixed
  CSS min-height can't do this since the "right" height depends on
  actual content/window width at the moment of focusing, not a constant.

  Three ways back to the normal two-card view, all wired through
  `dismissCard`: the scrim, the card's own small close chip, or clicking
  the focused card again — independent of and never conflicting with
  the beats-DJS reveal (a separate panel, separate state), and reset on
  close alongside it so a reopened window never starts with a card
  already focused.
*/
export function CommitteesWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();
  const [beatsRevealed, setBeatsRevealed] = useState(false);
  const [focusedCard, setFocusedCard] = useState<CardId | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  function focusCard(card: CardId) {
    if (cardsRef.current) {
      cardsRef.current.style.minHeight = `${cardsRef.current.getBoundingClientRect().height}px`;
    }
    setFocusedCard(card);
  }

  function dismissCard() {
    if (cardsRef.current) cardsRef.current.style.minHeight = "";
    setFocusedCard(null);
  }

  function toggleCardFocus(card: CardId) {
    if (focusedCard === card) {
      dismissCard();
    } else {
      focusCard(card);
    }
  }

  function handleCardKeyDown(card: CardId, e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCardFocus(card);
    }
  }

  return (
    <Window
      windowId={windowId}
      title="Committees"
      material="paper"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onCloseStart={() => {
        setBeatsRevealed(false);
        dismissCard();
      }}
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

        <div className="committees-window__cards" ref={cardsRef}>
          <div
            className={`committees-window__card committees-window__card--acm${focusedCard === "acm" ? " committees-window__card--focused" : ""}`}
            role="button"
            tabIndex={0}
            aria-pressed={focusedCard === "acm"}
            aria-label={focusedCard === "acm" ? "Dismiss ACM card" : "Focus ACM card"}
            onClick={() => toggleCardFocus("acm")}
            onKeyDown={(e) => handleCardKeyDown("acm", e)}
          >
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
            {focusedCard === "acm" && <CardCloseButton onClick={dismissCard} />}
          </div>

          <div
            className={`committees-window__card committees-window__card--unicode${focusedCard === "unicode" ? " committees-window__card--focused" : ""}`}
            role="button"
            tabIndex={0}
            aria-pressed={focusedCard === "unicode"}
            aria-label={focusedCard === "unicode" ? "Dismiss Unicode card" : "Focus Unicode card"}
            onClick={() => toggleCardFocus("unicode")}
            onKeyDown={(e) => handleCardKeyDown("unicode", e)}
          >
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
            {focusedCard === "unicode" && <CardCloseButton onClick={dismissCard} />}
          </div>

          <button
            type="button"
            className={`committees-window__scrim${focusedCard ? " committees-window__scrim--visible" : ""}`}
            aria-label="Dismiss focused card"
            tabIndex={focusedCard ? 0 : -1}
            onClick={dismissCard}
          />
        </div>
      </div>
    </Window>
  );
}

// Shared close chip for a focused card — same crossed-line glyph as
// Window.tsx's own close control, scaled down, so "close this" reads
// consistently across the whole site rather than inventing a second X
// icon style just for this one spot.
function CardCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="committees-window__card-close"
      aria-label="Close focused card"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
        <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
      </svg>
    </button>
  );
}
