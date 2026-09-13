import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import "./Boot.css";

/*
  Placeholder for the boot sequence (§6: segmented wordmark ignition ->
  wallpaper resolve -> object settle-in). Real letter-by-letter ignition
  is a later phase; this scaffold proves out the actual sequencing shape —
  a black screen, then a fade-in beat standing in for the wordmark, then
  the black screen itself fades away so the wallpaper system underneath
  (see boot/Wallpaper.tsx) genuinely "resolves into view" per §6 step 3,
  rather than being cut to abruptly.
*/
export function Boot({ onComplete }: { onComplete?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current || !lineRef.current) return;
    const tl = gsap.timeline({ onComplete });
    tl.fromTo(
      lineRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power1.out" },
    ).to(
      rootRef.current,
      { opacity: 0, duration: 0.9, ease: "power1.inOut" },
      "+=0.3",
    );
    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={rootRef} className="boot">
      <div ref={lineRef} className="boot__line label-mono">
        booting…
      </div>
    </div>
  );
}
