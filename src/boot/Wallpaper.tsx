import "./Wallpaper.css";

export type TimeOfDay = "dusk" | "night" | "dawn";

/*
  Placeholder for the wallpaper system (§5): one environment across three
  time-of-day states, idle-only crossfade. No transition logic yet —
  renders a single static state.
*/
export function Wallpaper({ timeOfDay = "night" }: { timeOfDay?: TimeOfDay }) {
  return <div className={`wallpaper wallpaper--${timeOfDay}`} />;
}
