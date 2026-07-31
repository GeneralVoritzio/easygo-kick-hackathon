import { Link } from "react-router-dom";
import { DropAccordion } from "../components/DropAccordion";
import {
  CampaignHeader,
  Divider,
  DropButton,
  DropsPage,
  DropsSection,
  RewardGrid,
  RewardTile,
} from "../components/DropBits";
import {
  expiredDrops,
  formatDropDate,
  formatWatchTime,
  inventoryDrops,
  type InventoryDrop,
} from "../mock/drops";

function InventoryCard({ drop, expired }: { drop: InventoryDrop; expired: boolean }) {
  return (
    <DropAccordion
      defaultOpen={!expired}
      header={
        <CampaignHeader
          thumbnail={drop.category.thumbnail}
          title={drop.name}
          subtitle={drop.category.name}
          thumbClass="h-[67px] w-[50px] rounded-lg"
          subtitleClass="text-surface-onSurfaceSecondary"
        />
      }
    >
      <div className="flex w-full flex-col">
        <Divider className="mt-4 w-auto" />
        <div className="flex flex-col gap-4 p-4">
          <RewardGrid>
            {drop.claims.map((claim) => (
              <RewardTile
                key={claim.claim_id}
                name={claim.reward.name}
                image={claim.reward.image}
                progress={expired ? undefined : claim.progress}
                labelClass="h-10 items-start justify-start"
              >
                <span className="text-sm font-normal text-surface-onSurfaceSecondary">
                  {expired
                    ? "This reward is no longer available."
                    : `${formatWatchTime(claim.minutes_remaining)} to unlock`}
                </span>
              </RewardTile>
            ))}
          </RewardGrid>
        </div>
        <Divider />
        <div className="flex w-full flex-col items-center justify-between gap-4 px-4 pt-4 lg:flex-row">
          <div className="flex w-full flex-col gap-1">
            <div className="flex flex-row items-start justify-start gap-1 text-left text-sm text-surface-onSurfaceSecondary">
              <span className="font-bold text-surface-onSurface">End date:</span>
              {formatDropDate(drop.end_at)}
            </div>
            {!expired && (
              <div className="flex flex-wrap items-start justify-start text-sm text-surface-onSurfaceSecondary">
                To continue progress, go to
                <Link
                  to={`/${drop.participating_channel}`}
                  className="ml-1 text-surface-onSurface underline hover:no-underline"
                >
                  any participating live channel
                </Link>
                .
              </div>
            )}
          </div>
          <div className="flex w-full flex-col-reverse justify-end gap-2.5 self-center lg:w-full lg:flex-row">
            <DropButton
              href={drop.campaign_info_url}
              icon="dash-info"
              label="About this drop"
              variant="secondary"
            />
            {!expired && (
              <DropButton
                href={drop.connect_url}
                icon="drop-connect"
                label="Connect"
                variant="primary"
              />
            )}
          </div>
        </div>
      </div>
    </DropAccordion>
  );
}

export function DropsInventory() {
  return (
    <DropsPage active="/drops/inventory">
      <DropsSection title="Drops" gap="gap-2">
        <p className="whitespace-pre-line text-sm leading-normal text-neutral-300">
          Most of the Drops you get are found directly within their games. Log in to the respective
          game to enjoy your new content. You might only have a limited time to link your accounts
          and claim your Drops. You can manage your connections here.{" "}
          {/* kick.com sends this to /settings/connections, a page the demo does not hold. */}
          <Link
            to="/settings/profile"
            className="font-semibold text-white underline-offset-2 hover:underline"
          >
            Learn more
          </Link>
        </p>
      </DropsSection>

      <DropsSection title="In progress">
        <div className="flex flex-col gap-4">
          {inventoryDrops.map((drop) => (
            <InventoryCard key={drop.campaign_id} drop={drop} expired={false} />
          ))}
        </div>
      </DropsSection>

      <DropsSection title="Expired">
        <div className="flex flex-col gap-4">
          {expiredDrops.map((drop) => (
            <InventoryCard key={drop.campaign_id} drop={drop} expired />
          ))}
        </div>
      </DropsSection>
    </DropsPage>
  );
}
