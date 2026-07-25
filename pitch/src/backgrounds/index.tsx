import './backgrounds.css'

export function Flood() {
  return <div className="bg-flood" />
}

export function Halftone() {
  return (
    <div className="bg-flood">
      <div className="bg-halftone" />
    </div>
  )
}

export function Dark({ glow = true }: { glow?: boolean }) {
  return (
    <div className="bg-dark">
      {glow && <div className="bg-glow" />}
      <div className="bg-grain" />
      <div className="bg-vignette" />
    </div>
  )
}

export function Macroblock() {
  return (
    <div className="bg-dark">
      <div className="bg-blocks" />
      <div className="bg-grain" />
      <div className="bg-vignette" />
    </div>
  )
}
