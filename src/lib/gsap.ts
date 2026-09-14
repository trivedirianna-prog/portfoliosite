import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

/*
  Central GSAP entry point. Register any plugins here so the rest of the
  app imports gsap from this one module instead of the raw package.

  Draggable powers §7.2's window dragging (session-only — a window's
  position is never persisted, so it settles back to its designed spot
  the next time it's freshly opened rather than surviving a reload).
*/
gsap.registerPlugin(Draggable);

export { gsap, Draggable };
