import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { categories } from "../mock/api";
import {
  acceptTrade,
  campaign,
  cardFor,
  claimDrop,
  clearFresh,
  clearTrade,
  duplicateIds,
  formatCountdown,
  formatWatch,
  isEligible,
  isSetComplete,
  MILESTONE_SECONDS,
  nextMilestoneIn,
  offerTrade,
  ownedCount,
  partnerFor,
  partners,
  setCards,
  startState,
  tickWatch,
  type CardSetsState,
  type SetCard,
} from "./sets";

// The demo compresses each hour of watch time into about 40 seconds.
const WATCH_SECONDS_PER_TICK = 12;
const PARTNER_ACCEPT_DELAY = 4000;

export type CardSets = {
  state: CardSetsState;
  act: (fn: (state: CardSetsState) => CardSetsState) => void;
};

export function useCardSets(): CardSets {
  const [state, setState] = useState(startState);

  useEffect(() => {
    const id = setInterval(() => setState((s) => tickWatch(s, WATCH_SECONDS_PER_TICK)), 1000);
    return () => clearInterval(id);
  }, []);

  // The partner's answer arrives on a script, like the streamer's raid decisions do.
  const offered = state.trade?.status === "offered";
  useEffect(() => {
    if (!offered) return;
    const id = setTimeout(() => setState(acceptTrade), PARTNER_ACCEPT_DELAY);
    return () => clearTimeout(id);
  }, [offered]);

  return { state, act: setState };
}

function Emblem({ accent, size }: { accent: string; size: "sm" | "md" }) {
  return (
    <span className={`relative block ${size === "md" ? "size-10" : "size-7"}`}>
      <span
        className="absolute inset-0 rotate-45 rounded-sm border-2 border-[#26292e]"
        style={{ backgroundColor: accent }}
      />
      <span className="absolute inset-[30%] rotate-45 rounded-[1px] bg-black/30" />
    </span>
  );
}

// The plate copies the beveled badge frame on a real drop reward tile, read off the
// live Drops and rewards page. The emblem stands in for item art we cannot copy.
function ItemPlate({ card, size, dim }: { card: SetCard; size: "sm" | "md"; dim?: boolean }) {
  return (
    <span
      className={`flex size-full items-center justify-center border border-black/60 ${
        dim ? "opacity-30 grayscale" : ""
      }`}
      style={{
        background: "linear-gradient(150deg, #e6e0d2 0%, #bab4a5 55%, #8e897b 100%)",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.4), inset 0 0 0 4px rgba(0,0,0,0.2)",
      }}
    >
      <Emblem accent={card.accent} size={size} />
    </span>
  );
}

function CardTile({
  card,
  count,
  fresh,
}: {
  card: SetCard;
  count: number;
  fresh: boolean;
}) {
  const owned = count > 0;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-sm ${
        fresh ? "ring-1 ring-primary-base" : "ring-1 ring-inset ring-outline-decorative"
      }`}
    >
      <div className="relative aspect-square bg-[#101214] p-1.5">
        <ItemPlate card={card} size="md" dim={!owned} />
        {fresh && (
          <span className="absolute right-2.5 top-2.5 rounded-sm bg-primary-base px-1 text-[10px] font-bold uppercase leading-4 text-primary-onPrimary">
            New
          </span>
        )}
        {!fresh && count > 1 && (
          <span className="absolute right-2.5 top-2.5 rounded-sm bg-black/70 px-1 text-[10px] font-bold leading-4 text-white">
            x{count}
          </span>
        )}
      </div>
      <div className="flex-1 border-t border-black/40 bg-surface-base px-2 py-1.5">
        <span
          className={`block text-[11px] font-bold leading-tight ${
            owned ? "text-white" : "text-surface-onSurfaceSecondary"
          }`}
        >
          {card.name}
        </span>
        <span className="block text-[9px] font-semibold uppercase text-surface-onSurfaceSecondary">
          {card.rarity}
        </span>
      </div>
    </div>
  );
}

function MiniCard({
  card,
  count,
  selected,
  onSelect,
}: {
  card: SetCard;
  count?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col overflow-hidden rounded-sm text-left ring-1 ${
        selected ? "ring-primary-base" : "ring-inset ring-outline-decorative"
      }`}
    >
      <div className="relative aspect-square bg-[#101214] p-1.5">
        <ItemPlate card={card} size="sm" />
        {count && count > 1 && (
          <span className="absolute right-2.5 top-2.5 rounded-sm bg-black/70 px-1 text-[10px] font-bold leading-4 text-white">
            x{count}
          </span>
        )}
      </div>
      <div className="flex-1 border-t border-black/40 bg-surface-base px-1.5 py-1">
        <span className="block text-[10px] font-bold leading-tight text-white">{card.name}</span>
      </div>
    </button>
  );
}

