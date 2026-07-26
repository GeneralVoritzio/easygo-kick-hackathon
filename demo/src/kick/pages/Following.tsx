import { useState } from "react";
import { PageShell } from "../components/Layout";
import { StreamGrid } from "../components/StreamCard";
import { FollowingTabs } from "../components/FollowingTabs";
import { FollowingEmptyState } from "../components/FollowingEmptyState";
import { livestreams } from "../mock/api";

export function Following() {
  const [previewEmpty, setPreviewEmpty] = useState(false);
  const streams = previewEmpty ? [] : livestreams;

  return (
    <PageShell>
      <h2 className="text-white text-base font-bold leading-[1.2] lg:text-2xl">Following</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <FollowingTabs />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPreviewEmpty((v) => !v)}
            className="text-sm font-semibold text-surface-onSurfaceSecondary underline decoration-dotted underline-offset-4 betterhover:hover:text-white"
          >
            {previewEmpty ? "Exit empty state preview" : "Preview empty state"}
          </button>
        </div>
        {streams.length === 0 ? (
          <FollowingEmptyState icon="empty-livestreams" message="No followed channels are live now." />
        ) : (
          <StreamGrid streams={streams} />
        )}
      </div>
    </PageShell>
  );
}
