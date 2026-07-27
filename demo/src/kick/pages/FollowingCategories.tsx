import { PageShell } from "../components/Layout";
import { CategoryGrid } from "../components/CategoryCard";
import { SectionHeading } from "../components/CardBits";
import { FollowingTabs } from "../components/FollowingTabs";
import { FollowingEmptyState } from "../components/FollowingEmptyState";
import { categories, followedChannels, livestreams } from "../mock/api";

export function FollowingCategories() {
  const liveSlugs = new Set(
    livestreams
      .filter((s) => followedChannels.some((c) => c.slug === s.channel.slug))
      .map((s) => s.category.slug),
  );
  const followedCategories = categories.filter((c) => liveSlugs.has(c.slug));

  return (
    <PageShell>
      <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Following</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <FollowingTabs />
        <div className="flex flex-col gap-6 lg:gap-8">
          <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
            <SectionHeading white="Categories" />
            {followedCategories.length === 0 ? (
              <FollowingEmptyState
                icon="empty-categories"
                message="No followed channels stream a category now."
              />
            ) : (
              <CategoryGrid categories={followedCategories} />
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
