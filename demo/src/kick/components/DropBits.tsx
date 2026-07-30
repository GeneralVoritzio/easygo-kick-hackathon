import type { ReactNode } from "react";
import { Icon, type KickIconName } from "../Icon";
import { PageTabs } from "./PageTabs";

const buttonBase =
  "group relative box-border shrink-0 grow-0 select-none whitespace-nowrap rounded font-semibold ring-0 transition-all focus-visible:outline-none active:scale-[0.95] flex h-9 w-full items-center justify-center gap-1.5 px-2.5 text-sm leading-none lg:w-fit";

const variants = {
  primary: "state-layer-base bg-primary-base text-primary-onPrimary",
  secondary: "state-layer-surface bg-secondary-base text-secondary-onSecondary",
};

export function DropButton({
  href,
  icon,
  label,
  variant,
}: {
  href: string;
  icon: KickIconName;
  label: string;
  variant: keyof typeof variants;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`${buttonBase} ${variants[variant]}`}
    >
      <Icon name={icon} className="!size-5 md:!size-4" />
      <span className="text-sm">{label}</span>
    </a>
  );
}

export function RewardTile({
  name,
  image,
  progress,
  labelClass = "",
  children,
}: {
  name: string;
  image: string;
  progress?: number;
  labelClass?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex w-[calc(50%-0.5rem)] min-w-[120px] flex-col gap-3 sm:w-[120px]">
      <div className="relative flex flex-col items-center overflow-hidden rounded bg-surface-highest">
        <img className="block aspect-square rounded-t object-cover" src={image} alt="" />
        <span className="line-clamp-3 h-[72px] w-full break-words border-t border-outline-decorative p-2 text-left text-sm font-semibold text-surface-onSurface">
          {name}
        </span>
        {progress !== undefined && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="absolute bottom-0 left-0 right-0 h-1 w-full translate-y-1/2 overflow-hidden rounded-lg bg-outline-region"
          >
            <div
              className="h-full w-full origin-left rounded-lg bg-primary-base"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        )}
      </div>
      <div className={`flex flex-col gap-1 ${labelClass}`}>{children}</div>
    </li>
  );
}

export function RewardGrid({ className = "", children }: { className?: string; children: ReactNode }) {
  return <ul className={`flex flex-wrap justify-start gap-4 ${className}`}>{children}</ul>;
}

export const Divider = ({ className = "w-full" }: { className?: string }) => (
  <div className={`h-px bg-outline-decorative ${className}`} />
);

const tabs = [
  { label: "Inventory", to: "/drops/inventory" },
  { label: "All campaigns", to: "/drops/all-campaigns" },
];

export function DropsPage({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1472px] flex-col gap-4 px-10 py-7">
      <h2 className="text-2xl font-bold text-white">Drops &amp; rewards</h2>
      <div className="flex flex-col gap-4 rounded-lg py-3">
        <PageTabs
          label="Drops and rewards"
          tabs={tabs}
          active={active}
          className="shrink-0 pt-2 lg:pt-0"
        />
        <div className="flex w-full flex-col">
          <div className="h-full flex-1 outline-none lg:w-full lg:gap-6 lg:pb-10">
            <div className="flex flex-col gap-5 lg:gap-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The two tabs disagree on the heading weight: inventory is font-semibold, all campaigns
// is font-bold. Measured on kick.com on 30 July 2026.
export function DropsSection({
  title,
  gap = "gap-3",
  weight = "font-semibold",
  children,
}: {
  title: string;
  gap?: string;
  weight?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex w-full shrink-0 grow-0 flex-col ${gap}`}>
      <h1 className={`text-base text-white lg:text-xl ${weight}`}>{title}</h1>
      {children}
    </div>
  );
}

export function CampaignHeader({
  thumbnail,
  title,
  subtitle,
  restrictions = [],
  dateRange,
  thumbClass,
  subtitleClass,
}: {
  thumbnail: string;
  title: string;
  subtitle: string;
  restrictions?: string[];
  dateRange?: string;
  thumbClass: string;
  subtitleClass: string;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-full sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <img className={thumbClass} src={thumbnail} alt="" />
        <div className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-2">
            <span className="text-base font-bold">{title}</span>
          </div>
          <div className={`text-start text-sm ${subtitleClass}`}>{subtitle}</div>
          {restrictions.length > 0 && (
            <div className="flex flex-row flex-wrap items-center gap-1">
              {restrictions.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center whitespace-nowrap rounded-full bg-secondary-base px-2 py-1 text-sm font-normal !leading-none text-secondary-onSecondary transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {dateRange && (
        <div className="flex items-center gap-1 text-sm leading-normal text-neutral-300">
          {dateRange}
        </div>
      )}
    </div>
  );
}
