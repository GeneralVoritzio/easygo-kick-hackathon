import { usePlays } from './playsStore'

export default function VerifyPanel() {
  const play = usePlays((s) => s.play)
  const runVerify = usePlays((s) => s.runVerify)
  const verify = usePlays((s) => s.verify)

  return (
    <div className="border border-kick-border bg-black/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-bold text-kick-text">Recount it yourself</span>
        <button
          type="button"
          disabled={!play}
          onClick={runVerify}
          className="rounded bg-kick px-3 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim disabled:opacity-30"
        >
          ▶ Run verify
        </button>
      </div>

      {verify ? (
        <div className="space-y-1 font-mono text-[12px] text-kick-text">
          <div>{verify.chainOk ? '✓' : '✗'} chain rebuilt from log</div>
          <div>{verify.commitOk ? '✓' : '✗'} commitment matches revealed payload</div>
          <div>{verify.settleOk ? '✓' : '✗'} settlement recomputed</div>
          <div className="mt-1 text-kick-muted">{verify.note}</div>
          <div className="mt-2 text-[11px] leading-snug text-kick-muted">
            same inputs, same result — anyone can run this from the public log.
          </div>
        </div>
      ) : (
        <div className="font-mono text-[12px] text-kick-muted">run a round, close it, then recount it here.</div>
      )}
    </div>
  )
}
