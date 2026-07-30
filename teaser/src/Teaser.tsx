import { Video } from "@remotion/media";
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

export const FPS = 30;
const INTRO_FRAMES = 132;
const END_FRAMES = 78;

const clipFrames = (clip: Clip) => Math.round(clip.endSeconds * FPS);

export const TOTAL_FRAMES =
  INTRO_FRAMES + clips.reduce((sum, clip) => sum + clipFrames(clip), 0) + END_FRAMES;

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
  const t = interpolate(frame - delay, [0, 8], [0, 1], {
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

function Intro() {
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Sequence durationInFrames={54}>
        <IntroBeat lines={"Watched for hours.\nEarned nothing."} size={120} />
      </Sequence>
      <Sequence from={54} durationInFrames={36}>
        <IntroBeat lines={"Not anymore."} size={120} />
      </Sequence>
      <Sequence from={90} durationInFrames={INTRO_FRAMES - 90}>
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

export function Teaser() {
  let at = INTRO_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
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
    </AbsoluteFill>
  );
}
