import { useEngine } from './store'

/**
 * Kick-shaped simulated crowd: chat messages, like bursts.
 * Rates scale with hype and go wild during a surge — the crowd is a system, not a loop.
 */

const USERS: { name: string; color: string }[] = [
  { name: 'xXNightRaverXx', color: '#f472b6' },
  { name: 'pogchampion', color: '#60a5fa' },
  { name: 'clipfarm3r', color: '#facc15' },
  { name: 'toastedGG', color: '#fb923c' },
  { name: 'lurkmaster99', color: '#a78bfa' },
  { name: 'kekw_enjoyer', color: '#34d399' },
  { name: 'streamsniper07', color: '#f87171' },
  { name: 'vibecheckerr', color: '#22d3ee' },
  { name: 'nochillzone', color: '#e879f9' },
  { name: 'ratioed_again', color: '#fbbf24' },
]

const CASUAL = [
  'yo this stream is cracked',
  'W streamer',
  'lmaooo',
  'anyone else lagging?',
  'first time here, vibes are good',
  'KEKW',
  'clip that',
  'chat is moving fast today',
  'GG',
  'what rank are you now?',
  'hi from brazil 🇧🇷',
  'POGGERS',
  'this is content',
  'no shot',
  'actually insane',
]

const HYPE_MSGS = [
  'LETS GOOO 🔥🔥🔥',
  'HYPE HYPE HYPE',
  'THE HAT THE HAT',
  'KEEP IT ON KEEP IT ON',
  'W SPONSOR W SPONSOR',
  'PUMP THE TIMER 📈',
  'DONT LET IT DIE',
  '🔥🔥🔥🔥🔥',
  'EXTEND IT CHAT',
  'THIS IS CINEMA',
  'MORE MORE MORE',
  'CROWD CARRYING RN',
]

const SPONSOR_REACT = [
  'yooo a sponsor drop??',
  'drip check 🧢',
  'that prop is clean ngl',
  'brands really in the chat now',
  'W brand honestly',
  'keep the hype up or it disappears chat',
]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function startMockEvents(): () => void {
  const timers: ReturnType<typeof setTimeout>[] = []
  let stopped = false

  const chatLoop = () => {
    if (stopped) return
    const { addChat, surgeUntil, hype, activeSlot } = useEngine.getState()
    const surging = Date.now() < surgeUntil
    const user = pick(USERS)
    const pool = surging || hype.score > 0.55 ? HYPE_MSGS : activeSlot && Math.random() < 0.35 ? SPONSOR_REACT : CASUAL
    addChat(user.name, pick(pool), user.color)
    // surge: firehose; hype warm: brisk; idle: ambient
    const delay = surging ? 90 + Math.random() * 120 : hype.score > 0.4 ? 350 + Math.random() * 400 : 900 + Math.random() * 1400
    timers.push(setTimeout(chatLoop, delay))
  }

  const likeLoop = () => {
    if (stopped) return
    const { addLikes, surgeUntil, hype } = useEngine.getState()
    const surging = Date.now() < surgeUntil
    if (surging) addLikes(6 + Math.floor(Math.random() * 10))
    else if (Math.random() < 0.35 + hype.score * 0.5) addLikes(1 + Math.floor(Math.random() * 3))
    timers.push(setTimeout(likeLoop, surging ? 250 : 700))
  }

  // fan reactions when a prop goes live
  const unsub = useEngine.subscribe((s, prev) => {
    if (s.activeSlot && s.activeSlot !== prev.activeSlot && prev.activeSlot === null) {
      for (let i = 0; i < 3; i++) {
        timers.push(
          setTimeout(() => {
            if (stopped) return
            const u = pick(USERS)
            useEngine.getState().addChat(u.name, pick(SPONSOR_REACT), u.color)
          }, 400 + i * 600),
        )
      }
    }
  })

  chatLoop()
  likeLoop()

  return () => {
    stopped = true
    timers.forEach(clearTimeout)
    unsub()
  }
}

/** 10Hz engine tick — drives hype decay, velocities, and the slot state machine */
export function startEngineTick(): () => void {
  const id = setInterval(() => useEngine.getState().tick(Date.now()), 100)
  return () => clearInterval(id)
}
