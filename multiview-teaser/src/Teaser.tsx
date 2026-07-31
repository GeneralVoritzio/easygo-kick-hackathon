import { Audio, Video } from "@remotion/media";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
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

export const TOTAL_FRAMES = CLIP_FRAMES;

const GREEN = "#53fc18";

function KickTitle() {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <span
        style={{
          fontFamily: "KickFont, sans-serif",
          fontSize: 500,
          lineHeight: 1,
          color: GREEN,
          whiteSpace: "nowrap",
        }}
      >
        KICK
      </span>
    </AbsoluteFill>
  );
}

function Tagline() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Img src={staticFile("kick-logo.svg")} style={{ height: 64 }} />
        <span
          style={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 84,
            lineHeight: 1,
            textTransform: "uppercase",
            color: "#ffffff",
          }}
        >
          Multiview.
        </span>
      </div>
      <span
        style={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 36,
          lineHeight: 1,
          textTransform: "uppercase",
          color: "#ffffff",
          opacity: 0.9,
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
      <Video
        src={staticFile("clip.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <Sequence from={MUSIC_IN} durationInFrames={STING_FRAMES}>
        <KickTitle />
        <Audio src={staticFile("music.mp3")} />
      </Sequence>
      <Sequence from={TAGLINE_FROM} durationInFrames={tailFrames}>
        <Tagline />
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
    </AbsoluteFill>
  );
}
