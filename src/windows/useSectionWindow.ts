import type { SectionId } from "./types";
import { useWindowManager } from "./WindowManager";

/*
  Per-section view onto the WindowManager (§7.4) — this is what lets each
  section object own its own "is my window open/minimized" state and
  render its own local dock tab, instead of a shared taskbar component
  querying global state on their behalf.
*/
export function useSectionWindow(sectionId: SectionId) {
  const {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    focusWindow,
    focusedId,
  } = useWindowManager();

  const windowState = windows.find((w) => w.sectionId === sectionId) ?? null;

  return {
    windowState,
    isOpen: windowState?.status === "open",
    isMinimized: windowState?.status === "minimized",
    isFocused: windowState !== null && windowState.id === focusedId,
    open: () => openWindow(sectionId),
    close: () => windowState && closeWindow(windowState.id),
    minimize: () => windowState && minimizeWindow(windowState.id),
    restore: () => windowState && restoreWindow(windowState.id),
    focus: () => windowState && focusWindow(windowState.id),
  };
}
