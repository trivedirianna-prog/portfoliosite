import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWindowManager } from "../windows/WindowManager";

export type TimeOfDay = "dusk" | "night" | "dawn";

const CYCLE: TimeOfDay[] = ["dusk", "night", "dawn"];

// Placeholder pacing — how long a state holds before the system attempts
// to advance (and only then if idle). Real timing is a later tuning pass.
const HOLD_MS = 20000;

const TimeOfDayContext = createContext<TimeOfDay>("dusk");

/*
  Single shared source of truth for the wallpaper's time-of-day state
  (§5) — this used to live entirely inside Wallpaper.tsx (its own local
  cycleIndexRef + setInterval). Pulled up here so a SECOND live
  rendering of the wallpaper — the "Take Two" project's live desktop
  mirror (§8.3) — can read and react to the exact same state instead of
  running an independent interval of its own, which would drift out of
  sync with the real one over time (two timers started at slightly
  different moments, each independently deciding when to advance).
  Wallpaper.tsx now just reads this value and animates to it; this
  provider owns the only interval and the only idle-gated advance logic.
*/
export function TimeOfDayProvider({ children }: { children: ReactNode }) {
  const { isIdle } = useWindowManager();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("dusk");
  const isIdleRef = useRef(isIdle);
  isIdleRef.current = isIdle;
  const cycleIndexRef = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isIdleRef.current) return; // skip this tick; never interrupts active use
      cycleIndexRef.current = (cycleIndexRef.current + 1) % CYCLE.length;
      setTimeOfDay(CYCLE[cycleIndexRef.current]);
    }, HOLD_MS);
    return () => window.clearInterval(interval);
    // Deliberately runs once: isIdle is read via isIdleRef instead of
    // restarting the interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TimeOfDayContext.Provider value={timeOfDay}>
      {children}
    </TimeOfDayContext.Provider>
  );
}

export function useTimeOfDay() {
  return useContext(TimeOfDayContext);
}
