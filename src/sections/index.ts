import type { ComponentType } from "react";
import type { SectionId } from "../windows/types";
import { About } from "./About/About";
import { Education } from "./Education/Education";
import { Projects } from "./Projects/Projects";
import { Committees } from "./Committees/Committees";
import { Contact } from "./Contact/Contact";

export { sectionRegistry } from "./registry";
export type { SectionObjectConfig, MaterialFamily } from "./types";

export const sectionComponents: Record<SectionId, ComponentType> = {
  about: About,
  education: Education,
  projects: Projects,
  committees: Committees,
  contact: Contact,
};
