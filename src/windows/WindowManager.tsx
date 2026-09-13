import { createContext, useContext, useState, type ReactNode } from "react";
import type { SectionId, WindowState } from "./types";

/*
  Scaffold only: owns open/minimize/close state for all windows so the
  future local-docking behavior (§7.4) can live with the object that
  spawned each window rather than a centralized taskbar. No open/close
  logic implemented yet.
*/

interface WindowManagerContextValue {
  windows: WindowState[];
  openWindow: (sectionId: SectionId) => void;
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

  return (
    <WindowManagerContext.Provider value={{ windows, openWindow }}>
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
