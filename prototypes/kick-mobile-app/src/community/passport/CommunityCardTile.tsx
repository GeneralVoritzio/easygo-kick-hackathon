import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CommunityCard, CommunityCardRevealKind } from '@shared/types';

const RARITY_STYLE: Record<CommunityCard['rarity'], { border: string; glow: string; label: string }> = {
  common: { border: 'border-line-strong', glow: '', label: 'text-ink-muted' },
  rare: { border: 'border-[#2FD8E8]/60', glow: 'shadow-[0_0_16px_rgba(47,216,232,0.25)]', label: 'text-[#2FD8E8]' },
  legendary: { border: 'border-kick/60', glow: 'shadow-glow', label: 'text-kick' },
};

/** Solid hex per rarity, for places that need a real color value rather
 *  than a Tailwind class — e.g. the cabinet's under-shelf pedestal glow. */
export const RARITY_ACCENT: Record<CommunityCard['rarity'], string> = {
  common: '#6B6B6B',
  rare: '#2FD8E8',
  legendary: '#53FC18',
};

const REVEAL_ICON: Record<CommunityCardRevealKind, string> = {
  video: '🎬',
  voice_note: '🎙️',
  message: '💌',
  clip: '📹',
  animation: '✨',
  image: '🖼️',
};

const PLAYBACK_DURATION_S = 4;

/** A mocked personalized-video player, used only as a fallback when a card
 *  has no real `revealMediaUrl` — "playing" is simulated (a moving sheen +
 *  a progress bar) since this prototype has no media pipeline of its own. */
function SimulatedVideoPlayer({ message, author }: { message: string; author: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPlaying((p) => !p);
        }}
        aria-label={playing ? 'Pause personalized video' : 'Play personalized video'}
        className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-kick/40 bg-gradient-to-br from-raised to-page"
      >
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(120deg, transparent, rgba(83,252,24,0.35), transparent)',
            backgroundSize: '200% 100%',
          }}
          animate={playing ? { backgroundPosition: ['0% 50%', '200% 50%'] } : { backgroundPosition: '0% 50%' }}
          transition={playing ? { duration: 1.6, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        />
        <span className="relative text-4xl">{playing ? '⏸️' : '▶️'}</span>
        {playing && (
          <div className="absolute inset-x-1 bottom-1 h-1.5 overflow-hidden rounded-full bg-black/50">
            <motion.div
              className="h-full bg-kick"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: PLAYBACK_DURATION_S, ease: 'linear' }}
              onAnimationComplete={() => setPlaying(false)}
            />
          </div>
        )}
      </button>
      <p className="text-sm leading-snug text-ink">{message}</p>
      <span className="mt-auto font-mono text-xs font-bold text-kick">{author}</span>
    </>
  );
}

interface VideoRevealPanelProps {
  mediaUrl?: string;
  message: string;
  author: string;
  /** Only mount the real embed once the card is actually facing forward —
   *  avoids loading/playing a hidden iframe under the 3D flip transform. */
  active: boolean;
}

function VideoRevealPanel({ mediaUrl, message, author, active }: VideoRevealPanelProps) {
  if (!mediaUrl) return <SimulatedVideoPlayer message={message} author={author} />;

  return (
    <>
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-kick/40 bg-black">
        {active && (
          <iframe
            className="h-full w-full"
            src={mediaUrl}
            title="Personalized video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>
      <p className="text-sm leading-snug text-ink">{message}</p>
      <span className="mt-auto font-mono text-xs font-bold text-kick">{author}</span>
    </>
  );
}

function ImageRevealPanel({ mediaUrl, message, author }: { mediaUrl?: string; message: string; author: string }) {
  return (
    <>
      {mediaUrl ? (
        <img src={mediaUrl} alt="" className="aspect-video w-full rounded-lg border border-kick/40 object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-kick/40 bg-gradient-to-br from-raised to-page text-4xl">
          🖼️
        </div>
      )}
      <p className="text-sm leading-snug text-ink">{message}</p>
      <span className="mt-auto font-mono text-xs font-bold text-kick">{author}</span>
    </>
  );
}

interface CommunityCardTileProps {
  card: CommunityCard;
}

/** A collectible earned from a community quest/event — face-down until
 *  tapped. Only the profile owner sees the flip; the back is the creator's
 *  private thank-you — a real embedded video for `revealKind: 'video'`
 *  cards with a `revealMediaUrl`, an image for `'image'` cards, otherwise
 *  an icon + message — turning the card into a memory rather than a
 *  badge. */
export function CommunityCardTile({ card }: CommunityCardTileProps) {
  const [flipped, setFlipped] = useState(false);
  const rarity = RARITY_STYLE[card.rarity];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      className="cursor-pointer [perspective:1200px]"
      aria-label={flipped ? `${card.title}, flipped — tap to hide` : `${card.title} — tap to flip`}
    >
      <motion.div
        className="relative h-80 w-56 [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border bg-surface p-4 [backface-visibility:hidden] ${rarity.border} ${rarity.glow}`}
        >
          <span className="text-6xl">{card.iconEmoji}</span>
          <span className="text-center font-mono text-base font-bold uppercase leading-tight text-ink">
            {card.title}
          </span>
          <span className={`font-mono text-sm uppercase tracking-wider ${rarity.label}`}>{card.rarity}</span>
          <span className="mt-auto font-mono text-xs uppercase tracking-widest text-ink-disabled">Tap to flip</span>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-xl border border-kick/40 bg-page p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {card.revealKind === 'video' ? (
            <VideoRevealPanel
              mediaUrl={card.revealMediaUrl}
              message={card.revealMessage}
              author={card.revealAuthor}
              active={flipped}
            />
          ) : card.revealKind === 'image' ? (
            <ImageRevealPanel mediaUrl={card.revealMediaUrl} message={card.revealMessage} author={card.revealAuthor} />
          ) : (
            <>
              <span className="text-4xl">{REVEAL_ICON[card.revealKind]}</span>
              <p className="text-sm leading-snug text-ink">{card.revealMessage}</p>
              <span className="mt-auto font-mono text-xs font-bold text-kick">{card.revealAuthor}</span>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
