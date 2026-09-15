/*
  Lightweight, non-React pub/sub for values that need to be visible
  inside Take Two's live desktop mirror (§8.3) at drag/scroll/keystroke
  frequency — far too high a rate for React state (a setState per drag
  frame or per keystroke would re-render two full component trees, the
  real desktop's and the mirror's, tanking frame rate). The real
  instance publishes imperatively; the mirror's corresponding instance
  subscribes and writes straight to its own DOM node (or GSAP-owned
  transform) in the callback, never going through React's render cycle.

  Channels are plain strings the caller composes (e.g. `drag:${windowId}`)
  — this module doesn't know or care what a "window" is. The last
  published value per channel is retained and delivered immediately to a
  new subscriber, so a mirror window that mounts (or an already-typed
  Contact field) after something has already changed still starts in
  sync rather than at some stale default.
*/

type Listener<T> = (value: T) => void;

const latest = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener<never>>>();

export function publish<T>(channel: string, value: T): void {
  latest.set(channel, value);
  const set = listeners.get(channel);
  if (!set) return;
  for (const fn of set) (fn as Listener<T>)(value);
}

export function subscribe<T>(channel: string, fn: Listener<T>): () => void {
  let set = listeners.get(channel);
  if (!set) {
    set = new Set();
    listeners.set(channel, set);
  }
  set.add(fn as Listener<never>);

  if (latest.has(channel)) {
    fn(latest.get(channel) as T);
  }

  return () => {
    set!.delete(fn as Listener<never>);
    if (set!.size === 0) listeners.delete(channel);
  };
}
