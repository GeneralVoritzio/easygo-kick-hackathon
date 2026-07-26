import type { ReactNode } from 'react';

interface MosaicGridProps {
  tiles: ReactNode[];
}

function gridDims(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  return { cols: 3, rows: 3 };
}

/** A roughly-square grid for however many tiles are pinned (1-9, see
 *  `MAX_PINS`) — more room than a phone screen affords, so unlike
 *  `prototypes/kick-mobile-app`'s bespoke 1/2/3/4-tile layouts this just
 *  picks the closest-to-square `cols x rows` and lets a leftover cell (an
 *  odd count like 3 in a 2x2) sit empty, the same tradeoff video-call grids
 *  make. */
export function MosaicGrid({ tiles }: MosaicGridProps) {
  const { cols, rows } = gridDims(tiles.length);

  return (
    <div
      className="grid h-full gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {tiles.map((tile, i) => (
        <div key={i}>{tile}</div>
      ))}
    </div>
  );
}
