import { CornerMarks, PillRow } from "./CardBits";
import { oneRowGrid } from "./Layout";
import { formatViewers, type Category } from "../mock/api";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col items-start will-change-transform">
      <button type="button" className="block w-full">
        <img
          src={category.thumbnail}
          alt={category.name}
          className="aspect-[3/4] w-full rounded-lg object-cover"
        />
      </button>
      <div className="flex w-full min-w-0 flex-col gap-1 p-1 pt-0 lg:pb-3">
        <div className="flex w-full min-w-0 flex-col items-start">
          <button
            type="button"
            className="w-full truncate text-left text-base font-semibold leading-6 text-white"
          >
            {category.name}
          </button>
          <span className="max-w-full truncate text-sm font-normal leading-normal text-surface-onSurfaceSecondary">
            <span>{formatViewers(category.viewers)}</span> watching
          </span>
        </div>
        <PillRow pills={category.tags} className="" />
      </div>
      <CornerMarks />
    </div>
  );
}

export const categoryColumns =
  "h-full grid-cols-2 gap-x-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-auto-fill-category";

export function CategoryGrid({ categories, oneRow }: { categories: Category[]; oneRow?: boolean }) {
  return (
    <section className={`${categoryColumns} ${oneRow ? `${oneRowGrid} [&>div]:w-[108px]` : "grid gap-y-3 lg:gap-y-6"}`}>
      {categories.map((c) => (
        <CategoryCard key={c.slug} category={c} />
      ))}
    </section>
  );
}
