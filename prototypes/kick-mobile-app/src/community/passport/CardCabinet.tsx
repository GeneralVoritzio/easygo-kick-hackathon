import { motion } from 'framer-motion';
import type { CommunityCard } from '@shared/types';
import { CommunityCardTile, RARITY_ACCENT } from './CommunityCardTile';

const CARDS_PER_SHELF = 3;

function chunk<T>(items: T[], size: number): T[][] {
  const shelves: T[][] = [];
  for (let i = 0; i < items.length; i += size) shelves.push(items.slice(i, i + size));
  return shelves;
}

interface CardCabinetProps {
  cards: CommunityCard[];
}

/** The collection, displayed like an arcade prize cabinet rather than a
 *  plain grid — a neon-framed case with the cards racked on glowing shelves,
 *  each sitting on its own lit pedestal (legendary ones pulse). */
export function CardCabinet({ cards }: CardCabinetProps) {
  const shelves = chunk(cards, CARDS_PER_SHELF);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-kick/50 bg-gradient-to-b from-surface to-page p-6 shadow-[0_0_40px_rgba(83,252,24,0.15)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 32px)',
        }}
      />

      <div className="relative mb-8 flex items-center justify-center gap-3">
        <span className="h-2 w-2 rounded-full bg-kick animate-live-pulse" />
        <h3 className="font-mono text-xs font-extrabold uppercase tracking-[0.3em] text-kick [text-shadow:0_0_12px_rgba(83,252,24,0.6)]">
          Community Card Cabinet
        </h3>
        <span className="h-2 w-2 rounded-full bg-kick animate-live-pulse" />
      </div>

      <div className="relative space-y-10">
        {shelves.map((shelf, shelfIndex) => (
          <div key={shelfIndex} className="space-y-3">
            <div className="flex flex-wrap justify-center gap-6">
              {shelf.map((card) => {
                const accent = RARITY_ACCENT[card.rarity];
                return (
                  <div key={card.id} className="relative pb-3">
                    <CommunityCardTile card={card} />
                    {card.rarity === 'legendary' ? (
                      <motion.div
                        className="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-40 -translate-x-1/2 rounded-full blur-md"
                        style={{ background: accent }}
                        animate={{ opacity: [0.45, 0.9, 0.45], scaleX: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ) : (
                      <div
                        className="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-40 -translate-x-1/2 rounded-full opacity-40 blur-md"
                        style={{ background: accent }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mx-auto h-[2px] w-[92%] rounded-full bg-gradient-to-r from-transparent via-kick/50 to-transparent shadow-[0_0_8px_rgba(83,252,24,0.4)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
