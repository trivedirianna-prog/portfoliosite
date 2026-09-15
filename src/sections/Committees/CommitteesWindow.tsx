import { useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import "./CommitteesWindow.css";

type CardId = "acm" | "unicode";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

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

  Click-to-focus (spotlight): clicking either card brings it forward —
  same size and shape the entire time (no scale/enlarge — a prior pass
  had one; removed per direction), just a deeper shadow, a small lift,
  and its own tilt settling upright — while a scrim dims the ENTIRE
  screen, not just this window, so the spotlighted card reads as pulled
  in front of everything, not just its sibling card.

  That full-screen reach is exactly why this can't be a plain absolutely
  positioned child anymore: `.window` always carries a live GSAP
  transform (position/drag), which makes it the CSS containing block for
  any descendant `position: fixed` — so a scrim or spotlighted card
  living inside this component's normal DOM tree can never escape to
  cover the true viewport, only the window's own box. Both the scrim and
  the spotlighted card render through a React portal straight to
  `document.body` instead (see the Spotlight section of the JSX below),
  positioned via `position: fixed` at the ORIGINAL card's own measured
  on-screen rect (captured once, right when focus starts) — same size,
  same spot, just now stacked above everything via --z-spotlight.

  The original in-window card stays exactly where it is in the flex row
  the whole time — never resized, never removed from flow, just
  `visibility: hidden` while its portal stand-in is showing. That's what
  keeps the OTHER (non-focused) card's own box completely unaffected:
  since neither card is ever taken out of flow anymore, there's nothing
  for the row to collapse around — the flex-collapse/stretch issue an
  earlier pass had here (from taking the focused card out of flow to
  center it) can't recur, because nothing here does that anymore.

  Three ways back to the normal view, all wired through `dismissCard`:
  the scrim, the spotlighted card's own close chip, or clicking the
  spotlighted card again — independent of and never conflicting with
  the beats-DJS reveal (a separate panel, separate state), and reset on
  close alongside it so a reopened window never starts with a card
  already focused. Minimizing unmounts this whole component (WindowHost
  only renders "open" windows), which tears down the portal and its
  state along with everything else — restoring from minimize is a fresh
  mount, so it never needs an explicit reset either.

  The scrim itself is FOUR rectangles tiling the viewport around a hole
  (see the CSS's `stripStyle`-shaped inline styles below), not one plain
  full-bleed overlay — the hole sits exactly over THIS window's own
  title bar. Without it, drag/minimize/close would be silently dead
  while a card is focused: the scrim is a real `position: fixed; inset:
  0` layer at --z-spotlight, and `.window` always carries a live GSAP
  transform (this file's own header explains why that traps a `fixed`
  descendant inside `.window`'s box) — which ALSO means `.window`
  necessarily establishes its own stacking context, so nothing inside it
  (its title bar included) can ever locally out-z-index an unrelated
  sibling context like this portal. A literal rectangular hole sidesteps
  that entirely: no z-index trick needed, the title bar just never gets
  covered in the first place, while the window's BODY (the non-focused
  card) stays under the scrim and dimmed exactly as before. The hole's
  rect is measured fresh at focus-start (`focusCard`) and again after
  every drag (`Window`'s `onDragEnd`, since dragging moves the title bar
  to a new spot) via `data-window-id` — live tracking during the drag
  itself isn't needed, since GSAP Draggable already tracks pointer
  movement at the document level once a drag starts, independent of
  what's painted on top.
*/
const RECT_ZERO: SpotlightRect = { top: 0, left: 0, width: 0, height: 0 };

export function CommitteesWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();
  const [beatsRevealed, setBeatsRevealed] = useState(false);
  // `focusedCard` alone drives visibility/dismissal — `displayedCard`
  // and `spotlightRect` are never reset to null/zero on dismiss, only
  // ever updated when a card is newly FOCUSED. That's deliberate: the
  // portal card below stays mounted permanently (not conditionally
  // created/destroyed), which is what lets its opacity/transform/shadow
  // actually CSS-transition in and out — a React-recreated element has
  // no previous painted frame to transition from, so it would just pop.
  // Keeping stale content/position around while invisible is harmless
  // since nothing reads them while `focusedCard` is null.
  const [focusedCard, setFocusedCard] = useState<CardId | null>(null);
  const [displayedCard, setDisplayedCard] = useState<CardId>("acm");
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect>(RECT_ZERO);
  // The scrim's title-bar-shaped hole (see the file header) — kept as its
  // own rect, separate from the card's, since it tracks a different
  // element and needs re-measuring on a different event (drag-end, not
  // focus alone).
  const [titlebarRect, setTitlebarRect] = useState<SpotlightRect>(RECT_ZERO);
  const acmRef = useRef<HTMLDivElement>(null);
  const unicodeRef = useRef<HTMLDivElement>(null);
  const cardRefs = { acm: acmRef, unicode: unicodeRef };

  function measureTitlebarRect() {
    const el = document.querySelector(
      `[data-window-id="${windowId}"] .window__titlebar`,
    );
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTitlebarRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }

  function focusCard(card: CardId) {
    const el = cardRefs[card].current;
    if (el) {
      const r = el.getBoundingClientRect();
      setSpotlightRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    measureTitlebarRect();
    setDisplayedCard(card);
    setFocusedCard(card);
  }

  function dismissCard() {
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

  function handleDismissKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dismissCard();
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
      onDragEnd={() => {
        if (focusedCard) measureTitlebarRect();
      }}
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
          <div
            ref={acmRef}
            className={`committees-window__card committees-window__card--acm${focusedCard === "acm" ? " committees-window__card--spotlit" : ""}`}
            role="button"
            tabIndex={focusedCard === "acm" ? -1 : 0}
            aria-pressed={focusedCard === "acm"}
            aria-label="Focus ACM card"
            onClick={() => toggleCardFocus("acm")}
            onKeyDown={(e) => handleCardKeyDown("acm", e)}
          >
            <AcmCardBody />
          </div>

          <div
            ref={unicodeRef}
            className={`committees-window__card committees-window__card--unicode${focusedCard === "unicode" ? " committees-window__card--spotlit" : ""}`}
            role="button"
            tabIndex={focusedCard === "unicode" ? -1 : 0}
            aria-pressed={focusedCard === "unicode"}
            aria-label="Focus Unicode card"
            onClick={() => toggleCardFocus("unicode")}
            onKeyDown={(e) => handleCardKeyDown("unicode", e)}
          >
            <UnicodeCardBody />
          </div>
        </div>
      </div>

      {/* --- Spotlight portal (see the file header for why this can't
          live inside the normal DOM tree) — always mounted (never
          conditionally created/destroyed) so the opacity/transform/
          shadow transitions below actually have a previous frame to
          animate from; `--visible` is the only thing that toggles. The
          card sits at its original element's own measured rect, same
          size as always, just elevated. --- */}
      {createPortal(
        <div
          className={`committees-spotlight${focusedCard ? " committees-spotlight--visible" : ""}`}
        >
          {/* Four strips tiling the viewport around a hole over THIS
              window's own title bar (see the file header) — not one
              plain full-bleed rect. top/bottom span the full width;
              left/right fill only the vertical band level with the
              title bar, so together all four cover exactly the viewport
              minus that one rectangle, with no gap and no overlap. */}
          <button
            type="button"
            className="committees-spotlight__scrim"
            aria-label="Dismiss focused card"
            tabIndex={focusedCard ? 0 : -1}
            onClick={dismissCard}
            style={{ top: 0, left: 0, right: 0, height: titlebarRect.top }}
          />
          <button
            type="button"
            className="committees-spotlight__scrim"
            aria-label="Dismiss focused card"
            tabIndex={focusedCard ? 0 : -1}
            onClick={dismissCard}
            style={{
              top: titlebarRect.top + titlebarRect.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <button
            type="button"
            className="committees-spotlight__scrim"
            aria-label="Dismiss focused card"
            tabIndex={focusedCard ? 0 : -1}
            onClick={dismissCard}
            style={{
              top: titlebarRect.top,
              left: 0,
              width: titlebarRect.left,
              height: titlebarRect.height,
            }}
          />
          <button
            type="button"
            className="committees-spotlight__scrim"
            aria-label="Dismiss focused card"
            tabIndex={focusedCard ? 0 : -1}
            onClick={dismissCard}
            style={{
              top: titlebarRect.top,
              left: titlebarRect.left + titlebarRect.width,
              right: 0,
              height: titlebarRect.height,
            }}
          />
          <div
            className={`committees-window__card committees-window__card--${displayedCard} committees-window__card--spotlight-active${focusedCard ? " committees-window__card--spotlight-visible" : ""}`}
            role="button"
            tabIndex={focusedCard ? 0 : -1}
            aria-label={`Dismiss ${displayedCard === "acm" ? "ACM" : "Unicode"} card`}
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
            onClick={dismissCard}
            onKeyDown={handleDismissKeyDown}
          >
            {displayedCard === "acm" ? <AcmCardBody /> : <UnicodeCardBody />}
            <CardCloseButton onClick={dismissCard} />
          </div>
        </div>,
        document.body,
      )}
    </Window>
  );
}

function AcmCardBody() {
  return (
    <>
      <div className="committees-window__card-header">
        <p className="committees-window__card-title">ACM</p>
        <span className="committees-window__card-tag label-mono">Infotech</span>
      </div>
      <p className="committees-window__card-role">Co-committee member, Infotech</p>
      <p className="committees-window__card-joined label-mono">Joined August 2026</p>
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
    </>
  );
}

function UnicodeCardBody() {
  return (
    <>
      <div className="committees-window__card-header">
        <p className="committees-window__card-title">Unicode</p>
        <span className="committees-window__card-tag label-mono">UI/UX</span>
      </div>
      <p className="committees-window__card-role">Mentee, UI/UX</p>
      <p className="committees-window__card-joined label-mono">Joined August 2026</p>
      <p className="committees-window__card-personal">
        {
          "I'm drawn to UI/UX because I've always enjoyed the creative side of technology. I like experimenting with layouts, visuals, and small details while thinking about how someone will actually interact with what I design."
        }
      </p>
    </>
  );
}

// Shared close chip for the spotlighted card — same crossed-line glyph
// as Window.tsx's own close control, scaled down, so "close this" reads
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
