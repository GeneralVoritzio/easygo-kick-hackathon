// Trim points come from whisper (model base, word timestamps), run 30 July 2026.
// Speech starts at 0.0 in every clip, so only the tail gets cut: last word end
// plus a short breath. The files are copies from ~/Downloads, see the README.
export type Clip = { file: string; line: string; endSeconds: number };

export const clips: Clip[] = [
  { file: "clips/so-lets-trade.mp4", line: "So let's trade.", endSeconds: 1.0 },
  { file: "clips/lets-trade.mp4", line: "Let's trade.", endSeconds: 0.72 },
  { file: "clips/lets-trade-2.mp4", line: "Let's trade.", endSeconds: 0.86 },
  { file: "clips/ok-then-lets-trade.mp4", line: "OK, then, let's trade.", endSeconds: 0.92 },
  { file: "clips/come-on-come-on-lets-trade.mp4", line: "Come on, come on, let's trade!", endSeconds: 1.56 },
  { file: "clips/fine-wayne-lets-trade.mp4", line: "Fine, Wayne, let's trade!", endSeconds: 1.84 },
  { file: "clips/all-right-lets-trade-them.mp4", line: "All right, let's trade them.", endSeconds: 1.15 },
  { file: "clips/son-i-tell-you-what-lets-trade.mp4", line: "Son, I tell you what, let's trade!", endSeconds: 2.62 },
];
