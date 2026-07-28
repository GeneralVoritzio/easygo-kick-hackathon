import type { ReactNode } from "react";

function gridDims(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  return { cols: 3, rows: 3 };
}

/*
  A roughly-square grid for however many tiles are pinned (1-9, see MAX_PINS): picks the
  closest-to-square cols x rows and lets a leftover cell (an odd count like 3 in a 2x2) sit
  empty, the same tradeoff video-call grids make. Ported from kick-web-redesign's MosaicGrid.tsx,
  with one change: rows are `minmax(180px, 1fr)` instead of a bare `1fr`, and the tile wrapper
  gets `min-h-0` — a bare `1fr` row can't shrink a tile below its content's own intrinsic height
  (a classic CSS Grid trap), which is what silently pushed tiles past the bottom of the page,
  clipped by the page's own overflow-hidden, with no way to scroll down to them. A real minimum
  plus a scrollable page (Multiview.tsx) fixes that instead of fighting it.
*/
export function MosaicGrid({ tiles }: { tiles: ReactNode[] }) {
  const { cols, rows } = gridDims(tiles.length);

  return (
    <div
      className="grid w-full gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, minmax(180px, 1fr))` }}
    >
      {tiles.map((tile, i) => (
        <div key={i} className="min-h-0 min-w-0">
          {tile}
        </div>
      ))}
    </div>
  );
}
