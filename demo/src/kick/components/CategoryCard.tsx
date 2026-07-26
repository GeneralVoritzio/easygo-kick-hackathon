import { formatViewers } from "../mock/api";

type Category = {
  name: string;
  slug: string;
  viewers: number;
  thumbnail: string;
};

export function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col gap-2 will-change-transform">
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

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="grid h-full grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 lg:gap-y-6 3xl:grid-cols-8">
      {categories.map((c) => (
        <CategoryCard key={c.slug} category={c} />
      ))}
    </section>
  );
}
