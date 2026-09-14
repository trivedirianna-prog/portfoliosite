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

// The spawning object's own on-screen rect at the moment it was last
// clicked, captured so a newly-opened (or restored) Window can animate in
// from that real position/scale instead of simply appearing centered —
// and so it has somewhere to retract back to on close. Plain
// x/y/width/height (not a live DOMRect) since it only needs to be read
// once per open/close, well after the click that produced it.
export interface OriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
