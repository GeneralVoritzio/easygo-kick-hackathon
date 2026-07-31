import { Audio, Video } from "@remotion/media";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
} from "remotion";
import { ensureFonts } from "./fonts";

export const FPS = 24;

// Measured from the track on 31 July 2026: 91.94 bpm, first beat at 0.0 s, no
// lead silence to trim. Four beats run 63 frames at 24 fps.
const STING_FRAMES = 63;

// One second of the clip's own sound, then the beat and the title land together.
const MUSIC_IN = 1 * FPS;
const TAGLINE_FROM = 10 * FPS;

const CLIP_FRAMES = Math.floor(15.0417 * FPS);
const ENDING_FRAMES = Math.floor(3.6687 * FPS);

export const TOTAL_FRAMES = CLIP_FRAMES + ENDING_FRAMES;

// One beat of the song at the measured 91.94 bpm.
const BEAT_FRAMES = Math.round((60 / 91.94) * FPS);

function Title() {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: "CSMoza, sans-serif",
          fontSize: 500,
          lineHeight: 0.78,
          letterSpacing: "-0.02em",
          color: "#ffffff",
          whiteSpace: "nowrap",
          textAlign: "center",
          transform: "translateY(30px) scaleY(1.18)",
        }}
      >
        <span style={{ display: "block" }}>SAME</span>
        <span style={{ display: "block" }}>STREAM</span>
      </div>
    </AbsoluteFill>
  );
}

function Tagline({ full }: { full: boolean }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        alignItems: "center",
        justifyContent: "center",
        gap: 42,
      }}
    >
      <span
        style={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1,
          color: "#ffffff",
        }}
      >
        Multiview.
      </span>
      <span
        style={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1,
          color: "#ffffff",
          opacity: full ? 1 : 0,
        }}
      >
        Never miss a moment again.
      </span>
    </AbsoluteFill>
  );
}

export function Teaser() {
  const [fontsHandle] = useState(() => delayRender("fonts"));

  useEffect(() => {
    ensureFonts().finally(() => continueRender(fontsHandle));
  }, [fontsHandle]);

  const tailFrames = CLIP_FRAMES - TAGLINE_FROM;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={CLIP_FRAMES}>
        <Video
          src={staticFile("clip.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Sequence>
      <Sequence from={MUSIC_IN} durationInFrames={STING_FRAMES}>
        <Title />
        <Audio src={staticFile("music.mp3")} />
      </Sequence>
      <Sequence from={TAGLINE_FROM} durationInFrames={BEAT_FRAMES}>
        <Tagline full={false} />
      </Sequence>
      <Sequence from={TAGLINE_FROM + BEAT_FRAMES} durationInFrames={tailFrames - BEAT_FRAMES}>
        <Tagline full />
      </Sequence>
      <Sequence from={TAGLINE_FROM} durationInFrames={tailFrames}>
        {/* The music returns where it paused, so the line lands on a downbeat. */}
        <Audio
          src={staticFile("music.mp3")}
          trimBefore={STING_FRAMES}
          volume={(f) =>
            interpolate(f, [tailFrames - 14, tailFrames - 2], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      </Sequence>
      <Sequence from={CLIP_FRAMES} durationInFrames={ENDING_FRAMES}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <Video
            src={staticFile("ending.mp4")}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
