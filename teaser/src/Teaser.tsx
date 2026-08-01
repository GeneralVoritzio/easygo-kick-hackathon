import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { clips, type Clip } from "./clips";
import { GREEN, INK, Wordmark } from "./Wordmark";

// The source clips run at 23.976 fps. A 30 fps composition doubles their frames on
// an irregular cadence, which reads as jitter, so the whole piece runs at 24.
export const FPS = 24;
const INTRO_FRAMES = Math.round(4.4 * FPS);
const END_FRAMES = Math.round(2.6 * FPS);
const ENDING_FRAMES = Math.floor(3.2 * FPS);

const clipFrames = (clip: Clip) => Math.round(clip.endSeconds * FPS);

const MONTAGE_FRAMES = clips.reduce((sum, clip) => sum + clipFrames(clip), 0);

// The music stops here, because the ending clip carries its own audio.
const MUSIC_FRAMES = INTRO_FRAMES + MONTAGE_FRAMES + END_FRAMES;

export const TOTAL_FRAMES = MUSIC_FRAMES + ENDING_FRAMES;

// Brand Identity Section 6: the media curve, entrances under 300ms, animate in only.
const mediaEase = Easing.bezier(0.87, 0, 0.13, 1);

// Brand Identity Section 4: display type is ALL CAPS, leading 1.0, tracking normal.
const display: React.CSSProperties = {
  fontFamily: "Archivo, Inter, sans-serif",
  fontWeight: 800,
  textTransform: "uppercase",
  lineHeight: 1,
  letterSpacing: "normal",
  textAlign: "center",
  whiteSpace: "pre-line",
};

function RiseIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: mediaEase,
  });
  return (
    <div style={{ opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}>{children}</div>
  );
}

function IntroBeat({ lines, size }: { lines: string; size: number }) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 200 }}>
        <Wordmark height={72} colorway="green" />
      </div>
      <RiseIn>
        <div style={{ ...display, fontSize: size, color: "#ffffff" }}>{lines}</div>
      </RiseIn>
    </AbsoluteFill>
  );
}

const BEAT_1_FRAMES = Math.round(1.8 * FPS);
const BEAT_2_FRAMES = Math.round(1.2 * FPS);

function Intro() {
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Sequence durationInFrames={BEAT_1_FRAMES}>
        <IntroBeat lines={"Watched for hours.\nEarned nothing."} size={120} />
      </Sequence>
      <Sequence from={BEAT_1_FRAMES} durationInFrames={BEAT_2_FRAMES}>
        <IntroBeat lines={"Not anymore."} size={120} />
      </Sequence>
      <Sequence
        from={BEAT_1_FRAMES + BEAT_2_FRAMES}
        durationInFrames={INTRO_FRAMES - BEAT_1_FRAMES - BEAT_2_FRAMES}
      >
        <IntroBeat lines={"Card sets"} size={200} />
      </Sequence>
    </AbsoluteFill>
  );
}

function ClipFill({ clip }: { clip: Clip }) {
  return (
    <AbsoluteFill style={{ backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
      <Video
        src={staticFile(clip.file)}
        trimAfter={clipFrames(clip)}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </AbsoluteFill>
  );
}

// Brand Identity Section 3: one flood for the close, ink type on green, never white.
function EndCard() {
  return (
    <AbsoluteFill
      style={{ backgroundColor: GREEN, alignItems: "center", justifyContent: "center", gap: 64 }}
    >
      <RiseIn>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Wordmark height={72} colorway="ink" />
        </div>
      </RiseIn>
      <RiseIn delay={4}>
        <div style={{ ...display, fontSize: 140, color: INK }}>
          {"Complete the set.\nClaim the drop."}
        </div>
      </RiseIn>
    </AbsoluteFill>
  );
}

// The beat sits under the speech, lifts on the title cards, and fades out before
// the ending clip takes over with its own sound.
function musicVolume(frame: number) {
  const montageEnd = INTRO_FRAMES + MONTAGE_FRAMES;
  return interpolate(
    frame,
    [0, 10, INTRO_FRAMES - 2, INTRO_FRAMES + 2, montageEnd - 2, montageEnd + 2, MUSIC_FRAMES - 12, MUSIC_FRAMES],
    [0, 0.55, 0.55, 0.35, 0.35, 0.55, 0.55, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

export function Teaser() {
  let at = INTRO_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Sequence durationInFrames={MUSIC_FRAMES}>
        <Audio
          src={staticFile("music/whats-the-difference-instrumental.mp3")}
          volume={musicVolume}
        />
      </Sequence>
      <Sequence durationInFrames={INTRO_FRAMES}>
        <Intro />
      </Sequence>
      {clips.map((clip) => {
        const from = at;
        at += clipFrames(clip);
        return (
          <Sequence key={clip.file} from={from} durationInFrames={clipFrames(clip)}>
            <ClipFill clip={clip} />
          </Sequence>
        );
      })}
      <Sequence from={at} durationInFrames={END_FRAMES}>
        <EndCard />
      </Sequence>
      <Sequence from={MUSIC_FRAMES} durationInFrames={ENDING_FRAMES}>
        <AbsoluteFill
          style={{ backgroundColor: INK, alignItems: "center", justifyContent: "center" }}
        >
          <Video
            src={staticFile("clips/ending.mp4")}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
