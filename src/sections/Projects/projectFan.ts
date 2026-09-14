/*
  Shared fan-out layout for the CD-R's project windows (§8.3). Each
  project window emerges from the disc's own edge (its originRect, set
  from the CD-R icon just like every other section's originRect) and
  rides out to its own final resting spot on screen — this module only
  owns THOSE final spots, expressed as a function of (index, total)
  rather than three hardcoded positions, so adding or removing a project
  later still produces a sensible spread instead of needing new
  hand-placed constants.

  The spread runs from upper-left-ish (near the CD-R's own desktop
  position) down toward the lower-right, arcing across otherwise-open
  canvas space between the other four objects — not a strict straight
  line, so it still reads as "fanning out" rather than "sliding along a
  ruler."
*/

export interface FanPosition {
  left: string;
  top: string;
}

const START = { left: 26, top: 28 };
const END = { left: 64, top: 60 };
// A gentle outward bow on the arc (perpendicular to the start->end line)
// so three-plus windows don't just sit on a single straight segment.
const BOW = 6;

export function projectFanPosition(index: number, total: number): FanPosition {
  const t = total > 1 ? index / (total - 1) : 0.5;
  const left = START.left + t * (END.left - START.left);
  const top = START.top + t * (END.top - START.top);
  // Bow outward (down-left) at the midpoint, tapering to zero at both ends.
  const bow = Math.sin(t * Math.PI) * BOW;
  return {
    left: `${(left - bow).toFixed(2)}%`,
    top: `${(top + bow).toFixed(2)}%`,
  };
}

/* Stagger between each window's open, in ms — short enough to read as
   one continuous fan-out gesture, long enough that each window visibly
   rides out on its own beat rather than all popping at once. */
export const FAN_STAGGER_MS = 110;