const gameArt = categories.find((c) => c.slug === campaign.category_slug)?.thumbnail ?? "";

function CampaignHeader({ state }: { state: CardSetsState }) {
  const nextIn = nextMilestoneIn(state);
  const percent = Math.round(((MILESTONE_SECONDS - nextIn) / MILESTONE_SECONDS) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase text-surface-onSurfaceSecondary">Drops campaign</span>
      <div className="flex items-center gap-2.5">
        <img src={gameArt} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-white">{campaign.name} Drop</span>
          <span className="block truncate text-xs text-surface-onSurfaceSecondary">
            {campaign.game}
          </span>
        </div>
      </div>
      <span className="text-xs text-surface-onSurfaceSecondary">
        A card drops for each hour you watch. Complete all six to claim the {campaign.reward}.
      </span>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-surface-onSurfaceSecondary">
          Watched {formatWatch(state.watchSeconds)}
        </span>
        <span className="font-semibold tabular-nums text-white">
          Next card {formatCountdown(nextIn)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-highest">
        <div
          className="h-full rounded-full bg-primary-base transition-[width] duration-1000 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-surface-onSurfaceSecondary">
        <span className="font-bold text-white">End date:</span> Aug 9, 2026, 11:59 PM
      </span>
    </div>
  );
}

function SetGrid({ state, act }: CardSets) {
  const complete = isSetComplete(state.inventory);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Your set</span>
        <span className="text-xs tabular-nums text-surface-onSurfaceSecondary">
          {ownedCount(state.inventory)} of {setCards.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {setCards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            count={state.inventory[card.id] ?? 0}
            fresh={state.freshCardId === card.id}
          />
        ))}
      </div>
      {complete && !state.claimed && (
        <button
          type="button"
          onClick={() => act(claimDrop)}
          className="state-layer-base h-9 w-full rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
        >
          Claim the {campaign.reward}
        </button>
      )}
      {state.claimed && (
        <div className="flex flex-col gap-1 rounded border border-outline-decorative p-3">
          <span className="text-sm font-bold text-surface-onSurfacePositive">Drop claimed</span>
          <span className="text-xs text-surface-onSurfaceSecondary">
            The {campaign.reward} goes to your linked Steam account. The item binds to that
            account. Nobody can sell it or trade it away.
          </span>
        </div>
      )}
    </div>
  );
}

