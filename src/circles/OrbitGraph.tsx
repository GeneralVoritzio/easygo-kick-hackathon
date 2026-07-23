import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

/**
 * Interactive Circles orbit map (mock data). Click a Circle → its live streams
 * fan out with a pop animation and the camera glides. Click a stream → /stream
 * (the prebuilt Kick clone). Self-contained: no store, no backend.
 */

type StreamInfo = { id: string; streamer: string; category: string; viewers: number; live: boolean; hue: number }
type CircleInfo = {
  id: string
  name: string
  members: number
  heat: number
  live: boolean
  angle: number // degrees on the orbit ring
  affinity: number
  streams: StreamInfo[]
}

const CIRCLES: CircleInfo[] = [
  {
    id: 'irl-chaos', name: 'IRL Chaos Circle', members: 2140, heat: 92, live: true, angle: -90, affinity: 0.82,
    streams: [
      { id: 'hypeking', streamer: 'HypeKing', category: 'Just Chatting', viewers: 1247, live: true, hue: 100 },
      { id: 'clavicular', streamer: 'Clavicular', category: 'IRL', viewers: 8210, live: true, hue: 10 },
      { id: 'n3on', streamer: 'N3on', category: 'IRL', viewers: 12490, live: true, hue: 265 },
    ],
  },
  {
    id: 'clip-hunters', name: 'Clip Hunters', members: 3720, heat: 57, live: true, angle: 30, affinity: 0.41,
    streams: [
      { id: 'clipgoblin', streamer: 'ClipGoblin', category: 'GTA V', viewers: 1842, live: true, hue: 25 },
      { id: 'framefarmer', streamer: 'FrameFarmer', category: 'Valorant', viewers: 3204, live: true, hue: 190 },
      { id: 'vodwitch', streamer: 'VodWitch', category: 'Variety', viewers: 977, live: true, hue: 300 },
      { id: 'reelraider', streamer: 'ReelRaider', category: 'Minecraft', viewers: 512, live: true, hue: 140 },
    ],
  },
  {
    id: 'late-night', name: 'Late Night Watchers', members: 1385, heat: 31, live: false, angle: 150, affinity: 0.57,
    streams: [
      { id: 'sleepercell', streamer: 'SleeperCell', category: 'Chess', viewers: 431, live: true, hue: 330 },
      { id: 'moonmoth', streamer: 'MoonMoth', category: 'Music', viewers: 0, live: false, hue: 210 },
      { id: 'placeholder1', streamer: 'PlaceholderCreator1', category: 'Slots', viewers: 0, live: false, hue: 45 },
    ],
  },
]

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return { x: r * Math.cos(a), y: r * Math.sin(a) }
}

const HiddenHandles = () => (
  <>
    <Handle type="target" position={Position.Top} className="!pointer-events-none !opacity-0" />
    <Handle type="source" position={Position.Bottom} className="!pointer-events-none !opacity-0" />
  </>
)

function UserNode(_: NodeProps) {
  return (
    <div className="relative grid h-20 w-20 place-items-center rounded-full bg-kick text-[12px] font-black text-black shadow-[0_0_40px_rgba(83,252,24,0.45)]">
      YOU
      <span className="absolute -bottom-6 whitespace-nowrap text-[11px] font-semibold text-kick-text">SpookyBunny</span>
      <HiddenHandles />
    </div>
  )
}

