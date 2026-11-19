import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { PlacedArtwork, World } from "../types";
import { collectionById } from "../data";
import { pickTier } from "../lib/layout";
import { useCamera, type Camera } from "../lib/useCamera";
import { Tile } from "./Tile";
import { Controls } from "./Controls";

export interface WallHandle {
  flyToItem: (index: number) => void;
  jumpToItem: (index: number) => void;
}

interface Props {
  world: World;
  viewerOpen: boolean;
  onOpen: (index: number, rect: DOMRect) => void;
}

interface View {
  visible: Set<number>;
  /** Quantised zoom – tiles only re-render when this crosses a bucket boundary. */
  kq: number;
  tiny: boolean;
}

export const Wall = forwardRef<WallHandle, Props>(function Wall({ world, viewerOpen, onOpen }, ref) {
  const pctRef = useRef<HTMLSpanElement>(null);
  const sig = useRef("");
  const [view, setView] = useState<View>({ visible: new Set(), kq: 0.5, tiny: false });

  const onCamera = useCallback(
    (c: Camera, s: { w: number; h: number }) => {
      if (pctRef.current) pctRef.current.textContent = `${Math.round(c.k * 100)}%`;
      const vx0 = -c.x / c.k;
      const vy0 = -c.y / c.k;
      const vx1 = vx0 + s.w / c.k;
      const vy1 = vy0 + s.h / c.k;
      const mx = (vx1 - vx0) * 0.6;
      const my = (vy1 - vy0) * 0.6;
      const vis: number[] = [];
      for (const row of world.rows) {
        if (row.top > vy1 + my || row.artY + row.height < vy0 - my) continue;
        for (const it of row.items) {
          if (it.x + it.w < vx0 - mx || it.x > vx1 + mx) continue;
          vis.push(it.index);
        }
      }
      const bucket = Math.round(Math.log2(c.k) * 3);
      const key = `${bucket}|${vis.length}|${vis[0] ?? -1}|${vis[vis.length - 1] ?? -1}|${vis.reduce((a, b) => a + b, 0)}`;
      if (key === sig.current) return;
      sig.current = key;
      setView({ visible: new Set(vis), kq: Math.pow(2, bucket / 3), tiny: c.k < 0.17 });
    },
    [world],
  );

  const api = useCamera(world, { onChange: onCamera, keysEnabled: !viewerOpen });

  useImperativeHandle(
    ref,
    () => ({
      flyToItem(index) {
        const it = world.items[index];
        if (it) api.flyTo(it.x + it.w / 2, it.y + it.h / 2, Math.max(api.get().k, 0.8));
      },
      jumpToItem(index) {
        const it = world.items[index];
        if (it) api.jumpTo(it.x + it.w / 2, it.y + it.h / 2);
      },
    }),
    [api, world],
  );

  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);

  const handleOpen = useCallback(
    (item: PlacedArtwork, el: HTMLElement) => {
      if (api.wasDrag()) return;
      onOpen(item.index, el.getBoundingClientRect());
    },
    [api, onOpen],
  );

  const handleFocus = useCallback(
    (item: PlacedArtwork, el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const s = api.size();
      if (r.right < 0 || r.left > s.w || r.bottom < 0 || r.top > s.h) api.jumpTo(item.x + item.w / 2, item.y + item.h / 2);
    },
    [api],
  );

  const tiles = useMemo(
    () =>
      world.items.map((item) => (
        <Tile
          key={item.art.id}
          item={item}
          tier={pickTier(item.art, view.kq * 1.15, dpr)}
          show={view.visible.has(item.index)}
          collectionTitle={collectionById.get(item.art.collection)?.title ?? ""}
          onOpen={handleOpen}
          onFocusTile={handleFocus}
        />
      )),
    [world, view, dpr, handleOpen, handleFocus],
  );

  return (
    <>
      <div ref={api.viewportRef} className={`viewport${view.tiny ? " is-tiny" : ""}`} aria-label="Collage wall">
        <div ref={api.worldRef} className="world" style={{ width: world.width, height: world.height }}>
          {world.rows.map((r) =>
            r.row.title ? (
              <h2 key={r.row.id} className="row-title" style={{ left: world.pad, top: r.headingY }}>
                {r.row.title}
              </h2>
            ) : null,
          )}
          {tiles}
        </div>
      </div>
      <Controls api={api} world={world} pctRef={pctRef} />
    </>
  );
});
