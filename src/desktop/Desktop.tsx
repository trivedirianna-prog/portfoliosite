import { sectionRegistry, sectionComponents } from "../sections";
import "./Desktop.css";

/*
  The desktop canvas: a fixed, non-scrolling surface (§2) that hosts the
  wordmark and the five section objects. Final scatter placement is an
  open question (§16.1) — this scaffold renders objects in document flow
  rather than guessing at coordinates.
*/
export function Desktop() {
  return (
    <div className="desktop">
      <div className="desktop__wordmark label-mono">RIANNA TRIVEDI</div>
      <div className="desktop__objects">
        {sectionRegistry.map((section) => {
          const SectionComponent = sectionComponents[section.id];
          return <SectionComponent key={section.id} />;
        })}
      </div>
    </div>
  );
}
