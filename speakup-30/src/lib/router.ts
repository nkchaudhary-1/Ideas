import { useCallback, useEffect, useState } from "react";

// A tiny hash router: static hosting needs no server rules and the back button just works.
function parse(): string[] {
  return (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
}
export function useRoute() {
  const [path, setPath] = useState<string[]>(parse);
  useEffect(() => {
    const on = () => setPath(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return path;
}
export function go(to: string) {
  const next = "#" + (to.startsWith("/") ? to : "/" + to);
  if (location.hash === next) window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = next;
}
export function useGo() {
  return useCallback((to: string) => go(to), []);
}
export const href = (to: string) => "#" + (to.startsWith("/") ? to : "/" + to);
