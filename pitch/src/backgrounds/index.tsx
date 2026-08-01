import './backgrounds.css'

export function Flood() {
  return <div className="bg-flood" />
}

export function Pattern15() {
  return <div className="bg-pattern15" />
}

export function Halftone() {
  return (
    <div className="bg-flood">
      <div className="bg-halftone" />
    </div>
  )
}

export function Dark({ glow = true, crosses }: { glow?: boolean; crosses?: boolean }) {
  return (
    <div className="bg-dark">
      {glow && <div className="bg-glow" />}
      {crosses && <div className="bg-crosses" />}
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
