import { memo, useState } from "react";
import type { PlacedArtwork } from "../types";
import { tierSrc, type Tier } from "../lib/layout";

interface Props {
  item: PlacedArtwork;
  tier: Tier;
  show: boolean;
  collectionTitle: string;
  onOpen: (item: PlacedArtwork, el: HTMLElement) => void;
  onFocusTile: (item: PlacedArtwork, el: HTMLElement) => void;
}

function TileImpl({ item, tier, show, collectionTitle, onOpen, onFocusTile }: Props) {
  const { art } = item;
  const src = tierSrc(art, tier);
  const [ready, setReady] = useState(false);
  const name = art.label || art.name || art.id;
  const carousel = art.slideCount > 1 ? ` · ${art.slideIndex}/${art.slideCount}` : "";

  return (
    <div
      className={`tile${art.available ? "" : " tile--pending"}`}
      style={{ left: item.x, top: item.y, width: item.w, height: item.h, ["--w" as string]: item.w, ["--c" as string]: art.color }}
    >
      {art.showLabel && (
        <span className="tile__label">
          <span className="tile__name">{art.label}</span>
          <span className="tile__meta">
            {collectionTitle}
            {carousel}
          </span>
        </span>
      )}
      <button
        type="button"
        className="tile__btn"
        aria-label={`Open ${name}${carousel ? ` (slide ${art.slideIndex} of ${art.slideCount})` : ""}`}
        onClick={(e) => onOpen(item, e.currentTarget)}
        onFocus={(e) => onFocusTile(item, e.currentTarget)}
      >
        {show && art.available && (
          <img
            src={src}
            alt=""
            draggable={false}
            decoding="async"
            className={ready ? "is-in" : ""}
            onLoad={() => setReady(true)}
          />
        )}
      </button>
    </div>
  );
}

export const Tile = memo(TileImpl);
