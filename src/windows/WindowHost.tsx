import type { ComponentType } from "react";
import { AboutWindow } from "../sections/About/AboutWindow";
import { AboutPhotoWindow } from "../sections/About/AboutPhotoWindow";
import { EducationWindow } from "../sections/Education/EducationWindow";
import { useWindowManager } from "./WindowManager";

/*
  Renders every currently-OPEN window (minimized ones render nothing here
  — their "open" state lives with the object that spawned them instead,
  per §7.4's local-docking rule; see useSectionWindow/section-object__dock-tab).

  Keyed by "sectionId:kind" since a section can spawn more than one
  window at once (About opens a text window AND a separate photo window
  together, §8.1); single-window sections (Education) just use the
  default "default" kind from useSectionWindow.
*/
const windowContentComponents: Record<string, ComponentType<{ windowId: string }>> = {
  "about:content": AboutWindow,
  "about:photo": AboutPhotoWindow,
  "education:default": EducationWindow,
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
