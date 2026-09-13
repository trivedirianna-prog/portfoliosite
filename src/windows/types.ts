export type SectionId =
  | "about"
  | "education"
  | "projects"
  | "committees"
  | "contact";

export type WindowStatus = "open" | "minimized" | "closed";

export interface WindowState {
  id: string;
  sectionId: SectionId;
  status: WindowStatus;
}
