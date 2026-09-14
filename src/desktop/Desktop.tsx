import { sectionRegistry, sectionComponents } from "../sections";
import { Wordmark } from "./Wordmark";
import "./Desktop.css";

/*
  The desktop canvas: a fixed, non-scrolling surface (§2) that hosts the
  wordmark and the five section objects. Final scatter placement is an
  open question (§16.1) — the offsets below are only a temporary,
  non-overlapping scaffold arrangement (every .section-object has
  position:absolute with no top/left, so their static positions all
  collapse to the same point and stack on top of each other) so the
  objects are visually inspectable in the meantime; they are not
  art-directed and should not be read as the intended composition.
*/

const TEMP_OFFSETS: Record<string, { top: string; left: string }> = {
  about: { top: "68%", left: "58%" },
  education: { top: "14%", left: "76%" },
  projects: { top: "10%", left: "10%" },
  committees: { top: "8%", left: "42%" },
  contact: { top: "58%", left: "6%" },
};

export function Desktop() {
  return (
    <div className="desktop">
      <div className="desktop__wordmark">
        <Wordmark />
      </div>
      <div className="desktop__objects">
        {sectionRegistry.map((section) => {
          const SectionComponent = sectionComponents[section.id];
          return (
            <div
              key={section.id}
              className="desktop__object-slot"
              style={TEMP_OFFSETS[section.id]}
            >
              <SectionComponent />
            </div>
          );
        })}
      </div>
    </div>
  );
}
