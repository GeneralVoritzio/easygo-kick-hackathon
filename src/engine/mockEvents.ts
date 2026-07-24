import { useEngine } from './store'
import { pickSimAckCandidate, setRouletteAnnouncer, useInteraction } from './interactionStore'

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

// ── interaction-engine crowd shaping ──────────────────────────────────────
// the badge is a rate over hundreds of messages: it needs a returning-regulars
// population (USERS above) plus a first-timer trickle, or nothing is believable

const FT_ADJ = ['quiet', 'sleepy', 'shiny', 'salty', 'turbo', 'mellow', 'crispy', 'lucky']
const FT_NOUN = ['otter', 'goose', 'wizard', 'penguin', 'gremlin', 'raccoon', 'moth', 'pigeon']
const FIRST_TIMER_MSGS = [
  'first time here, this is great',
  'new follower, whats the schedule?',
  'how long have you been streaming?',
  'just found this stream, W vibes',
  'what mic do you use?',
  'longtime lurker first time chatting',
]

const DARES = [
  'speak in an accent for one minute',
  'do 10 pushups on camera',
  'let chat rename your next save file',
  'freestyle rap about the last game you lost',
  'hold a plank until the timer expires',
  'compliment the next 3 chatters by name',
  'attempt a magic trick with whatever is on your desk',
  'chug a beer', // gets filtered on arrival — the moderation demo beat
  'draw your own logo in 30 seconds',
  'say the alphabet backwards',
]

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

  // first-timer trickle: fresh names, one or two messages, some are questions
  const firstTimerLoop = () => {
    if (stopped) return
    const name = `${pick(FT_ADJ)}${pick(FT_NOUN)}${100 + Math.floor(Math.random() * 900)}`
    const color = pick(USERS).color
    useEngine.getState().addChat(name, pick(FIRST_TIMER_MSGS), color)
    if (Math.random() < 0.3) {
      timers.push(setTimeout(() => !stopped && useEngine.getState().addChat(name, 'this chat moves fast lol', color), 4000))
    }
    timers.push(setTimeout(firstTimerLoop, 15_000 + Math.random() * 20_000))
  }

  // simulated streamer reads: the baseline the live acks move on top of
  const simAckLoop = () => {
    if (stopped) return
    if (useInteraction.getState().simAcksEnabled) {
      const candidate = pickSimAckCandidate(Date.now(), Math.random() < 0.3)
      if (candidate) useInteraction.getState().ackMessage(candidate, 'explicit')
    }
    timers.push(setTimeout(simAckLoop, 6_000 + Math.random() * 8_000))
  }

  // crowd dares trickle into the roulette pool via the same chat path
  const dareLoop = () => {
    if (stopped) return
    const u = pick(USERS)
    useEngine.getState().addChat(u.name, `/interact ${pick(DARES)}`, u.color)
    timers.push(setTimeout(dareLoop, 25_000 + Math.random() * 20_000))
  }

  // KICKBot narrates roulette lifecycle into chat (submit / spin / outcome)
  setRouletteAnnouncer((text) => useEngine.getState().addChat('KICKBot', text, '#53fc18'))

  // seed a ~300-deep dare pool so every spin has real stakes (and no waiting):
  // distinct users (one entry each), varied pity-weights so odds read organic
  if (useInteraction.getState().pool.length < 250) {
    const now = Date.now()
    const seeds = Array.from({ length: 300 }, (_, i) => {
      const name = `${pick(FT_ADJ)}${pick(FT_NOUN)}${i}${Math.floor(Math.random() * 10)}`
      return {
        user_id: name.toLowerCase(),
        username: name,
        color: pick(USERS).color,
        text: pick(DARES.filter((d) => d !== 'chug a beer')),
        submitted_at: now - Math.floor(Math.random() * 300_000),
        rounds_waited: Math.random() < 0.35 ? Math.floor(Math.random() * 6) : 0,
      }
    })
    useInteraction.getState().seedDares(seeds)
  }

  chatLoop()
  likeLoop()
  firstTimerLoop()
  timers.push(setTimeout(simAckLoop, 3_000))
  timers.push(setTimeout(dareLoop, 5_000))

  return () => {
    stopped = true
    setRouletteAnnouncer(null)
    timers.forEach(clearTimeout)
    unsub()
  }
}

/** 10Hz engine tick — drives hype decay, velocities, the slot state machine,
 * and the interaction engine's rolling window + roulette round timer */
export function startEngineTick(): () => void {
  const id = setInterval(() => {
    const now = Date.now()
    useEngine.getState().tick(now)
    useInteraction.getState().tick(now, useEngine.getState().viewers)
  }, 100)
  return () => clearInterval(id)
}
