import { useState, type FormEvent } from "react";
import { SettingsLayout } from "../components/SettingsLayout";
import { currentUser, formatFollowers, bannerFor } from "../mock/api";

const bannerImage = (seed: string) => bannerFor(seed);

const ghostButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded border border-outline-region text-sm font-semibold text-white transition-colors betterhover:hover:border-white";

function BannerSection({
  title,
  imageSrc,
  helpText,
}: {
  title: string;
  imageSrc: string;
  helpText: string;
}) {
  return (
    <section className="flex flex-col gap-4 py-6">
      <h3 className="text-base font-bold leading-[1.2] text-white">{title}</h3>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="h-[134px] w-full rounded border border-outline-decorative object-cover"
        />
      ) : (
        <div className="h-[134px] w-full rounded border border-outline-decorative bg-surface-base" />
      )}
      <div className="flex flex-col gap-2">
        <button type="button" className={`${ghostButtonClass} h-8 w-[170px]`}>
          Update Banner image
        </button>
        <span className="text-xs text-surface-onSurfaceSecondary">{helpText}</span>
      </div>
    </section>
  );
}

function BasicDetailsField({
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
  const dirty = value !== saved;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(value);
  }

  function handleCancel() {
    setValue(saved);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-1.5">
      <label htmlFor={name} className="text-sm font-semibold leading-[1.2] text-white">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-9 w-full rounded border border-outline-region bg-transparent px-3 text-sm text-white outline-none transition-colors betterhover:hover:border-neutral-300 focus:border-white"
      />
      <div className="flex items-center gap-2">
        <button
          type="reset"
          disabled={!dirty}
          onClick={(event) => {
            event.preventDefault();
            handleCancel();
          }}
          className={`${ghostButtonClass} h-8 w-[71px] disabled:pointer-events-none disabled:border-outline-decorative disabled:text-surface-onSurfaceSecondary`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!dirty}
          className="inline-flex h-8 w-[119px] shrink-0 items-center justify-center rounded bg-primary-base text-sm font-semibold text-primary-onPrimary transition-colors betterhover:hover:bg-green-600 disabled:pointer-events-none disabled:bg-secondary-base disabled:text-surface-onSurfaceSecondary"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}

export function SettingsProfile() {
  return (
    <SettingsLayout title="Profile">
      <section className="flex flex-col gap-4 py-6">
        <h3 className="text-base font-bold leading-[1.2] text-white">Profile Preview</h3>
        <div className="overflow-hidden rounded-lg border border-outline-decorative">
          {bannerImage("superdude1337-banner") ? (
            <img src={bannerImage("superdude1337-banner")} alt="" className="h-[134px] w-full object-cover" />
          ) : (
            <div className="h-[134px] w-full bg-surface-base" />
          )}
          <div className="-mt-10 flex items-end gap-4 px-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="size-20 shrink-0 rounded-full border-4 border-surface-lowest bg-surface-lowest"
            />
            <button type="button" className={`${ghostButtonClass} mb-1 h-9 w-[89px]`}>
              Edit Avatar
            </button>
          </div>
          <div className="flex flex-col gap-1 px-4 py-4">
            <div className="text-base font-bold text-white">About {currentUser.username}</div>
            <span className="text-sm font-semibold text-surface-onSurfaceSecondary">
              {formatFollowers(currentUser.followers)} Followers
            </span>
            <p className="text-sm text-surface-onSurfaceSecondary">{currentUser.bio}</p>
          </div>
        </div>
      </section>

      <BannerSection
        title="Channel Banner"
        imageSrc={bannerImage("superdude1337-banner")}
        helpText="Minimum image size: 1200x134px and less than 4MB"
      />

      <BannerSection
        title="Offline Stream Banner"
        imageSrc={bannerImage("superdude1337-offline")}
        helpText="This banner image will display for two minutes upon going offline."
      />

      <section className="flex flex-col gap-6 py-6">
        <h3 className="text-base font-bold leading-[1.2] text-white">Basic Details</h3>
        <BasicDetailsField label="Username" name="username" type="text" initialValue={currentUser.username} />
        <BasicDetailsField label="Email" name="email" type="email" initialValue="superdude1337@kickstream.tv" />
      </section>
    </SettingsLayout>
  );
}
