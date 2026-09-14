import type { CSSProperties } from "react";

/*
  Shared "arranged editorial cluster" positioning (§8.1) for sections
  that spawn more than one window at once. Deliberately asymmetric and
  overlapping — a real shared edge, a confident chunk of the screen —
  same art-directed-scatter principle already used for the desktop
  object placement, not a plain offset or a random scatter. Lives here
  (not inside any one section's window) so a future multi-window
  section can reuse the same feel rather than re-deriving its own
  offsets.

  Windows stay upright — a prior version also rotated each window a few
  degrees in opposite directions; reverted per direction, so the
  "editorial spread" feeling now comes from offset position and overlap
  alone, not tilt.

  Two roles: PRIMARY (the plainer/lighter window — ends up ON TOP of the
  stack) and EMPHASIS (the visually heavier one — pair with Window's own
  `emphasis` prop, but sits BEHIND primary; its weight comes entirely
  from its own shadow/framing, not from being the topmost layer).
*/
export const CLUSTER_PRIMARY: { style: CSSProperties } = {
  style: { left: "38%", top: "42%" },
};

export const CLUSTER_EMPHASIS: { style: CSSProperties } = {
  style: { left: "58%", top: "53%", width: "min(78vw, 370px)" },
};

/*
  Opens both halves of a cluster in the order that produces the intended
  stacking. WindowManager stacks purely by open order (the most recently
  opened/focused window lands on top), so EMPHASIS must be opened first
  here, before PRIMARY — this is the one place that ordering needs to be
  correct, rather than leaving each section to remember which of its two
  `openOrRestore` calls to make first. Normal focus behavior is
  untouched: clicking either window afterward still brings IT to front,
  same as any other window.
*/
export function openClusterPair(
  primary: { openOrRestore: () => void },
  emphasis: { openOrRestore: () => void },
) {
  emphasis.openOrRestore();
  primary.openOrRestore();
}
