import { useEngineState } from "./EngineProvider";

const HOT = 1.2;

// A small mark that says this chat runs on our mock event engine. The dot turns green while a
// surge is running, so a reader can see the engine react.
export function EngineBadge() {
  const { multiplier } = useEngineState();
  const hot = multiplier > HOT;

  return (
    <span
      title="Chat and viewers run on the mock event engine"
      className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        hot ? "border-primary-base text-primary-base" : "border-outline-decorative text-subtle"
      }`}
    >
      <span className={`size-1.5 rounded-full ${hot ? "bg-primary-base" : "bg-subtle"}`} />
      Engine
    </span>
  );
}
