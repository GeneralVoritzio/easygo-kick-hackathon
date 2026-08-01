import "./index.css";
import "./fonts";
import { Composition } from "remotion";
import { FPS, TOTAL_FRAMES, Teaser } from "./Teaser";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Teaser"
      component={Teaser}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
