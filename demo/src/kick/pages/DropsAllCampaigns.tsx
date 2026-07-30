import { Link } from "react-router-dom";
import { Icon } from "../Icon";
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
  closedCampaigns,
  formatDateRange,
  formatWatchTime,
  openCampaigns,
  type DropCampaignGroup,
} from "../mock/drops";

function HowToEarn({ group }: { group: DropCampaignGroup }) {
  return (
    <div className="px-3">
      <div className="rounded bg-surface-highest p-4">
        <DropAccordion
          cardClass=""
          triggerClass="w-full flex items-center justify-between"
          header={
            <h1 className="flex items-center gap-2 text-base font-bold text-white">
              <Icon name="drop-info" className="inline-block size-4" />
              <span>How to earn &amp; redeem?</span>
            </h1>
          }
        >
          <ul className="list-disc whitespace-pre-line pl-7 pt-2 text-sm leading-normal text-surface-onSurfaceSecondary">
            <li>
              <Link
                to={`/${group.participating_channel}`}
                className="font-semibold text-white underline-offset-2 hover:underline"
              >
                View participating channels
              </Link>
              .
            </li>
            <li>
              Monitor your reward progress or status in your{" "}
              <Link
                to="/drops/inventory"
                className="font-semibold text-white underline-offset-2 hover:underline"
              >
                Drops Inventory
              </Link>
              .
            </li>
            <li>You can only earn rewards on one stream at a time.</li>
            <li>Rewards must be manually claimed once progress hits 100%.</li>
            <li>
              Connect your KICK account with your account for {group.organization} to receive
              rewards.
            </li>
            <li>
              See more details provided by{" "}
              <a
                href={group.campaign_info_url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-white underline-offset-2 hover:underline"
              >
                {group.organization}
              </a>
              .
            </li>
          </ul>
        </DropAccordion>
      </div>
    </div>
  );
}

function CampaignCard({ group, open }: { group: DropCampaignGroup; open: boolean }) {
  return (
    <DropAccordion
      defaultOpen={open}
      header={
        <CampaignHeader
          thumbnail={group.category.thumbnail}
          title={group.category.name}
          subtitle={group.organization}
          restrictions={group.restrictions}
          dateRange={formatDateRange(group.start_at, group.end_at)}
          thumbClass="h-[67px] w-[50px] rounded"
          subtitleClass="text-secondary-onSecondaryVariant"
        />
      }
    >
      <div className="flex w-full flex-col gap-4">
        <Divider className="mt-4 w-full" />
        {group.campaigns.map((campaign) => (
          <div
            key={campaign.campaign_id}
            className="mt-px w-full overflow-hidden first:mt-0 focus-within:relative focus-within:z-[10]"
          >
            <div className="flex w-full flex-col gap-4 rounded bg-surface-base">
              <div className="flex w-full items-center justify-between gap-3 px-4">
                <div className="flex w-full flex-col gap-2 sm:w-full sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="break-words text-base font-bold md:truncate">
                      {campaign.name}
                    </div>
                    <div className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-secondary-base px-2 py-1 text-xs text-secondary-onSecondary">
                      <Icon name="drop-watch" className="size-[18px]" />
                      <span>Watch to redeem</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm leading-normal text-neutral-300">
                    {formatDateRange(campaign.start_at, campaign.end_at)}
                  </div>
                </div>
              </div>
              <RewardGrid className="px-4">
                {campaign.rewards.map((reward) => (
                  <RewardTile key={reward.reward_id} name={reward.name} image={reward.image}>
                    <span className="text-sm font-normal text-surface-onSurfaceSecondary">
                      Watch {formatWatchTime(reward.watch_minutes)}
                    </span>
                  </RewardTile>
                ))}
              </RewardGrid>
              {open && <HowToEarn group={group} />}
              <Divider />
            </div>
          </div>
        ))}
        <div className="flex w-full flex-col-reverse justify-end gap-2 self-center px-4 lg:w-full lg:flex-row">
          {open && (
            <>
              <DropButton
                href={group.connect_url}
                icon="drop-connect"
                label="Connect"
                variant="secondary"
              />
              <DropButton
                href={`/${group.participating_channel}`}
                icon="drop-participate"
                label="Participate"
                variant="primary"
              />
            </>
          )}
        </div>
      </div>
    </DropAccordion>
  );
}

export function DropsAllCampaigns() {
  return (
    <DropsPage active="/drops/all-campaigns">
      <DropsSection title="Open campaigns" gap="gap-2" weight="font-bold">
        <p className="whitespace-pre-line text-sm leading-normal text-neutral-300">
          {"Drops are automatically available across eligible streams.\n"}
          Viewers can earn rewards by watching, and creators can manage their campaigns from the{" "}
          <Link
            to="/dashboard/drops"
            className="font-semibold text-white underline-offset-2 hover:underline"
          >
            Creator Dashboard
          </Link>
          .
        </p>
        <div className="flex flex-col gap-4 pt-1">
          {openCampaigns.map((group) => (
            <CampaignCard key={group.group_id} group={group} open />
          ))}
        </div>
      </DropsSection>

      <DropsSection title="Closed campaigns" weight="font-bold">
        <div className="flex flex-col gap-4">
          {closedCampaigns.map((group) => (
            <CampaignCard key={group.group_id} group={group} open={false} />
          ))}
        </div>
      </DropsSection>
    </DropsPage>
  );
}
