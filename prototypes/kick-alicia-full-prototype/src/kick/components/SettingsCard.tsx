import type { ReactNode } from "react";

export function SettingsCard({
  title,
  description,
  bodyClass = "p-4",
  children,
}: {
  title: string;
  description?: string;
  bodyClass?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface-base flex flex-col rounded">
      <div className="border-outline-decorative border-b-2 p-4">
        <div className="flex gap-1 flex-col">
          <h3 className="text-white text-lg font-bold leading-5">{title}</h3>
          {description ? (
            <span className="text-surface-onSurfaceSecondary text-sm font-normal leading-normal">
              {description}
            </span>
          ) : null}
        </div>
      </div>
      {bodyClass === null ? children : <div className={bodyClass}>{children}</div>}
    </section>
  );
}
