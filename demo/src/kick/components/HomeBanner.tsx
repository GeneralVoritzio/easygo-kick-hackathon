export function HomeBanner() {
  return (
    <div className="group/banner relative h-[90px] w-full shrink-0 overflow-hidden rounded bg-surface-lowest">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #18e9fb 0%, #53fc18 22%, #0b0b0c 44%, #0b0b0c 56%, #53fc18 78%, #18e9fb 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/3 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #0b0b0c 0 4px, transparent 4px 8px), repeating-linear-gradient(-45deg, #0b0b0c 0 4px, transparent 4px 8px)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/3 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #0b0b0c 0 4px, transparent 4px 8px), repeating-linear-gradient(-45deg, #0b0b0c 0 4px, transparent 4px 8px)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="px-4 text-center text-xl font-bold uppercase leading-none text-white">
          KICKs Drop Week: win a share of 100,000 KICKs
        </span>
        <button
          type="button"
          className="h-7 rounded bg-primary-base px-3 text-xs font-bold uppercase leading-none text-primary-onPrimary transition-all betterhover:hover:bg-green-400 betterhover:active:scale-[0.98]"
        >
          Enter now
        </button>
      </div>
    </div>
  );
}
