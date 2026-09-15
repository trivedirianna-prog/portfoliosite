import type { ComponentType } from "react";
import { AboutWindow } from "../sections/About/AboutWindow";
import { AboutPhotoWindow } from "../sections/About/AboutPhotoWindow";
import { EducationWindow } from "../sections/Education/EducationWindow";
import { CommitteesWindow } from "../sections/Committees/CommitteesWindow";
import { PortfolioWindow } from "../sections/Projects/PortfolioWindow";
import { PandoraWindow } from "../sections/Projects/PandoraWindow";
import { TakeTwoWindow } from "../sections/Projects/TakeTwoWindow";
import { ContactWindow } from "../sections/Contact/ContactWindow";
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
  "committees:default": CommitteesWindow,
  "projects:portfolio": PortfolioWindow,
  "projects:pandora": PandoraWindow,
  "projects:taketwo": TakeTwoWindow,
  "contact:default": ContactWindow,
};

interface WindowHostProps {
  /** Excludes one specific window instance from what's rendered — used
   *  exclusively by the "Take Two" project's live desktop mirror (§8.3)
   *  to render every OTHER open window live while leaving out its own
   *  window (the only case that would otherwise recurse into itself
   *  infinitely). Every other window/object still renders normally;
   *  this never excludes anything broader than the one id given. */
  excludeWindowId?: string;
}

export function WindowHost({ excludeWindowId }: WindowHostProps = {}) {
  const { windows } = useWindowManager();

  return (
    <>
      {windows
        .filter((w) => w.status === "open" && w.id !== excludeWindowId)
        .map((w) => {
          const Content = windowContentComponents[`${w.sectionId}:${w.kind}`];
          if (!Content) return null;
          return <Content key={w.id} windowId={w.id} />;
        })}
    </>
  );
}
