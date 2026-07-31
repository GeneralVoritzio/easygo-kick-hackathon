import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { PageShell } from "../components/Layout";
import { Footer } from "../components/Footer";
import { StreamGrid } from "../components/StreamCard";
import { CategoryGrid } from "../components/CategoryCard";
import { ClipGrid } from "../components/ClipCard";
import { Pill, Section } from "../components/CardBits";
import { livestreams, categories, formatViewers, streamPills } from "../mock/api";
import { clips } from "../mock/clips";
import { HeroChatFeed } from "../components/ChannelChat";
import { BackFromBreakToast } from "../components/BackFromBreakToast";
import { announceInChat } from "../announce";

const heroStreams = livestreams.slice(0, 6);

// KICK's hero glass, read verbatim from the live kick.com home hero on 28 July 2026.
// The inset bevels are what make it read as glass, not the blur.
const glass =
  "isolate overflow-hidden bg-[rgba(11,11,12,0.64)] backdrop-blur-[8px] " +
  "shadow-[inset_4px_4px_14px_-2px_rgba(255,255,255,0.12),inset_-4px_-4px_14px_-2px_rgba(0,0,0,0.40),0_12px_36px_-8px_rgba(0,0,0,0.55)] " +
  "ring-1 ring-inset ring-white/5 " +
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:content-[''] " +
  "before:bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_0%)]";

const chatScrim =
  "bg-[linear-gradient(180deg,#0B0B0C_0%,rgba(11,11,12,0.80)_25%,rgba(11,11,12,0.00)_100%)]";

const bottomGlow =
  "radial-gradient(75% 55% at 50% 100%, rgba(24,233,251,0.45) 0%, rgba(160,24,251,0.28) 45%, rgba(11,11,12,0) 75%)";
const topShade =
  "linear-gradient(to bottom, rgba(11,11,12,0.92) 0%, rgba(11,11,12,0.6) 55%, rgba(11,11,12,0.1) 100%)";
