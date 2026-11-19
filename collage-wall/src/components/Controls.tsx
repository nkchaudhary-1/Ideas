import { useEffect, useState, type RefObject } from "react";
import type { World } from "../types";
import type { useCamera } from "../lib/useCamera";
import { site } from "../site";

interface Props {
  api: ReturnType<typeof useCamera>;
  world: World;
  pctRef: RefObject<HTMLSpanElement>;
}

export function Controls({ api, world, pctRef }: Props) {
  const [indexOpen, setIndexOpen] = useState(false);

  useEffect(() => {
    if (!indexOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIndexOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [indexOpen]);

  const total = world.items.length;

  return (
    <>
      <header className="brand" data-no-pan>
        <h1>{site.title}</h1>
        <p>
          {site.subtitle} <span aria-hidden="true">·</span> {total} posts
        </p>
      </header>

      <div className="controls" role="toolbar" aria-label="Zoom and view" data-no-pan>
        <button type="button" onClick={() => api.zoomBy(1 / 1.35)} aria-label="Zoom out">
          −
        </button>
        <span ref={pctRef} className="controls__pct" aria-live="off">
          100%
        </span>
        <button type="button" onClick={() => api.zoomBy(1.35)} aria-label="Zoom in">
          +
        </button>
        <i className="controls__sep" aria-hidden="true" />
        <button type="button" onClick={() => api.fitAll()} title="Fit the whole wall (F)">
          Fit
        </button>
        <button type="button" onClick={() => api.reset()} title="Reset the view (0)">
          Reset
        </button>
        <i className="controls__sep" aria-hidden="true" />
        <button type="button" aria-expanded={indexOpen} onClick={() => setIndexOpen((v) => !v)}>
          Index
        </button>
      </div>

      {indexOpen && (
        <nav className="index" aria-label="Collections" data-no-pan>
          <ol>
            {world.collectionAnchors.map(({ collection, y, firstLabel }) => (
              <li key={collection.id}>
                <button
                  type="button"
                  onClick={() => {
                    api.flyToCorner(world.pad, y, Math.max(api.get().k, 0.35));
                    setIndexOpen(false);
                  }}
                >
                  <span className="index__n">{String(collection.order).padStart(2, "0")}</span>
                  <span className="index__t">{collection.title}</span>
                  <span className="index__c">{firstLabel}</span>
                  <span className="index__k">{collection.count}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <p className="hint" aria-hidden="true">
        Drag to explore · pinch or ⌘/Ctrl + scroll to zoom · click a post
      </p>
    </>
  );
}
