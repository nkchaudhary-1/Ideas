import { useSyncExternalStore } from "react";

/** subscribe to a CSS media query (false while rendering on the server) */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** the phone/tablet-portrait layout: one full-screen canvas, a tool dock and bottom sheets */
export const COMPACT_QUERY = "(max-width: 899px)";
export const useCompact = () => useMediaQuery(COMPACT_QUERY);

/** is the main pointer a finger? (read once per call, safe on the server) */
export const isCoarse = () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
