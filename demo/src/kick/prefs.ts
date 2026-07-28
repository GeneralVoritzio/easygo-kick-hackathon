import { useEffect, useState } from "react";

export type Prefs = {
  hidePools: boolean;
  hideSlots: boolean;
  hideVrChat: boolean;
  joinTanks: boolean;
  autoRaid: boolean;
};

const KEY = "kick-preferences";
const CHANGED = "kick-preferences-changed";

// Section 11: the two raid toggles and the three content toggles are all on or off by default,
// and they now persist.
const defaults: Prefs = {
  hidePools: false,
  hideSlots: false,
  hideVrChat: false,
  joinTanks: true,
  autoRaid: true,
};

export function readPrefs(): Prefs {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return defaults;
  }
}

// Section 5.4: a viewer is never auto-carried into a category they hid.
export function isHidden(categorySlug: string, prefs: Prefs) {
  if (categorySlug === "pools-hot-tubs-and-bikinis") return prefs.hidePools;
  if (categorySlug === "slots-casino") return prefs.hideSlots;
  if (categorySlug === "vr-chat") return prefs.hideVrChat;
  return false;
}

export function usePrefs() {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    const sync = () => setPrefs(readPrefs());
    window.addEventListener(CHANGED, sync);
    return () => window.removeEventListener(CHANGED, sync);
  }, []);

  function update(patch: Partial<Prefs>) {
    const next = { ...readPrefs(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGED));
    setPrefs(next);
  }

  return [prefs, update] as const;
}
