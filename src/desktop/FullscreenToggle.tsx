import { useEffect, useState } from "react";
import "./FullscreenToggle.css";

/*
  A small, understated control (§12/§13 — "should not announce itself
  loudly") for entering/exiting true browser fullscreen, so the desktop
  can be viewed without tab/bookmark/address-bar chrome. Corner-placed,
  same glossy "hardware chip" language as the window title-bar controls
  (Window.css's .window__control) rather than a bespoke button style —
  one more control belonging to the same shared system fingerprint.

  The Fullscreen API requires a real user gesture to grant fullscreen —
  this is a plain button click, nothing tries to work around that.
  State is tracked via the `fullscreenchange` event rather than assumed
  from the click alone, since the browser can exit fullscreen on its own
  (Esc) outside this component's control.
*/

function isFullscreenSupported() {
  return (
    typeof document !== "undefined" &&
    document.fullscreenEnabled &&
    typeof document.documentElement.requestFullscreen === "function"
  );
}

export function FullscreenToggle() {
  const [supported] = useState(isFullscreenSupported);
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    if (!supported) return;
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, [supported]);

  if (!supported) return null;

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <button
      type="button"
      className="fullscreen-toggle"
      onClick={toggle}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      aria-pressed={isFullscreen}
    >
      {isFullscreen ? (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 2.5V5.5H3" />
          <path d="M10 2.5V5.5H13" />
          <path d="M6 13.5V10.5H3" />
          <path d="M10 13.5V10.5H13" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 5.5V2.5H6" />
          <path d="M13 5.5V2.5H10" />
          <path d="M3 10.5V13.5H6" />
          <path d="M13 10.5V13.5H10" />
        </svg>
      )}
    </button>
  );
}
