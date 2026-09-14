import { useId } from "react";
import "./Contact.css";

/*
  Transmission/signal device (§8.5) — glossy material, cool plum-800 ->
  ice-500 (the design's icy-blue undertone getting its "real functional
  home," per tokens.css). An asymmetric rounded pod (hand-drawn bezier
  blob, not a rectangle-with-a-nub), tilted off-axis, with a small
  display detail and an antenna line angling out from its narrow end —
  "propped"/mid-signal rather than sitting flat and square.
*/
export function Contact() {
  const uid = useId();
  const podGradId = `${uid}-pod`;

  return (
    <div className="section-object section-object--contact">
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
          <circle cx="44" cy="27" r="2.6" className="contact-object__indicator" />

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
      <span className="section-object__caption label-mono">Contact</span>
    </div>
  );
}
