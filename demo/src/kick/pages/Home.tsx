import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { PageShell } from "../components/Layout";
import { StreamGrid } from "../components/StreamCard";
import { CategoryGrid } from "../components/CategoryCard";
import { livestreams, categories, currentUser, followedChannels } from "../mock/api";

const heroStreams = livestreams.slice(0, 6);

const heroChat = [
  { author: currentUser.username, color: "#F4A259", message: "chat is this real" },
  { author: followedChannels[0].username, color: "#77A6F7", message: "clip that death 10/10" },
  { author: followedChannels[1].username, color: "#E36BAE", message: "ironman mode is unhinged ngl" },
  { author: followedChannels[2].username, color: "#A3E635", message: "W stream, no cap" },
];

function SectionHeading({
  green,
  white,
  viewAllHref,
}: {
  green?: string;
  white: string;
  viewAllHref: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Link to={viewAllHref} className="max-w-full truncate text-base font-bold text-white lg:text-2xl">
        {green && <span className="text-surface-onSurfacePrimary">{green} </span>}
        {white}
      </Link>
      <Link
        to={viewAllHref}
        className="shrink-0 text-xs font-semibold text-surface-onSurfaceSecondary betterhover:hover:text-white lg:text-sm"
      >
        View all
      </Link>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-[22px] shrink-0 items-center rounded-full bg-surface-highest px-2 text-xs font-semibold leading-none text-surface-onSurfaceSecondary">
      {children}
    </span>
  );
}

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const stream = heroStreams[index];

  const goPrev = () => setIndex((i) => (i - 1 + heroStreams.length) % heroStreams.length);
  const goNext = () => setIndex((i) => (i + 1) % heroStreams.length);

  return (
    <div className="relative w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="invisible aspect-video w-full lg:w-[calc((2*100%-12px)/3)] 3xl:w-[calc((3*100%-12px)/4)]"
      />
      <div className="absolute inset-0 flex w-full gap-3">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-base">
          <img
            src={stream.thumbnail}
            alt={stream.session_title}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <span className="absolute left-4 top-4 rounded bg-negative-base px-2 py-1 text-xs font-bold uppercase leading-none text-white">
            Live
          </span>

          <div className="absolute right-4 top-4 flex gap-2">
            <button
              type="button"
              aria-label="Mute"
              className="flex size-9 items-center justify-center rounded bg-dark-64 text-white state-layer-surface"
            >
              <Icon name="volume" className="size-4 fill-current" />
            </button>
          </div>

          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 overflow-hidden rounded-lg bg-dark-64 p-4 backdrop-blur-sm">
            <div className="flex flex-row items-center gap-6">
              <Link to={`/${stream.channel.slug}`} className="shrink-0">
                <img
                  src={stream.channel.avatar}
                  alt={stream.channel.username}
                  className="size-9 shrink-0 rounded-full lg:size-14"
                />
              </Link>
              <div className="flex min-w-0 grow flex-col gap-1">
                <Link
                  to={`/${stream.channel.slug}`}
                  className="truncate text-base font-bold leading-[1.2] text-white lg:text-xl"
                >
                  {stream.session_title}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/${stream.channel.slug}`}
                    className="flex items-center gap-1 text-sm font-semibold leading-[1.2] text-white betterhover:hover:text-surface-onSurfaceSecondary"
                  >
                    {stream.channel.username}
                    {stream.channel.verified && (
                      <Icon name="verified" className="size-3.5 shrink-0 text-surface-onSurfacePrimary" />
                    )}
                  </Link>
                  <Pill>{stream.category.name}</Pill>
                  <Pill>{stream.language}</Pill>
                </div>
              </div>
              <Link
                to={`/${stream.channel.slug}`}
                className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded bg-primary-base px-4 text-sm font-semibold text-primary-onPrimary transition-all select-none betterhover:hover:bg-green-400 betterhover:active:scale-[0.98]"
              >
                Watch now
              </Link>
            </div>

            <div className="flex w-full min-w-0 items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                {heroStreams.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Show ${s.channel.username}`}
                    onClick={() => setIndex(i)}
                    className={
                      i === index
                        ? "h-2 w-12 shrink-0 rounded-full bg-white transition-all"
                        : "size-2 shrink-0 scale-[0.88] rounded-full bg-white/35 transition-all"
                    }
                  />
                ))}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Previous stream"
                  onClick={goPrev}
                  className="flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors betterhover:hover:bg-white/20"
                >
                  <Icon name="chevron-left" className="size-4 fill-current" />
                </button>
                <button
                  type="button"
                  aria-label="Next stream"
                  onClick={goNext}
                  className="flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors betterhover:hover:bg-white/20"
                >
                  <Icon name="chevron-right" className="size-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="relative hidden h-full w-[calc((100%-24px)/3)] shrink-0 flex-col rounded-lg border border-outline-decorative pb-4 lg:flex 3xl:w-[calc((100%-36px)/4)]">
          <div className="flex h-[50px] shrink-0 items-center justify-center border-b-2 border-surface-highest px-4">
            <span className="text-sm font-semibold text-white">Chat</span>
          </div>
          <div className="no-scrollbar flex flex-1 flex-col justify-end gap-1 overflow-y-auto px-3 py-2">
            {heroChat.map((m, i) => (
              <div key={i} className="rounded-lg px-2 py-1 text-sm leading-[1.55]">
                <span className="font-bold" style={{ color: m.color }}>
                  {m.author}
                </span>
                <span className="text-white">: {m.message}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Home() {
  const casinoStreams = livestreams.filter((s) => s.category.slug === "slots-casino");

  return (
    <PageShell>
      <HeroCarousel />

      <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
        <SectionHeading green="Streams" white="For You" viewAllHref="/browse" />
        <StreamGrid streams={livestreams} />
      </section>

      <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
        <SectionHeading green="Categories" white="For You" viewAllHref="/browse/categories" />
        <CategoryGrid categories={categories} />
      </section>

      <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
        <SectionHeading white="Slots & Casino" viewAllHref="/browse/slots-casino" />
        <StreamGrid streams={casinoStreams} />
      </section>
    </PageShell>
  );
}
