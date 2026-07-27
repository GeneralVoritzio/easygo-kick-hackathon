import { forwardRef, type ReactNode, type RefObject } from 'react'

/**
 * Shared chrome for the Plays modals (ManagePlayModal, ChooseOutcomeModal), matching
 * the scrim, panel, button and badge styling set by StartPlayModal.tsx.
 */

export function ModalScrim({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
    </div>
  )
}

export function ModalPanel({
  labelledBy,
  maxWidthPx = 460,
  children,
}: {
  labelledBy: string
  maxWidthPx?: number
  children: ReactNode
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="w-full rounded-lg bg-[#16181b] p-6 shadow-2xl"
      style={{ maxWidth: maxWidthPx }}
    >
      {children}
    </div>
  )
}

export const ModalCloseButton = forwardRef<HTMLButtonElement, { onClose: () => void }>(
  function ModalCloseButton({ onClose }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="shrink-0 text-xl leading-none text-kick-muted transition-colors hover:text-white"
      >
        ✕
      </button>
    )
  },
)

export function ModalHeader({
  id,
  title,
  onClose,
  closeRef,
}: {
  id: string
  title: string
  onClose: () => void
  closeRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <h2 id={id} className="text-[22px] font-bold leading-tight text-white">
        {title}
      </h2>
      <ModalCloseButton ref={closeRef} onClose={onClose} />
    </div>
  )
}

export function PlainTextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold text-kick-muted transition-colors hover:text-white"
    >
      {children}
    </button>
  )
}

export function GreenPillButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-kick px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-kick-dim disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function GreyPillButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-[#3a3f45] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#454b52]"
    >
      {children}
    </button>
  )
}

/** 1 = kick-green with a black numeral, 2 = salmon with a dark numeral */
export function OptionBadge({ index }: { index: 0 | 1 }) {
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        index === 0 ? 'bg-kick text-black' : 'bg-[#f8a0a0] text-black'
      }`}
    >
      {index + 1}
    </span>
  )
}
