import type { ReactNode } from 'react';

interface MosaicGridProps {
  /** The pinned streams (1-4) shown in focus mode. */
  tiles: ReactNode[];
}

/** Focus-mode layout: 1 tile fills the screen, 2 stack top/bottom, 3 gets
 *  one large feed over two smaller ones, 4 splits evenly 2x2. */
export function MosaicGrid({ tiles }: MosaicGridProps) {
  if (tiles.length <= 1) {
    return <div className="h-full">{tiles[0]}</div>;
  }

  if (tiles.length === 2) {
    return (
      <div className="grid h-full grid-rows-2 gap-1.5">
        {tiles.map((tile, i) => (
          <div key={i}>{tile}</div>
        ))}
      </div>
    );
  }

  if (tiles.length === 3) {
    return (
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-1.5">
        <div className="col-span-2">{tiles[0]}</div>
        <div>{tiles[1]}</div>
        <div>{tiles[2]}</div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-1.5">
      {tiles.map((tile, i) => (
        <div key={i}>{tile}</div>
      ))}
    </div>
  );
}
