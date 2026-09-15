import { createContext, useContext } from "react";

/*
  Set to true only inside the "Take Two" project's live desktop mirror
  (§8.3) — lets the shared Window component skip its own open/close
  entrance animation and Draggable setup for windows rendered a second
  time inside that miniature, non-interactive view. Without this, each
  mirrored window would independently replay its OWN emerge-from-icon
  tween using the shared originRect (real desktop coordinates), which
  reads as broken/glitchy at the mirror's tiny scale — the mirror is
  meant to always show the desktop's already-settled state, never a
  mid-transition frame.
*/
const MirrorContext = createContext(false);

export const MirrorProvider = MirrorContext.Provider;

export function useIsMirror() {
  return useContext(MirrorContext);
}
