import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import { CLUSTER_PRIMARY } from "../../windows/windowCluster";
import "./AboutWindow.css";

/*
  About's window (§7.3/§7.4 test case). Per direction, this is the same
  plain rectangle every window uses — journal character (the spine-
  colored stripe, the small ribbon-tab accent) is surface decoration
  layered on top of that rectangle, not a replacement for its shape.

  Positioned as the PRIMARY half of the editorial cluster
  (windowCluster.ts) — opened (via openClusterPair) so it lands ON TOP
  of AboutPhotoWindow, not behind it: the photo window's heavier look
  comes entirely from its own emphasis shadow/framing, not from being
  the topmost layer. Upright, not rotated — the cluster feeling comes
  from offset position and real overlap alone.

  Uses the shared Window default width (460px) — a later pass mistakenly
  shrunk THIS window when the photo window was the one that needed to
  come down in size; reverted back to its original size/padding/type
  scale, which already fit the real copy cleanly with no overflow.
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
      style={CLUSTER_PRIMARY.style}
    >
      <div className="about-window">
        {/* Spine stripe — a hint of the journal cover's own plum-700,
            decorating the rectangle's left edge rather than shaping it. */}
        <div className="about-window__spine" aria-hidden="true" />
        {/* Small ribbon-tab accent tucked into the top edge. */}
        <div className="about-window__ribbon-tab" aria-hidden="true" />

        <div className="about-window__content">
          <h2 className="about-window__heading">Rianna Trivedi</h2>
          <p className="about-window__body-text">
            {"Hi, I'm Rianna — a second-year Computer Engineering student at D.J. Sanghvi College of Engineering."}
          </p>
          <p className="about-window__body-text">
            {
              "I'm interested in exploring the different sides of Computer Engineering, especially where technology, design, and creativity overlap. I enjoy working on projects where I can build something functional while also thinking about how it looks and feels. So far, I've worked with Java, C, HTML, CSS, JavaScript, and Figma, and I'm always interested in learning something new."
            }
          </p>
          <p className="about-window__body-text">
            {
              "While I'm not doing anything remotely academic, I'm usually listening to music, singing, reading, or going down an internet rabbit hole."
            }
          </p>
        </div>
      </div>
    </Window>
  );
}
