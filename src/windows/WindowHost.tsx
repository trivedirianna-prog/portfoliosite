import type { ComponentType } from "react";
import { AboutWindow } from "../sections/About/AboutWindow";
import { useWindowManager } from "./WindowManager";
import type { SectionId } from "./types";

/*
  Renders every currently-OPEN window (minimized ones render nothing here
  — their "open" state lives with the object that spawned them instead,
  per §7.4's local-docking rule; see useSectionWindow/section-object__dock-tab).

  Only "about" has a real window component so far — this is the §7.3/
  §7.4 test case, wired to the simplest real object (the journal) before
  the harder per-section content/interactions land in later phases.
*/
const windowContentComponents: Partial<
  Record<SectionId, ComponentType<{ windowId: string }>>
> = {
  about: AboutWindow,
};

export function WindowHost() {
  const { windows } = useWindowManager();

  return (
    <>
      {windows
        .filter((w) => w.status === "open")
        .map((w) => {
          const Content = windowContentComponents[w.sectionId];
          if (!Content) return null;
          return <Content key={w.id} windowId={w.id} />;
        })}
    </>
  );
}
