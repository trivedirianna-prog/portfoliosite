import { useRef } from "react";
import { gsap } from "../lib/gsap";
import { Wordmark } from "../desktop/Wordmark";
import "./Boot.css";

/*
  Boot sequence per §6: a black screen, the wordmark drawing itself on
  and blooming into its resting glow (see desktop/Wordmark.tsx — this IS
  the loading mechanism, no separate bar/spinner/percentage), then the
  black screen fades away to reveal the wallpaper system underneath,
  which genuinely "resolves into view" per §6 step 3 rather than being
  cut to abruptly. The desktop's own (already-static) wordmark sits in
  the identical spot the whole time, so the handoff is invisible.
*/
export function Boot({ onComplete }: { onComplete?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  function handleWordmarkComplete() {
    if (!rootRef.current) {
      onComplete?.();
      return;
    }
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.9,
      delay: 0.3,
      ease: "power1.inOut",
      onComplete,
    });
  }

  return (
    <div ref={rootRef} className="boot">
      <div className="boot__wordmark">
        <Wordmark animate onComplete={handleWordmarkComplete} />
      </div>
    </div>
  );
}
