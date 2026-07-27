import { useParams } from "react-router-dom";
import { livestreams, offlineChannels } from "../mock/api";
import { ChannelShell } from "../components/ChannelShell";

export function Channel() {
  const { slug } = useParams();
  const offline = offlineChannels.find((o) => o.channel.slug === slug);
  const stream =
    livestreams.find((s) => s.channel.slug === slug) ??
    livestreams.find((s) => s.channel.slug === "evscape") ??
    livestreams[0];

  return <ChannelShell stream={stream} active="home" offline={offline} />;
}
