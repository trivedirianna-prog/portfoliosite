import type { SectionId, WindowKind } from "./types";
import { useWindowManager } from "./WindowManager";

/*
  Per-(section, kind) view onto the WindowManager (§7.4) — this is what
  lets each section object own its own "is my window open/minimized"
  state and render its own local dock tab, instead of a shared taskbar
  component querying global state on their behalf. `kind` defaults to
  "default" for the common case of one window per section; About passes
  "content"/"photo" explicitly since it spawns two at once (§8.1).
*/
export function useSectionWindow(sectionId: SectionId, kind: WindowKind = "default") {
  const {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    focusWindow,
    focusedId,
  } = useWindowManager();

  const windowState =
    windows.find((w) => w.sectionId === sectionId && w.kind === kind) ?? null;

  return {
    windowState,
    isOpen: windowState?.status === "open",
    isMinimized: windowState?.status === "minimized",
    isFocused: windowState !== null && windowState.id === focusedId,
    open: () => openWindow(sectionId, kind),
    close: () => windowState && closeWindow(windowState.id),
    minimize: () => windowState && minimizeWindow(windowState.id),
    restore: () => windowState && restoreWindow(windowState.id),
    focus: () => windowState && focusWindow(windowState.id),
    // Convenience for click handlers that should open on first click and
    // restore on subsequent clicks while minimized, without stacking a
    // duplicate window if it's already open.
    openOrRestore: () => {
      if (windowState?.status === "minimized") {
        restoreWindow(windowState.id);
      } else if (!windowState) {
        openWindow(sectionId, kind);
      } else {
        focusWindow(windowState.id);
      }
    },
  };
}
