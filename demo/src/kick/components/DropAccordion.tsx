import { useId, useState, type ReactNode } from "react";
import { Icon } from "../Icon";

export function DropAccordion({
  header,
  children,
  defaultOpen = false,
  cardClass = "flex w-full flex-col rounded-lg bg-surface-base py-4",
  triggerClass = "w-full gap-6 flex items-center justify-between px-4",
}: {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  cardClass?: string;
  triggerClass?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const region = useId();
  const state = open ? "open" : "closed";

  return (
    <div className="mt-px w-full overflow-hidden first:mt-0 focus-within:relative focus-within:z-[10]">
      <div className={cardClass}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={region}
          data-state={state}
          onClick={() => setOpen((v) => !v)}
          className={`group/accordion ${triggerClass}`}
        >
          {header}
          <Icon
            name="chevron-down"
            className="size-4 shrink-0 text-white transition-transform group-data-[state=open]/accordion:rotate-180"
          />
        </button>
        <div id={region} role="region" data-state={state} className="accordion-region text-white">
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
