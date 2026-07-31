import { Icon, type KickIconName } from "../Icon";

export function IconButton({
  icon,
  label,
  className,
}: {
  icon: KickIconName;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`state-layer-surface flex shrink-0 items-center justify-center rounded bg-transparent font-semibold text-white [&_svg]:size-[1em] ${className ?? ""}`}
    >
      <Icon name={icon} />
    </button>
  );
}

export function PanelHeader({
  title,
  icon,
  actions,
}: {
  title: string;
  icon: KickIconName;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between rounded-t border-b border-outline-decorative bg-surface-base py-2 pl-6 pr-4 text-sm font-bold">
      <div className="flex items-center gap-4 text-lg leading-none text-white">
        <Icon name={icon} className="size-4 shrink-0" />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
}

export function Panel({
  title,
  icon,
  actions,
  bodyClassName,
  bigPopout,
  children,
}: {
  title: string;
  icon: KickIconName;
  actions?: React.ReactNode;
  bodyClassName?: string;
  bigPopout?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <PanelHeader
        title={title}
        icon={icon}
        actions={
          <>
            {actions}
            <IconButton
              icon="dash-popout"
              label={`Open ${title} in a new window`}
              className={`size-8 leading-none ${bigPopout ? "text-base" : "text-sm"}`}
            />
          </>
        }
      />
      <div
        className={`flex min-h-0 flex-1 grow overflow-hidden rounded-b bg-surface-base ${bodyClassName ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Pane({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden p-0.5" style={style}>
      {children}
    </div>
  );
}
