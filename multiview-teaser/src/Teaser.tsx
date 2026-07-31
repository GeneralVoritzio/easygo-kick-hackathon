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
// lead silence to trim. Four beats end at 2.610 s, frame 63.
const STING_FRAMES = 63;

const CLIP_FRAMES = Math.floor(10.0417 * FPS);
const END_FRAMES = 96;

export const TOTAL_FRAMES = CLIP_FRAMES + END_FRAMES;

const INK = "#0b0b0c";
const GREEN = "#53fc18";

function TitleShot() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Video
        src={staticFile("clip.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <Sequence durationInFrames={STING_FRAMES}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <span
            style={{
              fontFamily: "KickFont, sans-serif",
              fontSize: 500,
              lineHeight: 1,
              color: GREEN,
              opacity: 0.88,
              whiteSpace: "nowrap",
            }}
          >
            KICK
          </span>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}

function EndCard() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: INK,
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
          opacity: 0.85,
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

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Sequence durationInFrames={CLIP_FRAMES}>
        <TitleShot />
      </Sequence>
      <Sequence durationInFrames={STING_FRAMES}>
        <Audio src={staticFile("music.mp3")} />
      </Sequence>
      <Sequence from={CLIP_FRAMES} durationInFrames={END_FRAMES}>
        <EndCard />
        {/* The music returns where it paused, so the line lands on the next
            downbeat. */}
        <Audio
          src={staticFile("music.mp3")}
          trimBefore={STING_FRAMES}
          volume={(f) =>
            interpolate(f, [END_FRAMES - 16, END_FRAMES - 2], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      </Sequence>
    </AbsoluteFill>
  );
}
