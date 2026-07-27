/** chunky stepped pixel L-bracket, matching the house style seen on RouletteOverlay */
function PixelCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M0 0h9v3H3v6H0z" />
      <rect x="5" y="5" width="3" height="3" />
    </svg>
  )
}

/** four pixel brackets framing the parent card. Parent must be `relative overflow-visible`. */
export default function PixelFrame() {
  return (
    <>
      <PixelCorner className="absolute -left-1 -top-1 h-5 w-5 text-kick" />
      <PixelCorner className="absolute -right-1 -top-1 h-5 w-5 rotate-90 text-kick" />
      <PixelCorner className="absolute -bottom-1 -right-1 h-5 w-5 rotate-180 text-kick" />
      <PixelCorner className="absolute -bottom-1 -left-1 h-5 w-5 -rotate-90 text-kick" />
    </>
  )
}