function CircleNode({ data }: NodeProps) {
  const c = data as unknown as CircleInfo & { expanded: boolean }
  const glow = c.live ? Math.round(10 + c.heat * 0.5) : 4
  return (
    <div
      className={`grid h-32 w-32 cursor-pointer place-items-center rounded-full border-2 bg-kick-panel text-center transition-all hover:scale-105 ${
        c.expanded ? 'border-kick' : c.live ? 'border-kick/50' : 'border-kick-border'
      }`}
      style={{ boxShadow: `0 0 ${glow}px rgba(83,252,24,${c.live ? 0.5 : 0.15})` }}
    >
      <div className="px-2">
        <div className="text-[12px] font-bold leading-tight">{c.name}</div>
        <div className="mt-1 text-[10px] text-kick-muted">{c.members.toLocaleString()} members</div>
        <div className={`mt-1 text-[10px] font-semibold ${c.live ? 'text-kick' : 'text-kick-muted'}`}>
          {c.live ? '● LIVE' : 'quiet'} · {c.heat}°
        </div>
      </div>
      <HiddenHandles />
    </div>
  )
}

function StreamNode({ data }: NodeProps) {
  const s = data as unknown as StreamInfo & { delay: number }
  return (
    <div
      className="w-44 cursor-pointer overflow-hidden rounded-lg border border-kick-border bg-kick-panel transition-all hover:border-kick hover:shadow-[0_0_18px_rgba(83,252,24,0.3)]"
      style={{ animation: `pop 0.35s cubic-bezier(0.16,1,0.3,1) ${s.delay}ms both` }}
    >
      <div
        className="relative h-16"
        style={{ background: `linear-gradient(135deg, hsl(${s.hue} 70% 30%), hsl(${(s.hue + 60) % 360} 70% 16%))` }}
      >
        {s.live ? (
          <span className="absolute left-1.5 top-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>
        ) : (
          <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-kick-muted">OFFLINE</span>
        )}
        {s.live && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-kick-text">
            {s.viewers.toLocaleString()} watching
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[12px] font-bold">{s.streamer}</div>
        <div className="text-[10px] text-kick-muted">{s.category}</div>
      </div>
      <HiddenHandles />
    </div>
  )
}

const nodeTypes = { user: UserNode, circle: CircleNode, stream: StreamNode }

function Graph() {
  const navigate = useNavigate()
  const { fitView } = useReactFlow()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [{ id: 'user', type: 'user', position: { x: -40, y: -40 }, data: {}, draggable: false }]
    const edges: Edge[] = []
    for (const c of CIRCLES) {
      const p = polar(340, c.angle)
      nodes.push({
        id: c.id, type: 'circle',
        position: { x: p.x - 64, y: p.y - 64 },
        data: { ...c, expanded: expandedId === c.id } as unknown as Record<string, unknown>,
        draggable: false,
      })
      edges.push({
        id: `user-${c.id}`, source: 'user', target: c.id,
        animated: c.live,
        style: { stroke: '#53fc18', strokeOpacity: 0.15 + c.affinity * 0.4, strokeWidth: 1.5 + c.affinity * 2.5 },
      })
      if (expandedId === c.id) {
        c.streams.forEach((s, j) => {
          const fan = c.angle + (j - (c.streams.length - 1) / 2) * 42
          const sp = polar(320, fan)
          nodes.push({
            id: s.id, type: 'stream',
            position: { x: p.x + sp.x - 88, y: p.y + sp.y - 40 },
            data: { ...s, delay: j * 90 } as unknown as Record<string, unknown>,
            draggable: false,
          })
          edges.push({
            id: `${c.id}-${s.id}`, source: c.id, target: s.id,
            animated: s.live,
            style: { stroke: '#53fc18', strokeOpacity: 0.5, strokeWidth: 1.5 },
          })
        })
      }
    }
    return { nodes, edges }
  }, [expandedId])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.25}
      maxZoom={1.6}
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => {
        if (node.type === 'circle') {
          setExpandedId((v) => (v === node.id ? null : node.id))
          setTimeout(() => fitView({ duration: 650, padding: 0.2 }), 40)
        } else if (node.type === 'stream') {
          navigate('/stream')
        }
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={30} size={1.5} color="#1f1f1f" />
    </ReactFlow>
  )
}

export default function OrbitGraph() {
  return (
    <ReactFlowProvider>
      <Graph />
    </ReactFlowProvider>
  )
}
