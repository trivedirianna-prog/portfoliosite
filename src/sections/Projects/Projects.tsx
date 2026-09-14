import { useId } from "react";
import "./Projects.css";

/*
  CD-R jewel case (§8.3) — glossy material, warm plum-700 -> magenta-600.
  Shown AJAR, not flat-closed: the lid is swung open behind/left of the
  case body (hinged along its right edge, rotated back), and the disc
  slides out over the case's own front-right edge rather than sitting
  flush inside it — the "caught mid-gesture" quality the coherence rule
  asks for. Ring text runs around the disc via a real SVG textPath, not a
  drawn approximation.
*/
export function Projects() {
  const uid = useId();
  const caseGradId = `${uid}-case`;
  const lidGradId = `${uid}-lid`;
  const discGradId = `${uid}-disc`;
  const ringPathId = `${uid}-ring`;

  return (
    <div className="section-object section-object--projects">
      <svg
        className="section-object__art"
        viewBox="0 0 100 100"
        role="img"
        aria-label="Projects"
      >
        <defs>
          <linearGradient id={caseGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="projects-object__stop-case-a" />
            <stop offset="100%" className="projects-object__stop-case-b" />
          </linearGradient>
          <linearGradient id={lidGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="projects-object__stop-lid-a" />
            <stop offset="100%" className="projects-object__stop-lid-b" />
          </linearGradient>
          <linearGradient id={discGradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" className="projects-object__stop-disc-a" />
            <stop offset="100%" className="projects-object__stop-disc-b" />
          </linearGradient>
          {/* Not rendered directly — only exists so textPath below can
              trace the disc's own ring. */}
          <circle id={ringPathId} cx="0" cy="0" r="16" />
        </defs>

        {/* Lid, swung open above/behind the case — clearly separate from
            the disc cluster below so the three pieces (lid, case, disc)
            read distinctly instead of collapsing into one blob. */}
        <g transform="translate(6,4) rotate(-16)">
          <rect width="46" height="34" rx="6" fill={`url(#${lidGradId})`} />
        </g>

        {/* Disc, drawn FIRST/behind here so the case body (next) covers
            most of it — only its right crescent peeks out, reading as
            "sliding out from under the case" rather than two same-size
            round/rect shapes sitting side by side (which read as a face:
            two highlight ovals + a dark hub = eyes + nose). */}
        <g transform="translate(66,66) rotate(8)">
          <circle r="21" fill={`url(#${discGradId})`} />
          <text className="projects-object__ring-text">
            <textPath href={`#${ringPathId}`} startOffset="2%">
              RIANNA TRIVEDI · PROJECTS ·
            </textPath>
          </text>
          <circle r="5.5" className="projects-object__hub" />
          <ellipse className="projects-object__highlight" cx="10" cy="-15" rx="5.5" ry="3.2" />
        </g>

        {/* Case body — the front-facing plane, tilted rather than
            square-on, per the "never flat/symmetric" coherence rule.
            Wide enough to cover most of the disc above, leaving only its
            right edge sliding out past the case's own right edge. */}
        <g transform="translate(4,44) rotate(-4)">
          <rect width="62" height="42" rx="6" fill={`url(#${caseGradId})`} />
          <ellipse className="projects-object__glow2" cx="10" cy="7" rx="9" ry="5" />
        </g>
      </svg>
      <span className="section-object__caption label-mono">Projects</span>
    </div>
  );
}
