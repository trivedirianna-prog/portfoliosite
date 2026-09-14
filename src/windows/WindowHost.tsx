import type { ComponentType } from "react";
import { AboutWindow } from "../sections/About/AboutWindow";
import { AboutPhotoWindow } from "../sections/About/AboutPhotoWindow";
import { useWindowManager } from "./WindowManager";

/*
  Renders every currently-OPEN window (minimized ones render nothing here
  — their "open" state lives with the object that spawned them instead,
  per §7.4's local-docking rule; see useSectionWindow/section-object__dock-tab).

  Keyed by "sectionId:kind" since a section can spawn more than one
  window at once (About opens a text window AND a separate photo window
  together, §8.1). Only About has real window components so far — this
  is the §7.3/§7.4 test case, wired to the simplest real object before
  the harder per-section content/interactions land in later phases.
*/
const windowContentComponents: Record<string, ComponentType<{ windowId: string }>> = {
  "about:content": AboutWindow,
  "about:photo": AboutPhotoWindow,
};

export function WindowHost() {
  const { windows } = useWindowManager();

  return (
    <>
      {windows
        .filter((w) => w.status === "open")
        .map((w) => {
          const Content = windowContentComponents[`${w.sectionId}:${w.kind}`];
          if (!Content) return null;
          return <Content key={w.id} windowId={w.id} />;
        })}
    </>
  );
}
