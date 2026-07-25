import { Dark, Flood, Halftone, Macroblock } from '../backgrounds'
import { Frame, HeroStat, Slide, Split, Stack, Wordmark } from '../components'
import { ChannelBar, ChatPeek, DecisionCard, TimelineTrack } from '../mock'
import { beats, channel } from '../mock/fixture'
import { team } from './team'

export function Cold() {
  return (
    <Slide centre notes="Matt. Say the line, then stop. Let it sit for two seconds before you advance." background={<Dark glow={false} />}>
      <p className="display h2" data-anim="riseIn">
        Chat already told you.
      </p>
      <p className="caption" data-anim="riseIn">
        It just could not tell you fast enough.
      </p>
    </Slide>
  )
}

export function Hook() {
  return (
    <Slide onFlood notes="Matt. Name the product once. Do not explain it yet." background={<Halftone />}>
      <p className="label" data-anim="riseIn">
        Easygo Mini Hackathon, powered by KICK
      </p>
      <Stack lines={['Every stream', 'writes its own', 'timeline']} />
      <p className="body" data-anim="riseIn">
        kick-timelines. A companion UI that records a live stream while it happens.
      </p>
    </Slide>
  )
}

export function Problem() {
  return (
    <Slide
      notes="Name the user out loud. ClutchGoblin is in our fixture, so the demo matches this slide. Add the other two users yourself: a viewer who opens a four hour replay cannot find the good part, and a mod who saw the moment cannot mark it so it survives the stream."
      background={<Dark />}
    >
      <p className="label" data-anim="riseIn">
        The problem
      </p>
      <h1 className="display h1" data-anim="riseIn">
        Four hours of signal,
        <br />
        then nothing
      </h1>
      <p className="body" data-anim="riseIn">
        {channel.username} lost 15.3% of the room at 02:41. Nobody could tell him why.
      </p>
    </Slide>
  )
}

export function Fix() {
  return (
    <Slide notes="One sentence. Then advance. Do not list features here, the demo does that." background={<Dark />}>
      <p className="label" data-anim="riseIn">
        The fix
      </p>
      <h1 className="display h1" data-anim="riseIn">
        We record it
        <br />
        while it happens
      </h1>
      <p className="body" data-anim="riseIn">
        One timeline. Viewers find the peaks. Streamers see what each decision cost.
      </p>
    </Slide>
  )
}

export function Demo() {
  return (
    <Slide
      notes="Hand off to the running build now. Do not narrate the UI. Trigger the raid beat at 01:05, then the category change at 02:41."
      background={<Dark glow={false} />}
    >
      <Frame bleed tag="LIVE BUILD">
        <ChannelBar />
        <TimelineTrack />
      </Frame>
      <p className="caption" data-anim="riseIn">
        Switch to the running app. This frame is the handoff, not the demo.
      </p>
    </Slide>
  )
}

export function Wow() {
  return (
    <Slide notes="Trigger the 5,000 kicks gift live. The peak draws itself. Say nothing while it draws." background={<Macroblock />}>
      <p className="label" data-anim="riseIn">
        The loudest moment, 03:29
      </p>
      <HeroStat value="5,000" label="kicks from BigYoshi_AU" />
      <Frame tag="MOCK">
        <ChatPeek />
      </Frame>
      <p className="caption" data-anim="riseIn">
        The preview shows the chat that caused it.
      </p>
    </Slide>
  )
}

export function HowItWorks() {
  return (
    <Slide
      notes={
        'Say the mock-data line out loud, in full: same interface, live client behind it, and we run the demo on a deterministic fixture so we can show you a 3,000 person raid on cue. ' +
        'Then the labels: kick is surface KICK publishes, fake-kick is surface we invented, and the app shows the same labels in its Data sources tab. ' +
        'This is the slide the engineering managers care about.'
      }
      background={<Dark />}
    >
      <p className="label" data-anim="riseIn">
        How it works
      </p>
      <Split
        left={
          <>
            <h3 className="h3" data-anim="riseIn">
              A recording, not a fetch
            </h3>
            <p className="body" data-anim="riseIn">
              KICK has no VOD resource. We record webhooks against started_at.
            </p>
          </>
        }
        right={
          <Frame tag="MOCK">
            <DecisionCard />
          </Frame>
        }
      />
    </Slide>
  )
}

export function Native() {
  return (
    <Slide notes="Why KICK and not somewhere else. Keep it to three beats." background={<Dark />}>
      <p className="label" data-anim="riseIn">
        Why it belongs on KICK
      </p>
      <h1 className="display h2" data-anim="riseIn">
        From every angle,
        <br />
        for the whole room
      </h1>
      <Split
        left={
          <>
            <p className="body" data-anim="riseIn">
              Kicks are a KICK primitive. A 5,000 kicks gift is a peak no other platform can even
              describe, and `pinned_time_seconds` puts it on the track for free.
            </p>
            <p className="body" data-anim="riseIn">
              Every overlay element exports as its own browser source, so it reaches every platform
              a KICK streamer simulcasts to.
            </p>
          </>
        }
        right={
          <>
            {beats.map((beat) => (
              <div className="stat" key={beat.at} data-anim="riseIn">
                <span className="display h3 tabular">{beat.at}</span>
                <span className="label">{beat.label}</span>
                <span className="caption">{beat.detail}</span>
              </div>
            ))}
          </>
        }
      />
    </Slide>
  )
}

export function Team() {
  return (
    <Slide notes="Every member says their own line. Keep it to one sentence each." background={<Dark />}>
      <p className="label" data-anim="riseIn">
        Who built it
      </p>
      <h1 className="display h2" data-anim="riseIn">
        {team.length} people, one day
      </h1>
      <Split
        left={team.slice(0, 2).map((member) => (
          <div className="stat" key={member.name} data-anim="riseIn">
            <span className="display h3">{member.name}</span>
            <span className="caption">{member.shipped}</span>
          </div>
        ))}
        right={team.slice(2).map((member) => (
          <div className="stat" key={member.name} data-anim="riseIn">
            <span className="display h3">{member.name}</span>
            <span className="caption">{member.shipped}</span>
          </div>
        ))}
      />
    </Slide>
  )
}

export function Close() {
  return (
    <Slide centre onFlood notes="Say the triad, then the ask, then stop talking." background={<Flood />}>
      <Wordmark size="lg" ink />
      <h1 className="display h1" data-anim="slamIn">
        Record it. Find it. Own it.
      </h1>
      <p className="body" data-anim="riseIn">
        kick-timelines. Give us the webhooks and we ship it.
      </p>
    </Slide>
  )
}
