import { Link } from 'react-router';
import { Layers, Users, X } from 'lucide-react';
import type { StreamCard } from '../types';
import { usePinnedStreams } from '../context/PinnedStreamsContext';
import { PinButton } from './PinButton';

interface PartyMatesPanelProps {
  card: StreamCard;
  mates: StreamCard[];
  onNavigate?: () => void;
}

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${count}`;
}

/** The shared content for "this streamer is in a party": who else is in
 *  it, and one click to pin the whole party (this card plus every mate)
 *  to Multiview at once. Used both in `StreamCardTile`'s popover and on
 *  `WatchPage`, so the two never drift out of sync. */
export function PartyMatesPanel({ card, mates, onNavigate }: PartyMatesPanelProps) {
  const { isPinned, togglePin, canPinMore, pinMany, unpinMany } = usePinnedStreams();
  const partyIds = [card.id, ...mates.map((m) => m.id)];
  const allPinned = partyIds.every((id) => isPinned(id));

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
        <Users size={12} strokeWidth={2.5} />
        {card.partyName}
      </p>

      <div className="flex flex-col gap-1">
        {[card, ...mates].map((member) => (
          <div key={member.id} className="flex items-center gap-2 rounded-lg p-1">
            <Link
              to={`/watch/${member.id}`}
              onClick={onNavigate}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-black text-page"
                style={{ backgroundImage: member.gradient }}
              >
                {member.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-semibold text-ink-bright">{member.name}</span>
                <span className="tabular block truncate text-[10px] text-ink-muted">
                  {formatViewers(member.viewerCount)} viewers
                </span>
              </span>
            </Link>
            <PinButton
              pinned={isPinned(member.id)}
              disabled={!canPinMore}
              streamName={member.name}
              onToggle={() => togglePin(member.id)}
              size="sm"
            />
          </div>
        ))}
      </div>

      {allPinned ? (
        <button
          type="button"
          onClick={() => unpinMany(partyIds)}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-raised px-3 py-2 text-xs font-bold text-ink-bright transition-colors hover:bg-overlay"
        >
          <X size={14} strokeWidth={2.5} />
          Remove all from Multiview
        </button>
      ) : (
        <button
          type="button"
          onClick={() => pinMany(partyIds)}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-kick px-3 py-2 text-xs font-bold text-page transition-colors hover:bg-kick-hover"
        >
          <Layers size={14} strokeWidth={2.5} />
          Add all to Multiview
        </button>
      )}
    </div>
  );
}
