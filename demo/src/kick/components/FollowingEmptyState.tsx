import { Link } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";

type FollowingEmptyStateProps = {
  icon: KickIconName;
  message: string;
  actionHref?: string;
  actionLabel?: string;
};

export function FollowingEmptyState({
  icon,
  message,
  actionHref = "/browse",
  actionLabel = "Browse channels",
}: FollowingEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
      <Icon name={icon} className="size-20" />
      <p className="max-w-sm text-base font-semibold text-surface-onSurfaceSecondary">{message}</p>
      <Link
        to={actionHref}
        className="inline-flex h-10 items-center justify-center rounded bg-primary-base px-3 text-base font-semibold text-primary-onPrimary transition-all select-none betterhover:active:scale-[0.98]"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
