import type { SectionObjectConfig } from "./types";

/*
  The five section objects (design spec §8). Deliberately no position data
  here — final scatter coordinates are an open question (§16.1) to be
  decided during actual visual design, not hardcoded at scaffold time.
*/
export const sectionRegistry: SectionObjectConfig[] = [
  { id: "about", label: "About", material: "paper" },
  { id: "education", label: "Education", material: "paper" },
  { id: "projects", label: "Projects", material: "glossy" },
  { id: "committees", label: "Committees", material: "paper" },
  { id: "contact", label: "Contact", material: "glossy" },
];