const streamGrade = `${bottomGlow}, ${topShade}`;

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [breakToast, setBreakToast] = useState<string | null>(null);
  const stream = heroStreams[index];

  const goPrev = () => setIndex((i) => (i - 1 + heroStreams.length) % heroStreams.length);
  const goNext = () => setIndex((i) => (i + 1) % heroStreams.length);

  // fake-kick POST /public/v1/livestreams/{broadcaster_user_id}/announcements
  function handleBackFromBreak() {
    const message = `${stream.channel.username} is back!`;
    announceInChat(message);
    setBreakToast(message);
  }

  return (
    <div className="relative w-full overflow-hidden">
      {breakToast && (
        <BackFromBreakToast
          message={breakToast}
          slug={stream.channel.slug}
          onDone={() => setBreakToast(null)}
        />
      )}
      <div className="z-popover fixed bottom-4 left-4 flex items-center gap-2 rounded-lg bg-surface-highest px-3 py-2 shadow-2xl">
        <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">Demo</span>
        <button
          type="button"
          onClick={handleBackFromBreak}
          className="state-layer-base flex items-center gap-1.5 rounded bg-primary-base px-2 py-1 text-xs font-semibold text-primary-onPrimary"
        >
          <Icon name="play" className="size-3" />
          Back from break
        </button>
      </div>
      <div
        aria-hidden="true"
        className="invisible aspect-video w-full lg:w-[calc((2*100%-12px)/3)] 3xl:w-[calc((3*100%-12px)/4)]"
      />
      <div className="absolute inset-0 flex w-full gap-3">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-base">
          <img
            src={stream.thumbnail}
            alt={stream.session_title}
            className="absolute inset-0 h-full w-full object-cover brightness-[0.55] contrast-125 saturate-150"
          />
          <div aria-hidden="true" className="absolute inset-0" style={{ background: streamGrade }} />

          <span
            className={`z-controls absolute left-4 top-4 inline-flex h-7 items-center justify-center gap-x-1 rounded px-1 text-base font-semibold text-surface-onSurface 3xl:text-lg ${glass}`}
          >
            <span className="size-2.5 shrink-0 rounded-full bg-primary-base" />
            {formatViewers(stream.viewer_count)}
          </span>

          <div className="z-controls absolute right-4 top-4 flex gap-2">
            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted((on) => !on)}
              className={`state-layer-surface flex size-9 items-center justify-center rounded text-surface-onSurface ${glass}`}
            >
              <Icon name={muted ? "hero-mute" : "volume"} className="size-4 fill-current" />
            </button>
            {!chatOpen && (
              <button
                type="button"
                aria-label="Show chat"
                onClick={() => setChatOpen(true)}
                className={`state-layer-surface hidden size-9 items-center justify-center rounded text-surface-onSurface lg:flex ${glass}`}
              >
                <Icon name="expand-chat" className="size-4 fill-current" />
              </button>
            )}
          </div>

          <div className={`z-controls absolute bottom-4 left-4 right-4 rounded-lg ${glass}`}>
            <div className="flex w-auto gap-3 p-4">
              <div className="relative h-fit shrink-0">
                <Link to={`/${stream.channel.slug}`} className="block size-9 shrink-0 lg:size-14">
                  <img
                    src={stream.channel.avatar}
                    alt={stream.channel.username}
                    className="size-9 rounded-full lg:size-14"
                  />
                </Link>
                <span className="absolute bottom-0 right-0 inline-flex">
                  <button
                    type="button"
                    aria-label="Follow"
                    className="flex size-5 items-center justify-center rounded-full bg-primary-base text-xs text-primary-onPrimary transition-all active:scale-[0.95] lg:size-6"
                  >
                    <Icon name="heart" className="size-[1em] fill-current" />
                  </button>
                </span>
              </div>

              <div className="flex min-w-0 grow flex-col gap-1">
                <div className="flex flex-row gap-6">
                  <div className="flex min-w-0 grow flex-col gap-1">
                    <div className="inline-block w-auto max-w-full truncate whitespace-nowrap">
                      <Link
                        to={`/${stream.channel.slug}`}
                        className="text-base font-bold text-white lg:text-xl lg:leading-7"
                      >
                        {stream.channel.username}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/${stream.channel.slug}`}
                        className="truncate text-sm font-bold leading-5 text-white"
                      >
                        {stream.session_title}
                      </Link>
                      <div className="flex shrink-0 items-center gap-1">
                        {streamPills(stream).map((pill) => (
                          <Pill key={pill}>{pill}</Pill>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/${stream.channel.slug}`}
                    className="inline-flex h-9 shrink-0 select-none items-center justify-center whitespace-nowrap rounded bg-primary-base px-3 py-1.5 text-sm font-semibold text-primary-onPrimary transition-all state-layer-base betterhover:active:scale-[0.98]"
                  >
                    Watch now
                  </Link>
                </div>

                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center overflow-x-auto">
                      {heroStreams.map((s, i) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-label={`Go to featured livestream ${i + 1}`}
                          aria-current={i === index || undefined}
                          onClick={() => setIndex(i)}
                          className="group flex shrink-0 items-center justify-center px-1 py-3 outline-none"
                        >
                          <span
                            className={`block origin-center rounded-full transition-[width,height,background-color,transform] duration-300 ease-out ${
                              i === index
                                ? "h-2 w-12 scale-100 bg-white"
                                : "size-2 scale-[0.88] bg-white/35 group-hover:bg-white/55"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="Go to previous featured livestream"
                      onClick={goPrev}
                      className="state-layer-surface flex size-9 items-center justify-center rounded text-surface-onSurface"
                    >
                      <Icon name="chevron-left" className="size-4 fill-current" />
                    </button>
                    <button
                      type="button"
                      aria-label="Go to next featured livestream"
                      onClick={goNext}
                      className="state-layer-surface flex size-9 items-center justify-center rounded text-surface-onSurface"
                    >
                      <Icon name="chevron-right" className="size-4 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {chatOpen && (
          <aside className="relative hidden h-full w-[calc((100%-24px)/3)] shrink-0 overflow-hidden rounded-lg border border-outline-decorative bg-surface-lowest lg:block 3xl:w-[calc((100%-36px)/4)]">
            <div className={`z-absolute absolute top-0 w-full rounded-t-lg p-4 ${chatScrim}`}>
              <button
                type="button"
                aria-label="Hide chat"
                onClick={() => setChatOpen(false)}
                className={`state-layer-surface relative flex h-12 w-full items-center justify-start gap-2 rounded-lg px-3 text-lg font-semibold text-surface-onSurface ${glass}`}
              >
                <Icon name="hide-chat" className="size-[1em] fill-current" />
                <span>Chat</span>
              </button>
            </div>
            <div className="flex h-full flex-col pb-4">
              <div className="relative mt-0.5 shrink grow overflow-hidden">
                <HeroChatFeed />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function CategoryRow({ slug }: { slug: string }) {
  const category = categories.find((c) => c.slug === slug)!;
  const streams = livestreams.filter((s) => s.category.slug === slug);

  return (
    <Section white={category.name} viewAll showMore>
      <StreamGrid streams={streams} oneRow />
    </Section>
  );
}

export function Home() {
  const popularClips = [...clips].sort((a, b) => b.view_count - a.view_count);

  return (
    <PageShell scroller="" column="gap-y-5 pt-3 lg:gap-y-7 lg:pt-0">
      <div className="flex w-full flex-col gap-3">
        <HeroCarousel />
      </div>

      <Section cyan="Streams" white="For You" showMore>
        <StreamGrid streams={livestreams} oneRow />
      </Section>

      <Section cyan="Categories" white="For You" viewAllHref="/browse/categories">
        <CategoryGrid categories={categories} oneRow />
      </Section>

      <CategoryRow slug="slots-casino" />
      <CategoryRow slug="just-chatting" />

      <Section white="Popular Clips This Week" viewAll showMore>
        <ClipGrid clips={popularClips} oneRow />
      </Section>

      <CategoryRow slug="irl" />
      <CategoryRow slug="old-school-runescape" />

      <Footer />
    </PageShell>
  );
}
