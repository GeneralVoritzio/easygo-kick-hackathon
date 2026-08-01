import { HYPE_TIER_MAX } from "./events";

// The pixel star from the Noun Project icon 135344, attribution in
// KICK-ASSETS.md. The outline holds gold and the fill layer under it blinks,
// fills and cycles with the hype tier.
export function PixelStar({ size, fillClass }: { size: string; fillClass: string }) {
  return (
    <svg viewBox="12 10 76 80" className={`${size} shrink-0`} aria-hidden>
      <polygon points="50.0,20.5 57.9,40.1 79.0,41.6 62.8,55.2 67.9,75.7 50.0,64.5 32.1,75.7 37.2,55.2 21.0,41.6 42.1,40.1" className={fillClass} />
      <path fill="#ffd700" d="M82.087,37.159v8.557h-4.273v-4.285H60.7v-4.272H82.087z M69.257,79.945v4.284h12.83v-8.557h-4.273v4.273H69.257z M73.53,75.672h4.284v-8.557H73.53V75.672z M73.53,50.012h4.284v-4.296H73.53V50.012z M69.257,67.115h4.273v-8.546h-4.273V67.115z M69.257,54.285h4.273v-4.273h-4.273V54.285z M60.7,75.672v4.273h8.557v-4.273H60.7z M64.984,58.569h4.273v-4.284h-4.273V58.569z M52.131,71.399v4.273H60.7v-4.273H52.131z M56.427,37.159H60.7v-8.558h-4.273V37.159z M52.131,54.285h4.296V41.431h-4.296V54.285z M52.131,28.601h4.296v-8.545h-4.296V28.601z M47.846,67.115v4.284h4.285v-4.284H47.846z M52.131,15.771h-4.285v4.285h4.285V15.771z M43.574,54.285h4.272V41.431h-4.272V54.285z M47.846,20.056h-4.272v8.545h4.272V20.056z M39.301,71.399v4.273h8.545v-4.273H39.301z M43.574,28.601h-4.273v8.558h4.273V28.601z M30.744,75.672v4.273h8.557v-4.273H30.744z M35.016,54.285h-4.272v4.284h4.272V54.285z M30.744,58.569h-4.273v8.546h4.273V58.569z M26.471,50.012v4.273h4.273v-4.273H26.471z M22.186,79.945v-4.273h-4.273v8.557h12.831v-4.284H22.186z M26.471,67.115h-4.285v8.557h4.285V67.115z M22.186,45.716v4.296h4.285v-4.296H22.186z M39.301,41.431v-4.272H17.913v8.557h4.273v-4.285H39.301z" />
    </svg>
  );
}

export function HypeStars({ tier, size = "size-6" }: { tier: number; size?: string }) {
  return (
    <div className="hype-stars flex items-center gap-1">
      {[0, 1, 2].map((i) => {
        const fillClass =
          tier === HYPE_TIER_MAX
            ? "hype-star-rainbow"
            : i < tier
              ? "fill-[#ffd700]"
              : i === tier
                ? "hype-star-blink"
                : "fill-transparent";
        return <PixelStar key={i} size={size} fillClass={fillClass} />;
      })}
    </div>
  );
}
