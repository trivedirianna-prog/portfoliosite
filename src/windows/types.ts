export type SectionId =
  | "about"
  | "education"
  | "projects"
  | "committees"
  | "contact";

export type WindowStatus = "open" | "minimized" | "closed";

// Most sections spawn one window ("default"). About (§8.1) spawns two at
// once — a text/journal window and a separate photo window — so a
// window is identified by (sectionId, kind), not sectionId alone.
export type WindowKind = string;

export interface WindowState {
  id: string;
  sectionId: SectionId;
  kind: WindowKind;
  status: WindowStatus;
}
