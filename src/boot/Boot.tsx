import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import "./Boot.css";

/*
  Placeholder for the boot sequence (§6: segmented wordmark ignition ->
  wallpaper resolve -> object settle-in). Real letter-by-letter ignition
  is a later phase; this scaffold only proves GSAP is wired up correctly
  by fading in a placeholder line, then signaling completion.
*/
export function Boot({ onComplete }: { onComplete?: () => void }) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lineRef.current) return;
    const tween = gsap.fromTo(
      lineRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power1.out", onComplete },
    );
    return () => {
      tween.kill();
    };
  }, [onComplete]);

  return (
    <div className="boot">
      <div ref={lineRef} className="boot__line label-mono">
        booting…
      </div>
    </div>
  );
}
