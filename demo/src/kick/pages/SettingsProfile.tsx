import { useState, type FormEvent, type ReactNode } from "react";
import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsCard } from "../components/SettingsCard";
import { currentUser, formatFollowers } from "../mock/api";

const buttonBase =
  "group inline-flex gap-1.5 items-center justify-center rounded font-semibold box-border relative transition-all betterhover:active:scale-[0.98] disabled:pointer-events-none select-none whitespace-nowrap [&_svg]:size-[1em] outline-transparent outline outline-2 outline-offset-2 disabled:text-disabled-onSurface focus-visible:outline-focusLight px-3 py-1.5 text-sm";

const buttonClass = {
  primary: `${buttonBase} state-layer-base bg-primary-base text-primary-onPrimary focus-visible:bg-green-500 disabled:bg-disabled-base`,
  secondary: `${buttonBase} state-layer-surface bg-secondary-base text-secondary-onSecondary focus-visible:bg-secondary-base disabled:bg-disabled-base`,
  ghost: `${buttonBase} state-layer-surface text-surface-onSurface bg-transparent disabled:bg-transparent`,
};

// The label stays inline, so its line box is 24px and the control carries the 8px gap.
// This is what KICK's space-y-2 produces on Tailwind v3, which v4 no longer does.
const fieldClass = "mt-2";

const inputClass = `border-outline-region bg-surface-lowest placeholder:text-surface-onSurfaceSecondary betterhover:hover:border-neutral-300 flex w-full rounded border border-solid px-3 font-normal outline-none transition-colors duration-200 ease-in-out focus-visible:border-white disabled:bg-transparent h-9 text-sm ${fieldClass}`;

const labelClass = "text-surface-onSurface text-sm font-semibold leading-none";

function EditForm({
  children,
  dirty,
  onReset,
  onSave,
  saveLabel = "Save changes",
  actionsClass = "",
  formClass = "flex flex-col gap-y-4",
}: {
  children: ReactNode;
  dirty: boolean;
  onReset: () => void;
  onSave: () => void;
  saveLabel?: string;
  actionsClass?: string;
  formClass?: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <form onSubmit={handleSubmit} className={formClass}>
      {children}
      <div
        className={`flex w-full flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-end ${actionsClass}`}
      >
        <button
          type="reset"
          disabled={!dirty}
          onClick={onReset}
          className={`${buttonClass.ghost} order-last lg:order-first`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!dirty}
          className={`${buttonClass.primary} min-w-[10ch] order-first lg:order-last`}
        >
          {saveLabel}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  type,
  initialValue,
}: {
  label: string;
  name: string;
  type: string;
  initialValue: string;
}) {
  const [saved, setSaved] = useState(initialValue);
  const [value, setValue] = useState(initialValue);

  return (
    <EditForm dirty={value !== saved} onReset={() => setValue(saved)} onSave={() => setSaved(value)}>
      <div>
        <label className={labelClass} htmlFor={name}>
          {label}
        </label>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={inputClass}
        />
      </div>
    </EditForm>
  );
}

function BioField({ initialValue }: { initialValue: string }) {
  const [saved, setSaved] = useState(initialValue);
  const [value, setValue] = useState(initialValue);

  return (
    <EditForm dirty={value !== saved} onReset={() => setValue(saved)} onSave={() => setSaved(value)}>
      <div>
        <label className={labelClass} htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={`bg-surface-lowest betterhover:hover:border-neutral-300 flex w-full resize-none rounded border-2 border-solid border-neutral-700 p-2.5 text-sm font-medium leading-tight outline-none transition-colors duration-200 ease-in-out placeholder:text-neutral-300 focus-visible:border-white ${fieldClass}`}
        />
      </div>
    </EditForm>
  );
}

const socials = ["Club", "Instagram", "X", "Facebook", "YouTube", "Discord", "TikTok"];

