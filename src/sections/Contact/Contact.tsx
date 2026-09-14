import { useId, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useSectionWindow } from "../../windows/useSectionWindow";
import { useWindowManager } from "../../windows/WindowManager";
import "./Contact.css";

/*
  Transmission/signal device (§8.5) — glossy material, cool plum-800 ->
  ice-500 (the design's icy-blue undertone getting its "real functional
  home," per tokens.css). An asymmetric rounded pod (hand-drawn bezier
  blob, not a rectangle-with-a-nub), tilted off-axis, with a small
  display detail and an antenna line angling out from its narrow end —
  "propped"/mid-signal rather than sitting flat and square.

  §8.5's press-to-send payoff: pressing the device sends a signal BEFORE
  the window appears — the indicator flashes and a couple of ping rings
  expand outward from the antenna tip (attribute-animated radius, not a
  CSS transform/scale, which sidesteps SVG transform-origin fuss for a
  circle that isn't centered at the SVG's own origin), then the window
  opens via the same emerge-from-icon mechanism every other section
  already uses. Quick, mechanical timing (power1/power2 easing, no
  bounce) per §12 — a signal ping, not a firework.
*/
export function Contact() {
  const uid = useId();
  const podGradId = `${uid}-pod`;

  const iconRef = useRef<HTMLButtonElement>(null);
  const indicatorRef = useRef<SVGCircleElement>(null);
  const ping1Ref = useRef<SVGCircleElement>(null);
  const ping2Ref = useRef<SVGCircleElement>(null);

  const { setOriginRect } = useWindowManager();
  const contact = useSectionWindow("contact");

  function handleOpen() {
    if (iconRef.current) {
      setOriginRect("contact", iconRef.current.getBoundingClientRect());
    }

    const tl = gsap.timeline();
    if (indicatorRef.current) {
      tl.to(
        indicatorRef.current,
        { scale: 1.6, duration: 0.14, ease: "power2.out", yoyo: true, repeat: 1 },
        0,
      );
    }
    [ping1Ref, ping2Ref].forEach((ref, i) => {
      if (!ref.current) return;
      tl.fromTo(
        ref.current,
        { attr: { r: 3 }, opacity: 0.85 },
        { attr: { r: 20 }, opacity: 0, duration: 0.5, ease: "power1.out" },
        i * 0.1,
      );
    });
    tl.call(() => contact.openOrRestore(), undefined, 0.2);
  }

  return (
    <div
      className={`section-object section-object--contact${contact.isOpen ? " section-object--windows-open" : ""}`}
    >
      <button
        ref={iconRef}
        type="button"
        className="section-object__hit-area"
        onClick={handleOpen}
        aria-label="Open Contact"
      >
        <svg
          className="section-object__art"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Contact"
        >
          <defs>
            <linearGradient id={podGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" className="contact-object__stop-a" />
              <stop offset="100%" className="contact-object__stop-b" />
            </linearGradient>
          </defs>

          <g transform="translate(18,22) rotate(14)">
            {/* Ping rings, expanding from the antenna tip on send —
                sit behind the antenna/pod in paint order so they read
                as emanating from the device, not floating above it. */}
            <circle ref={ping1Ref} cx="66" cy="-20" r="3" className="contact-object__ping" opacity="0" />
            <circle ref={ping2Ref} cx="66" cy="-20" r="3" className="contact-object__ping" opacity="0" />

            {/* Antenna, angling out from the pod's narrow end — drawn
                first so the pod body overlaps its base. */}
            <line x1="40" y1="4" x2="66" y2="-20" className="contact-object__antenna" />
            <circle cx="66" cy="-20" r="3" className="contact-object__antenna-tip" />

            {/* Asymmetric pod body — hand-drawn, not a symmetric pill. */}
            <path
              d="M10,32 C8,15 25,3 42,6 C58,9 62,24 58,38
                 C55,50 40,60 24,58 C10,56 6,45 10,32 Z"
              fill={`url(#${podGradId})`}
            />

            {/* Small display/indicator detail. */}
            <rect
              x="16"
              y="33"
              width="20"
              height="11"
              rx="3"
              className="contact-object__display"
            />
            <circle ref={indicatorRef} cx="44" cy="27" r="2.6" className="contact-object__indicator" />

            <ellipse
              className="contact-object__highlight"
              cx="22"
              cy="16"
              rx="8"
              ry="4.5"
              transform="rotate(-20 22 16)"
            />
            <ellipse className="contact-object__glow2" cx="46" cy="46" rx="7" ry="5" />
          </g>
        </svg>
      </button>

      {contact.isMinimized && (
        <button
          type="button"
          className="section-object__dock-tab label-mono"
          onClick={() => {
            if (iconRef.current) {
              setOriginRect("contact", iconRef.current.getBoundingClientRect());
            }
            contact.restore();
          }}
        >
          Contact
        </button>
      )}

      <span className="section-object__caption label-mono">Contact</span>
    </div>
  );
}
