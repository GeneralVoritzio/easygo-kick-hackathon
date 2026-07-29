import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageShell } from "../components/Layout";
import { SettingsCard } from "../components/SettingsCard";
import { SettingsSwitch } from "../components/SettingsSwitch";
import { Icon } from "../Icon";
import { currentUser, followedChannels, livestreams, type Livestream } from "../mock/api";
import { chatters, colorFor } from "../mock/chatIdentities";
import { EXTRA_SLOT_COST, useExpeditions } from "../expedition/ExpeditionContext";
import {
  createCustomExpedition,
  createQuickExpedition,
  type ChatVisibility,
  type EndBehaviorMode,
  type Expedition,
  type ExpeditionVisibility,
  type StopDurationMode,
  type StreamerSelectionMode,
} from "../expedition/data";

/*
  Create an expedition: Quick (one click, always public, nothing else to set — what kick mods
  already stand up) or Custom (the full knob list: visibility, stop duration, streamer selection,
  kicking). Generalizes kick-timeline-with-recap/js/expedition.js's Kick/Private/Custom picker
  into these two types, re-expressed against our own data.
*/

function PickerCard({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${
        active
          ? "border-primary-base bg-primary-base/10"
          : "border-outline-decorative bg-surface-base betterhover:hover:border-neutral-600"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-bold text-white">
        <Icon name="expedition" className={active ? "size-4 text-primary-base" : "size-4 text-subtle"} />
        {title}
      </span>
      <span className="text-xs text-subtle">{description}</span>
    </button>
  );
}

function Choice<T extends string>({
  value,
  current,
  onSelect,
  children,
}: {
  value: T;
  current: T;
  onSelect: (v: T) => void;
  children: ReactNode;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
        active ? "bg-primary-base text-primary-onPrimary" : "bg-secondary-base text-white betterhover:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

const inputClass =
  "h-9 w-full rounded border border-outline-region bg-surface-lowest px-3 text-sm text-white outline-none placeholder:text-subtle focus:border-primary-base";

// Only the reusable knobs, never the title, password or invite list — those belong to one
// specific expedition, not to "the way I usually like to set these up." Local storage, not a
// context, because it's a plain per-browser convenience with nothing else in this app depending
// on it. Keeps the last few configurations, not just the latest one, so there's an actual choice
// to make rather than a single "redo what I just did."
const PRESETS_KEY = "kick-expedition-custom-presets";
const MAX_PRESETS = 5;

type CustomExpeditionFormSettings = {
  visibility: ExpeditionVisibility;
  stopDurationMode: StopDurationMode;
  stopDurationSeconds: number;
  streamerSelectionMode: StreamerSelectionMode;
  selectedSlugs: string[];
  allowKicking: boolean;
  chatVisibility: ChatVisibility;
};

function loadPresets(): CustomExpeditionFormSettings[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomExpeditionFormSettings[]) : [];
  } catch {
    return [];
  }
}

function savePreset(settings: CustomExpeditionFormSettings) {
  const deduped = loadPresets().filter((p) => JSON.stringify(p) !== JSON.stringify(settings));
  localStorage.setItem(PRESETS_KEY, JSON.stringify([settings, ...deduped].slice(0, MAX_PRESETS)));
}

// A short, readable label for one saved preset — enough to tell two apart at a glance in the list.
function describePreset(s: CustomExpeditionFormSettings): string {
  const duration =
    s.stopDurationMode === "1min"
      ? "1 min stops"
      : s.stopDurationMode === "custom"
        ? `${s.stopDurationSeconds / 60} min stops`
        : "whole stream";
  const streamers = s.streamerSelectionMode === "chat" ? "chat picks" : `${s.selectedSlugs.length} streamers`;
  return `${s.visibility === "private" ? "Private" : "Public"} · ${duration} · ${streamers}`;
}

export function CreateExpedition() {
  const { expeditions, createExpedition, updateExpedition, maxConcurrentCreated, kicksBalance, purchaseExtraSlot } =
    useExpeditions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Continuing a saved draft: prefill the form from it, and re-saving updates it in place
  // instead of creating a second expedition alongside it.
  const draftId = searchParams.get("draft");
  // A Kick Break is never a draft — it's created directly from the Creator Dashboard — but the
  // type doesn't know that, so it's excluded here rather than widening every "quick" | "custom"
  // field below to make room for a kind this page never actually creates or edits.
  const editingDraft = draftId
    ? expeditions.find((e) => e.id === draftId && e.isDraft && e.kind !== "kick-break")
    : undefined;

  const myExpeditions = expeditions.filter((e) => e.createdByViewer && !e.isDraft);
  const canCreateAnother = editingDraft ? true : myExpeditions.length < maxConcurrentCreated;
  const [purchaseError, setPurchaseError] = useState(false);

  const [kind, setKind] = useState<"quick" | "custom" | null>(
    editingDraft?.kind === "custom" || editingDraft?.kind === "quick" ? editingDraft.kind : null,
  );

  const [quickName, setQuickName] = useState(editingDraft?.kind === "quick" ? editingDraft.name : "");

  const [title, setTitle] = useState(editingDraft?.kind === "custom" ? editingDraft.name : "");
  const [visibility, setVisibility] = useState<ExpeditionVisibility>(editingDraft?.visibility ?? "public");
  const [password, setPassword] = useState(editingDraft?.password ?? "");
  const [inviteQuery, setInviteQuery] = useState("");
  const [invited, setInvited] = useState<string[]>(editingDraft?.invitedUsernames ?? []);
  const [stopDurationMode, setStopDurationMode] = useState<StopDurationMode>(editingDraft?.stopDurationMode ?? "1min");
  const [stopDurationSeconds, setStopDurationSeconds] = useState(editingDraft?.stopDurationSeconds ?? 60);
  const [streamerSelectionMode, setStreamerSelectionMode] = useState<StreamerSelectionMode>(
    editingDraft?.streamerSelectionMode ?? "preselected",
  );
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() =>
    editingDraft ? editingDraft.stops.map((s) => s.channel.slug) : followedChannels.map((c) => c.slug),
  );
  const [streamerQuery, setStreamerQuery] = useState("");
  const [allowKicking, setAllowKicking] = useState(editingDraft?.allowKicking ?? true);
  const [chatVisibility, setChatVisibility] = useState<ChatVisibility>(
    editingDraft?.chatVisibility ?? "expedition-only",
  );
  const [endBehavior, setEndBehavior] = useState<EndBehaviorMode>(editingDraft?.endBehavior ?? "last-stream");
  const [endStreamerSlug, setEndStreamerSlug] = useState(editingDraft?.endStreamerSlug ?? "");
  const [endStreamerQuery, setEndStreamerQuery] = useState("");

  const [presets] = useState(() => loadPresets());
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // No fixed route to point at yet once the group decides in chat — "pour into a specific
  // streamer" only ever makes sense against a route picked up front.
  function selectStreamerSelectionMode(mode: StreamerSelectionMode) {
    setStreamerSelectionMode(mode);
    if (mode === "chat" && endBehavior === "specific-streamer") setEndBehavior("last-stream");
  }

  function selectEndBehavior(mode: EndBehaviorMode) {
    setEndBehavior(mode);
    if (mode === "specific-streamer" && !endStreamerSlug) setEndStreamerSlug(selectedSlugs[0] ?? "");
  }

  function reorderSelectedSlug(from: number, to: number) {
    setSelectedSlugs((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function applyPreset(saved: CustomExpeditionFormSettings) {
    setVisibility(saved.visibility);
    setStopDurationMode(saved.stopDurationMode);
    setStopDurationSeconds(saved.stopDurationSeconds);
    setStreamerSelectionMode(saved.streamerSelectionMode);
    setSelectedSlugs(saved.selectedSlugs);
    setAllowKicking(saved.allowKicking);
    setChatVisibility(saved.chatVisibility);
    setPresetsOpen(false);
  }

  // Continuing an existing draft updates it in place instead of creating a second expedition
  // alongside it — the draft's own id survives either way.
  function persist(exp: Expedition): Expedition {
    if (editingDraft) {
      const merged = { ...exp, id: editingDraft.id };
      updateExpedition(editingDraft.id, merged);
      return merged;
    }
    createExpedition(exp);
    return exp;
  }

  function startQuick() {
    const exp = persist(createQuickExpedition({ name: quickName }, livestreams));
    navigate(`/expedition/${exp.id}`);
  }

  function saveQuickDraft() {
    persist({ ...createQuickExpedition({ name: quickName }, livestreams), isDraft: true });
    navigate("/expeditions");
  }

  function buildCustom() {
    return createCustomExpedition(
      {
        name: title,
        visibility,
        password: password || undefined,
        invitedUsernames: invited,
        stopDurationMode,
        stopDurationSeconds: stopDurationMode === "custom" ? stopDurationSeconds : undefined,
        streamerSelectionMode,
        preselectedSlugs: selectedSlugs,
        allowKicking,
        chatVisibility,
        endBehavior,
        endStreamerSlug: endBehavior === "specific-streamer" ? endStreamerSlug : undefined,
      },
      livestreams,
    );
  }

  function saveCustomPreset() {
    savePreset({
      visibility,
      stopDurationMode,
      stopDurationSeconds,
      streamerSelectionMode,
      selectedSlugs,
      allowKicking,
      chatVisibility,
    });
  }

  function submitCustom(e: FormEvent) {
    e.preventDefault();
    const exp = persist(buildCustom());
    saveCustomPreset();
    navigate(`/expedition/${exp.id}`);
  }

  function saveCustomDraft() {
    persist({ ...buildCustom(), isDraft: true });
    saveCustomPreset();
    navigate("/expeditions");
  }

  const inviteMatches = inviteQuery.trim()
    ? chatters
        .map((c) => c.username)
        .filter((u) => u.toLowerCase().includes(inviteQuery.trim().toLowerCase()) && !invited.includes(u))
        .slice(0, 6)
    : [];

  const filteredStreamers = streamerQuery.trim()
    ? livestreams.filter((s) => s.channel.username.toLowerCase().includes(streamerQuery.trim().toLowerCase()))
    : livestreams;

  const endStreamerOptions = selectedSlugs
    .map((slug) => livestreams.find((s) => s.channel.slug === slug))
    .filter((s): s is Livestream => Boolean(s));
  const filteredEndStreamerOptions = endStreamerQuery.trim()
    ? endStreamerOptions.filter((s) => s.channel.username.toLowerCase().includes(endStreamerQuery.trim().toLowerCase()))
    : endStreamerOptions;

  function handlePurchase() {
    setPurchaseError(!purchaseExtraSlot());
  }

  if (!canCreateAnother) {
    return (
      <PageShell>
        <Link
          to="/expeditions"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold text-subtle transition-colors betterhover:hover:text-white"
        >
          <Icon name="chevron-left" className="size-3.5" />
          Back to Expeditions
        </Link>
        <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Create an expedition</h2>
        <SettingsCard
          title="You already have an expedition running"
          description="One expedition of your own at a time. Close it, or unlock another slot with Kicks."
        >
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1.5">
              {myExpeditions.map((exp) => (
                <li key={exp.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-white">{exp.name}</span>
                  <Link to={`/expedition/${exp.id}`} className="text-xs font-semibold text-primary-base">
                    Go to expedition
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3 border-t border-outline-decorative pt-3">
              <button
                type="button"
                onClick={handlePurchase}
                className="flex items-center gap-1.5 rounded-lg bg-primary-base px-3 py-2 text-xs font-bold text-primary-onPrimary"
              >
                <Icon name="get-kicks" className="size-4" />
                Unlock another slot — {EXTRA_SLOT_COST} Kicks
              </button>
              <span className="text-xs text-subtle">Balance: {kicksBalance} Kicks</span>
            </div>
            {purchaseError && (
              <p className="text-xs text-red-400">Not enough Kicks — close an expedition instead.</p>
            )}
          </div>
        </SettingsCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        to="/expeditions"
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-subtle transition-colors betterhover:hover:text-white"
      >
        <Icon name="chevron-left" className="size-3.5" />
        Back to Expeditions
      </Link>
      <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Create an expedition</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PickerCard
          active={kind === "quick"}
          onClick={() => setKind("quick")}
          title="Quick Expedition"
          description="Starts the moment you press start, open to everyone. Nothing to configure."
        />
        <PickerCard
          active={kind === "custom"}
          onClick={() => setKind("custom")}
          title="Custom Expedition"
          description="Set visibility, stop duration, the route, and whether kicking is allowed."
        />
      </div>

      {kind === "quick" && (
        <>
          <SettingsCard
            title="Quick Expedition"
            description="Always public, one minute per stop, streamers are randomised — nothing to configure."
          >
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-subtle">
                Name (optional)
                <input
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder={`${currentUser.username} Quick Expedition`}
                  className={inputClass}
                />
              </label>
            </div>
          </SettingsCard>
          <div className="h-20" />
          <div className="fixed bottom-6 right-6 z-30 flex gap-2">
            <button
              type="button"
              onClick={saveQuickDraft}
              className="rounded-lg border border-outline-decorative bg-surface-base px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors betterhover:hover:bg-surface-highest"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={startQuick}
              className="rounded-lg bg-primary-base px-4 py-2 text-sm font-bold text-primary-onPrimary shadow-lg"
            >
              Start now
            </button>
          </div>
        </>
      )}

      {kind === "custom" && (
        <form onSubmit={submitCustom} className="flex flex-col gap-4">
          {presets.length > 0 && (
            <div className="relative self-end">
              <button
                type="button"
                onClick={() => setPresetsOpen((open) => !open)}
                className="flex items-center gap-1.5 text-xs font-semibold text-subtle transition-colors betterhover:hover:text-white"
              >
                <Icon name="expedition" className="size-3.5" />
                Use previous settings
              </button>
              {presetsOpen && (
                <div className="absolute right-0 z-10 mt-1.5 w-72 rounded-lg border border-outline-decorative bg-surface-highest p-1 shadow-lg">
                  {presets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="w-full rounded px-2.5 py-2 text-left text-xs font-semibold text-white transition-colors betterhover:hover:bg-surface-base"
                    >
                      {describePreset(preset)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SettingsCard title="Details">
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-subtle">
                  Title (optional)
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${currentUser.username} Custom Expedition`}
                    className={inputClass}
                  />
                </label>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-subtle">Visibility</span>
                  <div className="flex gap-2">
                    <Choice value="public" current={visibility} onSelect={setVisibility}>
                      Public
                    </Choice>
                    <Choice value="private" current={visibility} onSelect={setVisibility}>
                      Private
                    </Choice>
                  </div>
                </div>

                {visibility === "private" && (
                  <div className="flex flex-col gap-3 rounded-lg border border-outline-decorative p-3">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-subtle">
                      Password
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a password"
                        className={inputClass}
                      />
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-subtle">Invite viewers</span>
                      <div className="relative">
                        <input
                          value={inviteQuery}
                          onChange={(e) => setInviteQuery(e.target.value)}
                          placeholder="Search viewers"
                          className={inputClass}
                        />
                        {inviteMatches.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full rounded-lg border border-outline-decorative bg-surface-highest p-1 shadow-lg">
                            {inviteMatches.map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => {
                                  setInvited((prev) => [...prev, u]);
                                  setInviteQuery("");
                                }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-white betterhover:hover:bg-surface-base"
                              >
                                {u}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {invited.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {invited.map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setInvited((prev) => prev.filter((i) => i !== u))}
                              className="flex items-center gap-1 rounded-full bg-secondary-base px-2 py-1 text-[11px] font-semibold text-white"
                            >
                              {u}
                              <Icon name="close" className="size-2.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SettingsCard>

            <SettingsCard title="Route">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-subtle">Streamers</span>
                  <div className="flex flex-wrap gap-2">
                    <Choice value="preselected" current={streamerSelectionMode} onSelect={selectStreamerSelectionMode}>
                      Pick now
                    </Choice>
                    <Choice value="chat" current={streamerSelectionMode} onSelect={selectStreamerSelectionMode}>
                      Decide in chat
                    </Choice>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-subtle">Stop duration</span>
                  <div className="flex flex-wrap gap-2">
                    <Choice value="1min" current={stopDurationMode} onSelect={setStopDurationMode}>
                      1 min each
                    </Choice>
                    <Choice value="custom" current={stopDurationMode} onSelect={setStopDurationMode}>
                      Custom
                    </Choice>
                    <Choice value="whole-stream" current={stopDurationMode} onSelect={setStopDurationMode}>
                      Whole stream
                    </Choice>
                    <Choice value="chat" current={stopDurationMode} onSelect={setStopDurationMode}>
                      Decide in chat
                    </Choice>
                  </div>
                </div>

                {stopDurationMode === "chat" && (
                  <p className="text-xs text-subtle">
                    No fixed timer — chat votes every so often on whether to move to the next stop now.
                  </p>
                )}

                {stopDurationMode === "custom" && (
                  <label className="flex flex-col gap-1 text-xs font-semibold text-subtle">
                    Minutes per stop
                    <input
                      type="number"
                      min={1}
                      value={stopDurationSeconds / 60}
                      onChange={(e) => setStopDurationSeconds(Math.max(1, Number(e.target.value)) * 60)}
                      className={`${inputClass} w-32`}
                    />
                  </label>
                )}

                {streamerSelectionMode === "preselected" ? (
                  <>
                    <input
                      value={streamerQuery}
                      onChange={(e) => setStreamerQuery(e.target.value)}
                      placeholder="Search streamers"
                      className={inputClass}
                    />
                    <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">
                      {filteredStreamers.map((s) => {
                        const checked = selectedSlugs.includes(s.channel.slug);
                        return (
                          <button
                            key={s.channel.slug}
                            type="button"
                            onClick={() =>
                              setSelectedSlugs((prev) =>
                                checked ? prev.filter((slug) => slug !== s.channel.slug) : [...prev, s.channel.slug],
                              )
                            }
                            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-semibold transition-colors ${
                              checked
                                ? "border-primary-base/50 bg-primary-base/10 text-white"
                                : "border-outline-decorative text-subtle betterhover:hover:border-neutral-600"
                            }`}
                          >
                            <span
                              className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-black text-black"
                              style={{ background: colorFor(s.channel.username) }}
                            >
                              {s.channel.username.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="truncate">{s.channel.username}</span>
                          </button>
                        );
                      })}
                      {filteredStreamers.length === 0 && (
                        <p className="col-span-2 py-2 text-center text-xs text-subtle">No match.</p>
                      )}
                    </div>

                    {selectedSlugs.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-subtle">Order — drag to reorder</span>
                        <div className="flex flex-col gap-1">
                          {selectedSlugs.map((slug, i) => {
                            const stream = livestreams.find((s) => s.channel.slug === slug);
                            if (!stream) return null;
                            return (
                              <div
                                key={slug}
                                draggable
                                onDragStart={() => setDragIndex(i)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                  if (dragIndex !== null) reorderSelectedSlug(dragIndex, i);
                                  setDragIndex(null);
                                }}
                                onDragEnd={() => setDragIndex(null)}
                                className={`flex cursor-grab items-center gap-2 rounded-lg border border-outline-decorative px-2 py-1.5 text-xs active:cursor-grabbing ${
                                  dragIndex === i ? "opacity-40" : ""
                                }`}
                              >
                                <span className="w-4 shrink-0 text-center font-bold text-subtle">{i + 1}</span>
                                <span
                                  className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-black text-black"
                                  style={{ background: colorFor(stream.channel.username) }}
                                >
                                  {stream.channel.username.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-semibold text-white">
                                  {stream.channel.username}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-subtle">
                    Starts on one random stream. Once under way, the group votes on where to go next every stop.
                  </p>
                )}
              </div>
            </SettingsCard>

            <SettingsCard title="Rules" bodyClass={null}>
              <div className="flex flex-col gap-2 p-4">
                <span className="text-xs text-subtle">Let the group vote to boot a fellow expeditor each stop</span>
                <SettingsSwitch checked={allowKicking} onCheckedChange={setAllowKicking} aria-label="Allow kicking" />
              </div>
              <div className="flex flex-col gap-2 border-t border-outline-decorative p-4">
                <span className="text-xs text-subtle">
                  Chat — what expeditors can see while hopping along. The main chat is always view only.
                </span>
                <div className="flex flex-wrap gap-2">
                  <Choice value="expedition-only" current={chatVisibility} onSelect={setChatVisibility}>
                    Expedition only
                  </Choice>
                  <Choice value="both" current={chatVisibility} onSelect={setChatVisibility}>
                    Expedition + main chat
                  </Choice>
                  <Choice value="main-only" current={chatVisibility} onSelect={setChatVisibility}>
                    Main chat only
                  </Choice>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-outline-decorative p-4">
                <span className="text-xs text-subtle">
                  When this expedition ends, it pours everyone into the last stream shown
                </span>
                {streamerSelectionMode === "preselected" && selectedSlugs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <SettingsSwitch
                      checked={endBehavior === "specific-streamer"}
                      onCheckedChange={(checked) => selectEndBehavior(checked ? "specific-streamer" : "last-stream")}
                      aria-label="End on a specific streamer instead"
                    />
                    <span className="text-xs text-subtle">End on a specific streamer instead</span>
                  </div>
                )}
                {endBehavior === "specific-streamer" && streamerSelectionMode === "preselected" && (
                  <div className="flex flex-col gap-1.5">
                    <input
                      value={endStreamerQuery}
                      onChange={(e) => setEndStreamerQuery(e.target.value)}
                      placeholder="Search streamers"
                      className={inputClass}
                    />
                    <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">
                      {filteredEndStreamerOptions.map((s) => {
                        const checked = endStreamerSlug === s.channel.slug;
                        return (
                          <button
                            key={s.channel.slug}
                            type="button"
                            onClick={() => setEndStreamerSlug(s.channel.slug)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-semibold transition-colors ${
                              checked
                                ? "border-primary-base/50 bg-primary-base/10 text-white"
                                : "border-outline-decorative text-subtle betterhover:hover:border-neutral-600"
                            }`}
                          >
                            <span
                              className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-black text-black"
                              style={{ background: colorFor(s.channel.username) }}
                            >
                              {s.channel.username.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="truncate">{s.channel.username}</span>
                          </button>
                        );
                      })}
                      {filteredEndStreamerOptions.length === 0 && (
                        <p className="col-span-2 py-2 text-center text-xs text-subtle">No match.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SettingsCard>
          </div>

          <div className="h-20" />
          <div className="fixed bottom-6 right-6 z-30 flex gap-2">
            <button
              type="button"
              onClick={saveCustomDraft}
              className="rounded-lg border border-outline-decorative bg-surface-base px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors betterhover:hover:bg-surface-highest"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary-base px-4 py-2 text-sm font-bold text-primary-onPrimary shadow-lg"
            >
              Create expedition
            </button>
          </div>
        </form>
      )}
    </PageShell>
  );
}
