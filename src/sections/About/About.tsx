import { useId } from "react";
import "./About.css";

/*
  Journal (§8.1) — paper material, flat plum-700 cover. Shown OPEN, not
  closed: the cover is folded back at an angle (mostly hidden behind the
  page block, just a corner/edge showing), the pages themselves fan out
  in a soft curve, and a ribbon bookmark drapes off at a natural
  diagonal rather than hanging straight down.
*/
export function About() {
  const uid = useId();
  const pagesGradId = `${uid}-pages`;

  return (
    <div className="section-object section-object--about">
      <svg
        className="section-object__art"
        viewBox="0 0 100 100"
        role="img"
        aria-label="About"
      >
        <defs>
          {/* Same pearl -> pearl-dim vertical gradient .material-paper
              itself uses. */}
          <linearGradient id={pagesGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="about-object__stop-page-a" />
            <stop offset="100%" className="about-object__stop-page-b" />
          </linearGradient>
        </defs>

        {/* Cover, folded back behind the open pages — only its left
            edge/corner still visible. */}
        <g transform="translate(10,18) rotate(-14)">
          <rect width="44" height="62" rx="3" className="about-object__cover" />
        </g>

        {/* Open pages, fanned rather than a flat rectangle. */}
        <path
          className="about-object__pages"
          d="M30,26 C46,18 68,21 83,33 L79,84 C64,74 43,72 27,80 Z"
          fill={`url(#${pagesGradId})`}
        />
        <path
          className="about-object__gutter"
          d="M56,24 Q53,55 51,82"
          fill="none"
        />
        <line x1="44" y1="42" x2="64" y2="38" className="about-object__line" />
        <line x1="44" y1="52" x2="60" y2="48" className="about-object__line" />

        {/* Ribbon bookmark, draping off at a diagonal past the page
            edge, ending in a V-notch. */}
        <path
          className="about-object__ribbon"
          d="M60,34 L67,32 L86,88 L78,94 L74,84 L70,94 L62,88 Z"
        />
      </svg>
      <span className="section-object__caption label-mono">About</span>
    </div>
  );
}
