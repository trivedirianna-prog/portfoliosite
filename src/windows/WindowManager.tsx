import { createContext, useContext, useState, type ReactNode } from "react";
import type { SectionId, WindowState } from "./types";

/*
  Scaffold only: owns open/minimize/close state for all windows so the
  future local-docking behavior (§7.4) can live with the object that
  spawned each window rather than a centralized taskbar. No close/minimize
  logic implemented yet.
*/

interface WindowManagerContextValue {
  windows: WindowState[];
  openWindow: (sectionId: SectionId) => void;
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

  function openWindow(sectionId: SectionId) {
    setWindows((prev) => [
      ...prev,
      { id: `${sectionId}-${prev.length}`, sectionId, status: "open" },
    ]);
  }

  const isIdle = windows.every((w) => w.status !== "open");

  return (
    <WindowManagerContext.Provider value={{ windows, openWindow, isIdle }}>
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
