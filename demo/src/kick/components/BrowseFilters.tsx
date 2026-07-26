import { useState } from "react";
import { Icon } from "../Icon";

type SelectOption = { value: string; label: string };

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  widthClass,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  widthClass: string;
}) {
  return (
    <div className="flex w-full items-center gap-2 lg:w-fit">
      <label htmlFor={id} className="whitespace-nowrap text-sm font-semibold text-white">
        {label}
      </label>
      <div className={`relative h-9 w-full shrink-0 ${widthClass}`}>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none rounded bg-secondary-base/20 px-3 py-1.5 pr-8 text-sm font-semibold text-white outline-none transition-colors betterhover:hover:bg-secondary-base/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-outline-decorative"
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

export function BrowseFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  sortValue,
  onSortChange,
  sortOptions,
  languageValue,
  onLanguageChange,
  languageOptions,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SelectOption[];
  languageValue?: string;
  onLanguageChange?: (value: string) => void;
  languageOptions?: SelectOption[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const search = (
    <div className="flex h-9 w-full items-center gap-2 rounded border border-outline-region px-3 transition-colors duration-200 ease-in-out focus-within:border-white betterhover:hover:border-neutral-300 lg:w-[360px]">
      <Icon name="search" className="size-4 shrink-0 text-surface-onSurfaceSecondary" />
      <input
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="h-full min-w-0 flex-1 border-0 bg-transparent py-1.5 text-base font-normal text-white outline-none placeholder:text-surface-onSurfaceSecondary"
      />
    </div>
  );

  const controls = (
    <div className="flex w-full flex-col gap-3 lg:w-fit lg:flex-row lg:items-center lg:gap-4">
      {languageOptions && onLanguageChange && (
        <FilterSelect
          id="browse_language"
          label="Language:"
          value={languageValue ?? "all"}
          onChange={onLanguageChange}
          options={languageOptions}
          widthClass="lg:w-[118px]"
        />
      )}
      <FilterSelect
        id="browse_sort_by"
        label="Sort by:"
        value={sortValue}
        onChange={onSortChange}
        options={sortOptions}
        widthClass="lg:w-[220px]"
      />
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex flex-row items-center gap-4">{search}</div>
        <div className="hidden h-fit flex-row items-center gap-2 lg:flex">{controls}</div>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle filters"
          aria-expanded={mobileOpen}
          className="state-layer-surface flex size-8 shrink-0 items-center justify-center rounded bg-secondary-base/20 text-white lg:hidden"
        >
          <Icon name="icon-24" className="size-4" />
        </button>
      </div>
      {mobileOpen && <div className="lg:hidden">{controls}</div>}
    </div>
  );
}
