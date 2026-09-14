import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SectionId, WindowState } from "./types";

/*
  Owns open/minimize/close/focus state for all windows (§7.4). The key
  design point: minimizing a window does NOT send it to a taskbar —
  there is no taskbar in this design. A minimized window's "this is
  open" state lives entirely in this same WindowState array, keyed by
  sectionId; the object that spawned the window (see useSectionWindow)
  reads its OWN section's window state directly and renders its own
  local dock tab when minimized, rather than a separate system-tray
  component owned by this manager rendering anything itself.

  Focus is tracked as a single focusedId plus array order — focusing a
  window moves it to the end of the array, so DOM order (and therefore
  default stacking, since all open windows share --z-windows) naturally
  puts the focused window on top without a separate z-index counter.
*/

interface WindowManagerContextValue {
  windows: WindowState[];
  openWindow: (sectionId: SectionId) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  focusedId: string | null;
  // Desktop is "idle" — no window open — per §5: the wallpaper is only
  // allowed to transition between time-of-day states while idle, so it
  // never competes for attention with something the user is reading.
  isIdle: boolean;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null,
);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const nextIdRef = useRef(0);

  function openWindow(sectionId: SectionId) {
    const existing = windows.find((w) => w.sectionId === sectionId);
    if (existing) {
      setWindows((prev) =>
        prev.map((w) => (w.id === existing.id ? { ...w, status: "open" } : w)),
      );
      setFocusedId(existing.id);
      return;
    }
    const id = `${sectionId}-${nextIdRef.current++}`;
    setWindows((prev) => [...prev, { id, sectionId, status: "open" }]);
    setFocusedId(id);
  }

  function closeWindow(id: string) {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setFocusedId((prev) => (prev === id ? null : prev));
  }

  function minimizeWindow(id: string) {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: "minimized" } : w)),
    );
    setFocusedId((prev) => (prev === id ? null : prev));
  }

  function restoreWindow(id: string) {
    setWindows((prev) => {
      const target = prev.find((w) => w.id === id);
      if (!target) return prev;
      // Restoring also brings it to front, same as focusWindow below.
      return [
        ...prev.filter((w) => w.id !== id),
        { ...target, status: "open" },
      ];
    });
    setFocusedId(id);
  }

  function focusWindow(id: string) {
    setFocusedId(id);
    setWindows((prev) => {
      const target = prev.find((w) => w.id === id);
      if (!target) return prev;
      return [...prev.filter((w) => w.id !== id), target];
    });
  }

  const isIdle = windows.every((w) => w.status !== "open");

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        minimizeWindow,
        restoreWindow,
        focusWindow,
        focusedId,
        isIdle,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) {
    throw new Error(
      "useWindowManager must be used within a WindowManagerProvider",
    );
  }
  return ctx;
}
