const plate = [
  "repeating-linear-gradient(45deg, rgb(11 11 12 / 0.45) 0 4px, transparent 4px 8px)",
  "repeating-linear-gradient(-45deg, rgb(11 11 12 / 0.45) 0 4px, transparent 4px 8px)",
  "linear-gradient(90deg, #18e9fb 0%, #53fc18 22%, #0b0b0c 44%, #0b0b0c 56%, #53fc18 78%, #18e9fb 100%)",
].join(", ");

export function HomeBanner() {
  return (
    <div className="bg-surface-lowest lg:pt-4">
      <div
        className="grid grid-cols-[1fr_auto_1fr] grid-rows-1 items-center gap-4 rounded-lg bg-surface-base bg-cover bg-center bg-no-repeat p-4"
        style={{ backgroundImage: plate }}
      >
        <div className="col-span-1 col-start-1 flex flex-row flex-nowrap items-center gap-4 justify-self-start empty:hidden" />
        <div className="col-span-1 col-start-2 flex flex-row flex-nowrap items-center gap-4 justify-self-center empty:hidden">
          <div className="flex size-fit shrink-0 grow-0 flex-col items-center gap-4 text-center">
            <div className="flex size-fit items-center gap-2">
              <p
                aria-label="Announcement"
                className="text-xl font-bold uppercase leading-7 text-white lg:text-2xl"
                style={{ textShadow: "rgb(0 0 0 / 65%) 0 1px 8px" }}
              >
                KICKs Drop Week: win a share of 100,000 KICKs
              </p>
            </div>
            <button
              type="button"
              className="group relative box-border hidden h-9 w-fit select-none items-center justify-center gap-1.5 whitespace-nowrap rounded bg-primary-base px-2 py-0 text-sm font-semibold text-primary-onPrimary outline outline-2 outline-offset-2 outline-transparent transition-all state-layer-base focus-visible:outline-focusLight betterhover:active:scale-[0.98] lg:inline-flex"
            >
              Enter now
            </button>
          </div>
        </div>
        <div className="col-span-1 col-start-3 flex flex-row flex-nowrap items-center gap-4 justify-self-end empty:hidden" />
      </div>
    </div>
  );
}