function SocialMediaForm() {
  const [handles, setHandles] = useState<Record<string, string>>({});
  const dirty = Object.values(handles).some(Boolean);

  return (
    <EditForm
      dirty={dirty}
      onReset={() => setHandles({})}
      onSave={() => setHandles(handles)}
      saveLabel="Save"
      actionsClass="lg:pt-6"
      formClass="flex grow flex-col gap-y-2"
    >
      {socials.map((name) => {
        const key = name.toLowerCase();
        return (
          <div key={key}>
            <label className={labelClass} htmlFor={`social-${key}`}>
              {name}
            </label>
            <input
              id={`social-${key}`}
              data-testid={`profile-inline-edit-input-${key}`}
              type="text"
              placeholder="Enter social handle"
              value={handles[key] ?? ""}
              onChange={(event) =>
                setHandles((current) => ({ ...current, [key]: event.target.value }))
              }
              className={inputClass}
            />
          </div>
        );
      })}
    </EditForm>
  );
}

function BannerCard({
  title,
  frameClass,
  imageSrc,
  helpText,
}: {
  title: string;
  frameClass: string;
  imageSrc: string;
  helpText: string;
}) {
  return (
    <SettingsCard title={title} bodyClass="p-4 flex flex-col items-center gap-y-5">
      <div className={`${frameClass} w-full max-w-[580px] px-2.5 lg:w-3/4 lg:px-0`}>
        <img src={imageSrc} alt="" className="h-full w-full object-cover object-center" />
      </div>
      <button type="button" className={`${buttonClass.secondary} w-full lg:w-auto`}>
        Update Banner image
      </button>
      <span className="text-surface-onSurfaceSecondary text-center text-sm leading-[1.2]">
        {helpText}
      </span>
    </SettingsCard>
  );
}

export function SettingsProfile() {
  return (
    <SettingsLayout title="Profile">
      <SettingsCard title="Profile Preview">
        <div className="flex min-w-0 flex-col gap-x-4 gap-y-4 lg:flex-row">
          <div className="hidden flex-col items-center gap-y-3 lg:flex">
            <img src={currentUser.avatar} alt="" className="size-16 rounded-full" />
            <button type="button" className={`${buttonClass.secondary} h-9 px-2`}>
              Edit Avatar
            </button>
          </div>
          <div className="flex w-full min-w-0 flex-col items-start gap-y-4 lg:gap-y-3 lg:py-4">
            <div className="flex items-center gap-x-4">
              <img src={currentUser.avatar} alt="" className="size-12 rounded-full lg:hidden" />
              <div className="flex grow items-center justify-between gap-3">
                <div className="flex shrink-0 grow flex-row items-center gap-x-3">
                  <div className="text-surface-onSurface flex items-center gap-1 text-base font-bold">
                    About {currentUser.username}
                  </div>
                  <span className="text-surface-onSurfaceSecondary text-sm font-semibold">
                    <span className="text-surface-onSurfacePrimary">
                      {formatFollowers(currentUser.followers)}
                    </span>{" "}
                    Followers
                  </span>
                </div>
              </div>
            </div>
            <p
              data-testid="channel-about-description"
              className="text-surface-onSurfaceSecondary hyphens-auto break-words text-sm font-normal w-full min-w-0"
            >
              {currentUser.bio}
            </p>
          </div>
        </div>
      </SettingsCard>

      <BannerCard
        title="Channel Banner"
        frameClass="aspect-[580/64]"
        imageSrc={currentUser.banner}
        helpText="Minimum image size: 1200x134px and less than 4MB"
      />

      <BannerCard
        title="Offline Stream Banner"
        frameClass="aspect-video"
        imageSrc={currentUser.offlineBanner}
        helpText="This banner image will display for two minutes upon ending your stream. Must be 1080p (16:9 aspect ratio), in JPEG or PNG format and less than 4MB."
      />

      <SettingsCard title="Basic Details" bodyClass="p-4 flex flex-col gap-4">
        <TextField label="Username" name="username" type="text" initialValue={currentUser.username} />
        <TextField label="Email" name="email" type="email" initialValue="martibo@kickstream.tv" />
        <BioField initialValue="" />
      </SettingsCard>

      <SettingsCard title="Social Media">
        <SocialMediaForm />
      </SettingsCard>
    </SettingsLayout>
  );
}
