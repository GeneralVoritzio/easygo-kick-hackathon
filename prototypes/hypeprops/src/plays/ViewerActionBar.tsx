/**
 * The points balance and its compliance disclaimer (earned only, never purchasable —
 * see the hackathon brief's rules on channel points). Play participation itself now
 * lives in the pinned prediction card in chat (see PredictionCard), so this bar no
 * longer duplicates that with its own mode-specific buttons.
 */
export default function ViewerActionBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kick-border bg-kick-panel px-4 py-3">
      <div className="text-[12px] leading-tight">
        <div className="font-bold text-kick-text">
          2,450 pts <span className="font-normal text-kick-muted">· earned by watching</span>
        </div>
        <div className="text-[10px] text-kick-muted">earned channel points only — never purchasable value</div>
      </div>
    </div>
  )
}
