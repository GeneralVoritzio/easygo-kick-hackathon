import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";

export type SelectOption = { value: string; label: string };

export type Filter = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
};

export function FilterSelect({ id, label, value, onChange, options, align = "left" }: Filter & { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex h-fit flex-row items-center gap-2">
      <label htmlFor={id} className="whitespace-nowrap text-sm font-semibold text-white">
        {label}
      </label>
      <div ref={ref} className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          data-state={open ? "open" : "closed"}
          onClick={() => setOpen((value) => !value)}
          className="group inline-flex h-8 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded bg-secondary-base/20 px-3 py-1.5 text-sm font-semibold text-white outline outline-2 outline-offset-2 outline-transparent transition-all betterhover:hover:bg-secondary-base/40 betterhover:active:scale-[0.98] focus-visible:outline-outline-decorative"
        >
          <span className="truncate">{selected?.label}</span>
          <Icon
            name="icon-10"
            className="size-3.5 shrink-0 opacity-75 transition-transform group-data-[state=open]:rotate-180"
          />
        </button>

        {open && (
          <div
            role="listbox"
            className={`z-popover absolute top-10 flex min-w-full flex-col gap-0.5 rounded-lg bg-surface-highest p-1 ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`state-layer-surface flex h-9 w-full items-center whitespace-nowrap rounded px-3 text-left text-sm font-semibold ${
                  option.value === value ? "text-surface-onSurfacePrimary" : "text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BrowseFilters({ left, right }: { left: Filter; right: Filter }) {
  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <FilterSelect {...left} />
      <FilterSelect {...right} align="right" />
    </div>
  );
}
