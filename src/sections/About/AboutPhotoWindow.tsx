import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { CLUSTER_EMPHASIS } from "../../windows/windowCluster";
import riannaPhoto from "./IMG_89554.jpeg";
import "./AboutPhotoWindow.css";

/*
  About's SECOND window (§8.1) — opens simultaneously with AboutWindow
  (the text/journal window), not staggered; see About.tsx's click
  handler (openClusterPair), which opens THIS one first so AboutWindow
  lands on top of it. This window's heavier visual weight comes entirely
  from its own `emphasis` shadow and the thick pearl mat/border below —
  not from being the topmost layer.

  Positioned as the EMPHASIS half of the editorial cluster
  (windowCluster.ts) — overlapping a real portion of AboutWindow's edge,
  at a modest footprint (smaller than a prior, too-large version of this
  window). Upright, not rotated — the cluster feeling comes from offset
  position and real overlap alone.

  Real photo (the only real photo on the entire site — never generate or
  substitute another image here): the actual file, cropped to a 4:5
  portrait frame via object-fit rather than a pre-cropped asset, inside
  the same pearl mat treatment, with a stronger dimensional shadow and a
  faint second paper edge behind the mat suggesting physical thickness.
*/
export function AboutPhotoWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();

  return (
    <Window
      windowId={windowId}
      title="Photo"
      material="paper"
      emphasis
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      style={CLUSTER_EMPHASIS.style}
      originRect={originRects.about ?? null}
    >
      <div className="about-photo-window">
        <div className="about-photo-window__mat">
          <img
            className="about-photo-window__image"
            src={riannaPhoto}
            alt="Rianna Trivedi"
          />
        </div>
        <p className="about-photo-window__caption label-mono">
          Rianna Trivedi — photo
        </p>
      </div>
    </Window>
  );
}
