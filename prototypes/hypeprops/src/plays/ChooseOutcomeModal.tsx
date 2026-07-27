import { useEffect, useRef, useState } from 'react'
import { useEscapeToClose } from './format'
import { GreenPillButton, ModalHeader, ModalPanel, ModalScrim, OptionBadge, PlainTextButton } from './ModalKit'
import { usePlays } from './playsStore'

const FALLBACK_OPTIONS = ['PASS', 'FAIL']

export default function ChooseOutcomeModal({ onClose }: { onClose: () => void }) {
  const play = usePlays((s) => s.play)
  const modResolve = usePlays((s) => s.modResolve)
  const [selected, setSelected] = useState<number | null>(null)

  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  useEscapeToClose(onClose)

  const options = play && play.options.length >= 2 ? play.options.slice(0, 2) : FALLBACK_OPTIONS
  const selectedName = selected !== null ? options[selected] : null

  function confirm() {
    if (selected === null) return
    modResolve(selected === 0 ? 'PASS' : 'FAIL')
    onClose()
  }

  return (
    <ModalScrim onClose={onClose}>
      <ModalPanel labelledBy="choose-outcome-title" maxWidthPx={460}>
        <ModalHeader id="choose-outcome-title" title="Choose outcome" onClose={onClose} closeRef={closeRef} />

        <div className="mb-2 text-[13px] text-kick-muted">Options</div>
        <div className="mb-4 space-y-2">
          {options.map((opt, i) => {
            const isSelected = selected === i
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setSelected(i)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-3 text-left transition-colors ${
                  isSelected ? 'bg-[#4a5058]' : 'bg-[#3a3f45] hover:bg-[#42474d]'
                }`}
              >
                <OptionBadge index={i === 0 ? 0 : 1} />
                <span className="flex-1 truncate text-sm font-bold text-white">{opt}</span>
                {isSelected && <span className="text-base font-bold text-white">✓</span>}
              </button>
            )
          })}
        </div>

        <p className="mb-4 text-[14px] leading-relaxed text-kick-muted">
          {selectedName
            ? `Are you sure "${selectedName}" is the correct outcome? Once you choose the outcome, viewers who backed it will be awarded channel points.`
            : 'Select the outcome that actually happened.'}
        </p>

        <p className="mb-6 text-[13px] leading-relaxed text-[#f87171]">
          You will not be able to reverse your choice and this will end the Play.
        </p>

        <div className="flex items-center justify-end gap-4">
          <PlainTextButton onClick={onClose}>Go back</PlainTextButton>
          <GreenPillButton onClick={confirm} disabled={selected === null}>
            Confirm outcome
          </GreenPillButton>
        </div>
        <p className="mt-3 text-center text-[11px] text-kick-muted">Logged to the Ref chain as a mod resolution.</p>
      </ModalPanel>
    </ModalScrim>
  )
}
