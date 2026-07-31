import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { livestreams } from "../mock/api";
import { createEngine, type Engine, type EngineHost } from "./engine";
import type { EngineEvent } from "./events";

const EngineContext = createContext<Engine | null>(null);

const channelOf = (stream: (typeof livestreams)[number]) => ({
  username: stream.channel.username,
  verified: stream.channel.verified,
  viewers: stream.viewer_count,
});

const home = livestreams.find((stream) => stream.channel.slug === "ironvow") ?? livestreams[0];

const host: EngineHost = {
  ...channelOf(home),
  raiders: livestreams
    .filter((stream) => stream.is_live && stream.channel.slug !== home.channel.slug)
    .map(channelOf),
};

export function EngineProvider({ children }: { children: ReactNode }) {
  const engine = useMemo(() => createEngine(host), []);

  useEffect(() => {
    engine.start();
    return () => engine.stop();
  }, [engine]);

  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error("useEngine needs an EngineProvider");
  return engine;
}

export function useEngineEvents(onEvent: (event: EngineEvent) => void) {
  const engine = useEngine();
  const latest = useRef(onEvent);
  latest.current = onEvent;

  useEffect(() => engine.listen({ onEvent: (event) => latest.current(event) }), [engine]);
}

export function useEngineState() {
  const engine = useEngine();
  const [state, setState] = useState(() => engine.state());

  useEffect(() => engine.listen({ onState: setState }), [engine]);

  return state;
}