function TradeBoard({
  state,
  act,
  partnerUserId,
}: CardSets & { partnerUserId: number }) {
  const [give, setGive] = useState<string>();
  const [get, setGet] = useState<string>();
  const partner = partnerFor(partnerUserId);
  if (!partner) return null;

  const trade = state.trade;

  if (trade && trade.partnerUserId === partnerUserId) {
    if (trade.status === "offered")
      return (
        <span className="text-sm text-surface-onSurfaceSecondary">
          Offer sent. Waiting on {partner.username} to accept {cardFor(trade.giveCardId).name}{" "}
          for {cardFor(trade.getCardId).name}.
        </span>
      );
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm text-surface-onSurfacePositive">
          {partner.username} accepted. {cardFor(trade.getCardId).name} is yours.
        </span>
        <button
          type="button"
          onClick={() => act(clearTrade)}
          className="h-8 w-full rounded bg-secondary-base text-xs font-semibold text-secondary-onSecondary"
        >
          Done
        </button>
      </div>
    );
  }

  const mine = duplicateIds(state.inventory);
  const theirs = duplicateIds(partner.inventory);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-surface-onSurfaceSecondary">
        {partner.username} put these cards up in chat.
      </span>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">
            You give
          </span>
          {mine.length === 0 && (
            <span className="text-xs text-surface-onSurfaceSecondary">
              No duplicates to give yet.
            </span>
          )}
          {mine.map((id) => (
            <MiniCard
              key={id}
              card={cardFor(id)}
              count={state.inventory[id]}
              selected={give === id}
              onSelect={() => setGive(id)}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">
            You get
          </span>
          {theirs.map((id) => (
            <MiniCard
              key={id}
              card={cardFor(id)}
              selected={get === id}
              onSelect={() => setGet(id)}
            />
          ))}
        </div>
      </div>
      <span className="text-xs text-surface-onSurfaceSecondary">
        A trade is one card for one card. Only duplicates leave a set.
      </span>
      <button
        type="button"
        disabled={!give || !get}
        onClick={() => give && get && act((s) => offerTrade(s, partnerUserId, give, get))}
        className="state-layer-base h-9 w-full rounded bg-primary-base text-sm font-semibold text-primary-onPrimary disabled:bg-disabled-base disabled:text-disabled-onSurface"
      >
        Offer trade
      </button>
    </div>
  );
}

function TradeSection({ state, act }: CardSets) {
  const [partnerUserId, setPartnerUserId] = useState<number>();

  return (
    <div className="flex flex-col gap-2 border-t border-outline-decorative pt-3">
      <span className="text-sm font-bold text-white">Trade with chat</span>
      <span className="text-xs text-surface-onSurfaceSecondary">
        Ask in chat who holds the card you need. You can trade with a viewer after 30 minutes
        of shared watch time in this campaign.
      </span>
      <div className="flex flex-col gap-1.5">
        {partners.map((partner) => {
          const eligible = isEligible(partner);
          const selected = partnerUserId === partner.userId;
          return (
            <button
              key={partner.userId}
              type="button"
              disabled={!eligible}
              onClick={() => setPartnerUserId(selected ? undefined : partner.userId)}
              className={`flex items-center gap-2 rounded border px-2 py-1.5 text-left ${
                selected ? "border-primary-base" : "border-outline-decorative"
              } disabled:opacity-50`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">
                  {partner.username}
                </span>
                <span className="block text-xs text-surface-onSurfaceSecondary">
                  Watched {formatWatch(partner.coWatchSeconds)} with you
                </span>
              </span>
              {eligible ? (
                <Icon
                  name="chevron-right"
                  className="size-4 shrink-0 text-surface-onSurfaceSecondary"
                />
              ) : (
                <span className="shrink-0 text-xs font-semibold uppercase text-surface-onSurfaceSecondary">
                  Locked
                </span>
              )}
            </button>
          );
        })}
      </div>
      {partnerUserId && <TradeBoard state={state} act={act} partnerUserId={partnerUserId} />}
    </div>
  );
}

function DemoRow({ state, act }: CardSets) {
  return (
    <div className="flex items-center gap-2 border-t border-outline-decorative pt-2">
      <span className="text-xs uppercase text-surface-onSurfaceSecondary">Demo</span>
      <button
        type="button"
        onClick={() => act((s) => tickWatch(s, nextMilestoneIn(s)))}
        className="rounded bg-secondary-base px-2 py-1 text-xs font-semibold text-secondary-onSecondary"
      >
        Next card now
      </button>
      {state.trade?.status === "offered" && (
        <button
          type="button"
          onClick={() => act(acceptTrade)}
          className="rounded bg-secondary-base px-2 py-1 text-xs font-semibold text-secondary-onSecondary"
        >
          Partner accepts now
        </button>
      )}
    </div>
  );
}

export function TradingPanel({ state, act }: CardSets) {
  // The New tag stays up long enough to see, then the tab dot clears with it.
  useEffect(() => {
    if (!state.freshCardId) return;
    const id = setTimeout(() => act(clearFresh), 2500);
    return () => clearTimeout(id);
  }, [state.freshCardId, act]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
      <CampaignHeader state={state} />
      <SetGrid state={state} act={act} />
      <TradeSection state={state} act={act} />
      <DemoRow state={state} act={act} />
    </div>
  );
}
