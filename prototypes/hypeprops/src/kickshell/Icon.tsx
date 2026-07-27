import { kickIcons, type KickIconName } from "./icons";

type IconProps = {
  name: KickIconName;
  className?: string;
  title?: string;
};

export function Icon({ name, className, title }: IconProps) {
  const icon = kickIcons[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
      dangerouslySetInnerHTML={{ __html: icon.path }}
    />
  );
}

export type { KickIconName };
