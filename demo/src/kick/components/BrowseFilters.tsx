import { Icon } from "../Icon";

export type SelectOption = { value: string; label: string };

export type Filter = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  widthClass: string;
};

function FilterSelect({ id, label, value, onChange, options, widthClass }: Filter) {
  return (
    <div className="flex w-full items-center gap-2 lg:w-fit">
      <label htmlFor={id} className="whitespace-nowrap text-sm font-semibold text-white">
        {label}
      </label>
      <div className={`relative h-8 w-full shrink-0 ${widthClass}`}>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded bg-secondary-base/20 px-3 py-1.5 pr-8 text-sm font-semibold text-white outline-none transition-colors betterhover:hover:bg-secondary-base/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-outline-decorative"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface-base text-white">
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="icon-10"
          className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-white opacity-75"
        />
      </div>
    </div>
  );
}

export function BrowseFilters({ left, right }: { left: Filter; right: Filter }) {
  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <FilterSelect {...left} />
      <FilterSelect {...right} />
    </div>
  );
}
