import { oneRowGrid } from "./Layout";
import { formatViewers } from "../mock/api";

type Category = {
  name: string;
  slug: string;
  viewers: number;
  thumbnail: string;
};

export function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col items-start gap-1 overflow-hidden will-change-transform">
      <button type="button" className="block w-full">
        <img
          src={category.thumbnail}
          alt={category.name}
          className="aspect-[3/4] w-full rounded object-cover"
        />
      </button>
      <div className="flex w-full min-w-0 flex-col items-start gap-0.5">
        <button
          type="button"
          className="w-full truncate text-left text-sm font-semibold leading-[1.2] text-white betterhover:hover:text-surface-onSurfacePrimary"
        >
          {category.name}
        </button>
        <span className="text-sm font-normal leading-[1.2] text-surface-onSurfaceSecondary">
          {formatViewers(category.viewers)} viewers
        </span>
      </div>
    </div>
  );
}

const categoryColumns =
  "h-full grid-cols-2 gap-x-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-auto-fill-category";

export function CategoryGrid({ categories, oneRow }: { categories: Category[]; oneRow?: boolean }) {
  return (
    <section className={`${categoryColumns} ${oneRow ? `${oneRowGrid} [&>div]:w-[108px]` : "grid gap-y-5 lg:gap-y-6"}`}>
      {categories.map((c) => (
        <CategoryCard key={c.slug} category={c} />
      ))}
    </section>
  );
}
