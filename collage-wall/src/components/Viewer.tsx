import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PlacedArtwork } from "../types";
import { collectionById, rows } from "../data";

interface Props {
  items: PlacedArtwork[];
  index: number;
  /** Where the artwork was clicked on the wall – used for the open transition. */
  originRect: DOMRect | null;
  onClose: () => void;
  onStep: (delta: number) => void;
}

const useWindowSize = () => {
  const [s, setS] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setS({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return s;
};

export function Viewer({ items, index, originRect, onClose, onStep }: Props) {
  const item = items[index];
  const art = item.art;
  const win = useWindowSize();
  const figRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [fullReady, setFullReady] = useState(false);
  const opened = useRef(false);

  const compact = win.w < 720;
  const padX = compact ? 16 : 96;
  const padTop = compact ? 56 : 64;
  const padBottom = compact ? 104 : 104;
  const maxW = Math.max(120, win.w - padX * 2);
  const maxH = Math.max(120, win.h - padTop - padBottom);
  const fitW = Math.min(maxW, maxH * art.aspectRatio);
  const fitH = fitW / art.aspectRatio;

  const rowIndex = useMemo(() => rows.findIndex((r) => r.id === art.rowId) + 1, [art.rowId]);
  const collection = collectionById.get(art.collection);

  useEffect(() => setFullReady(false), [art.id]);

  // open transition: grow from the clicked tile
  useLayoutEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const el = figRef.current;
    if (!el || !originRect || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = el.getBoundingClientRect();
    const dx = originRect.left + originRect.width / 2 - (to.left + to.width / 2);
    const dy = originRect.top + originRect.height / 2 - (to.top + to.height / 2);
    const sx = originRect.width / to.width;
    el.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${sx})` }, { transform: "translate(0,0) scale(1)" }],
      { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }, [originRect]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  // preload neighbours' full images
  useEffect(() => {
    [index - 1, index + 1].forEach((i) => {
      const n = items[i]?.art;
      if (n?.available) new Image().src = n.image;
    });
  }, [index, items]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") onStep(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") onStep(-1);
      else return;
      e.preventDefault();
    },
    [onClose, onStep],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  // horizontal swipe to step
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const label = art.label || art.name;

  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) onStep(dx < 0 ? 1 : -1);
        else if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && e.target === e.currentTarget) onClose();
      }}
    >
      <button ref={closeRef} type="button" className="viewer__close" onClick={onClose} aria-label="Close (Esc)">
        <span aria-hidden="true">×</span>
      </button>

      <button type="button" className="viewer__nav viewer__nav--prev" onClick={() => onStep(-1)} disabled={index === 0} aria-label="Previous (←)">
        ‹
      </button>
      <button type="button" className="viewer__nav viewer__nav--next" onClick={() => onStep(1)} disabled={index === items.length - 1} aria-label="Next (→)">
        ›
      </button>

      <figure ref={figRef} className="viewer__fig" style={{ width: fitW, height: fitH }}>
        {art.available ? (
          <>
            <img key={`t-${art.id}`} className="viewer__img viewer__img--thumb" src={art.thumbnail} alt="" draggable={false} />
            <img
              key={`f-${art.id}`}
              className={`viewer__img viewer__img--full${fullReady ? " is-in" : ""}`}
              src={art.image}
              alt={label}
              draggable={false}
              onLoad={() => setFullReady(true)}
            />
          </>
        ) : (
          <div className="viewer__pending" style={{ ["--c" as string]: art.color }}>
            <p>Not exported yet</p>
            <small>{art.name}</small>
          </div>
        )}
      </figure>

      <footer className="viewer__bar">
        <div className="viewer__title">
          <strong>{label}</strong>
          <span>
            {collection?.title} · row {rowIndex}
          </span>
        </div>
        {art.slideCount > 1 && (
          <div className="viewer__slides" aria-label={`Slide ${art.slideIndex} of ${art.slideCount}`}>
            {Array.from({ length: Math.min(art.slideCount, 12) }, (_, i) => (
              <i key={i} className={i + 1 === art.slideIndex ? "on" : ""} />
            ))}
            <span>
              {art.slideIndex} / {art.slideCount}
            </span>
          </div>
        )}
        <div className="viewer__count">
          {String(index + 1).padStart(3, "0")} <span>/ {items.length}</span>
        </div>
      </footer>
    </div>
  );
}
