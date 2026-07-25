interface StreamTagPillsProps {
  tags: string[];
  className?: string;
}

/** Twitch-style genre/format/language pills ("IRL", "English", "Shooter")
 *  shown on a stream card instead of a single "Playing X" / "Just Chatting"
 *  line. */
export function StreamTagPills({ tags, className = '' }: StreamTagPillsProps) {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-line bg-page/40 px-2 py-0.5 text-[10px] font-semibold text-ink"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
