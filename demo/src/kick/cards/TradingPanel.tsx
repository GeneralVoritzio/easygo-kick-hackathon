import { useEffect, useState } from "react";
import { categories, currentUser } from "../mock/api";
import {
  acceptRequest,
  campaign,
  cancelTrade,
  cardFor,
  claimDrop,
  clearFresh,
  completeTrade,
  formatCountdown,
  formatWatch,
  instancesOf,
  isSetComplete,
  MILESTONE_SECONDS,
  nextMilestoneIn,
  ownedCount,
  partnerFor,
  requestTrade,
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
  const requested = state.trade?.status === "requested";
  useEffect(() => {
    if (!requested) return;
    const id = setTimeout(() => setState(acceptRequest), PARTNER_ACCEPT_DELAY);
    return () => clearTimeout(id);
  }, [requested]);

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

function CardTile({ card, count, fresh }: { card: SetCard; count: number; fresh: boolean }) {
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

// A trade grid runs on slots like the game inventories it copies: one tile per copy,
// numbered empty slots to fill the rows.
function TradeGrid({
  instances,
  selected,
  onToggle,
}: {
  instances: string[];
  selected: number[];
  onToggle?: (index: number) => void;
}) {
  const slotCount = Math.max(8, Math.ceil(instances.length / 4) * 4);

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {Array.from({ length: slotCount }, (_, i) => {
        const cardId = instances[i];
        if (!cardId)
          return (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-sm bg-surface-base"
            >
              <span className="text-xl font-bold text-white/10">{i + 1}</span>
            </div>
          );
        const card = cardFor(cardId);
        const isSelected = selected.includes(i);
        return (
          <button
            key={i}
            type="button"
            title={card.name}
            disabled={!onToggle}
            onClick={() => onToggle?.(i)}
            className={`relative aspect-square overflow-hidden rounded-sm bg-[#101214] p-1 ${
              isSelected ? "ring-2 ring-primary-base" : "ring-1 ring-inset ring-outline-decorative"
            } ${onToggle ? "" : "cursor-default"}`}
          >
            <ItemPlate card={card} size="sm" />
          </button>
        );
      })}
    </div>
  );
}

function LiveTrade({ state, act, onToast }: CardSets & { onToast: (text: string) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const trade = state.trade;
  const partner = trade ? partnerFor(trade.partnerUserId) : undefined;
  if (!trade || trade.status !== "open" || !partner) return null;

  const mine = instancesOf(state.inventory);
  const theirs = instancesOf(partner.inventory);
  const theirSelected = trade.theirOffer.map((id) => theirs.indexOf(id));

  // Only a duplicate leaves your set, so the last copy of a card stays unpickable.
  function toggle(index: number) {
    setPicked((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      const cardId = mine[index];
      const pickedOfCard = prev.filter((i) => mine[i] === cardId).length;
      if (pickedOfCard + 1 >= (state.inventory[cardId] ?? 0)) return prev;
      return [...prev, index];
    });
  }

  function trade_() {
    const giveIds = picked.map((i) => mine[i]);
    const gotNames = trade!.theirOffer.map((id) => cardFor(id).name).join(", ");
    act((s) => completeTrade(s, giveIds));
    setPicked([]);
    onToast(`Trade complete. ${gotNames} added to your collectibles.`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="block text-base font-bold text-white">{currentUser.username}</span>
        <span className="block text-xs text-surface-onSurfaceSecondary">
          Click items you want to trade
        </span>
      </div>
      <TradeGrid instances={mine} selected={picked} onToggle={toggle} />
      <span className="text-xs text-surface-onSurfaceSecondary">
        Only duplicates leave your set, so the last copy of a card stays put.
      </span>

      <div>
        <span className="block text-base font-bold text-white">{partner.username}</span>
        <span className="block text-xs text-surface-onSurfacePositive">Trade accepted!</span>
      </div>
      <TradeGrid instances={theirs} selected={theirSelected} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPicked([]);
            act(cancelTrade);
          }}
          className="h-9 flex-1 rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={trade_}
          className="state-layer-base h-9 flex-1 rounded bg-primary-base text-sm font-semibold text-primary-onPrimary disabled:bg-disabled-base disabled:text-disabled-onSurface"
        >
          Trade
        </button>
      </div>
    </div>
  );
}

function TradeDemoRow({ state, act }: CardSets) {
  if (state.trade?.status === "open") return null;
  return (
    <div className="mt-auto flex items-center gap-2 border-t border-outline-decorative pt-2">
      <span className="text-xs uppercase text-surface-onSurfaceSecondary">Demo</span>
      {state.trade?.status === "requested" ? (
        <button
          type="button"
          onClick={() => act(acceptRequest)}
          className="rounded bg-secondary-base px-2 py-1 text-xs font-semibold text-secondary-onSecondary"
        >
          Partner accepts now
        </button>
      ) : (
        !state.trade && (
          <button
            type="button"
            onClick={() => act((s) => acceptRequest(requestTrade(s, 4127033)))}
            className="rounded bg-secondary-base px-2 py-1 text-xs font-semibold text-secondary-onSecondary"
          >
            Start trade with ClueScrollCarl
          </button>
        )
      )}
    </div>
  );
}

export function TradingPanel({
  state,
  act,
  onToast,
}: CardSets & { onToast: (text: string) => void }) {
  const trade = state.trade;
  const requestedPartner =
    trade?.status === "requested" ? partnerFor(trade.partnerUserId) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
      {trade?.status === "open" ? (
        <LiveTrade state={state} act={act} onToast={onToast} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <span className="text-sm font-bold text-white">No live trade</span>
          <span className="max-w-[260px] text-xs text-surface-onSurfaceSecondary">
            {requestedPartner
              ? `Waiting on ${requestedPartner.username} to accept your trade request.`
              : "Send a trade request from a chatter's card. You can trade after 30 minutes of shared watch time in this campaign."}
          </span>
        </div>
      )}
      <TradeDemoRow state={state} act={act} />
    </div>
  );
}

const gameArt = categories.find((c) => c.slug === campaign.category_slug)?.thumbnail ?? "";

function CampaignHeader({ state }: { state: CardSetsState }) {
  const nextIn = nextMilestoneIn(state);
  const percent = Math.round(((MILESTONE_SECONDS - nextIn) / MILESTONE_SECONDS) * 100);

  return (
    <div className="flex flex-col gap-1.5">
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

function InventoryDemoRow({ act }: Pick<CardSets, "act">) {
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
    </div>
  );
}

export function InventoryPanel({ state, act }: CardSets) {
  const complete = isSetComplete(state.inventory);

  // The New tag stays up long enough to see, then the tab dot clears with it.
  useEffect(() => {
    if (!state.freshCardId) return;
    const id = setTimeout(() => act(clearFresh), 2500);
    return () => clearTimeout(id);
  }, [state.freshCardId, act]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-white">Drops &amp; rewards</span>
        <CampaignHeader state={state} />
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

      <div className="flex flex-col gap-2 border-t border-outline-decorative pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Collectibles</span>
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
      </div>

      <InventoryDemoRow act={act} />
    </div>
  );
}
