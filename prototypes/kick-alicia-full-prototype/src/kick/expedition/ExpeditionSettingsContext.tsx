import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ExpeditionSettingsContextValue = {
  notifyOnDeparture: boolean;
  setNotifyOnDeparture: (on: boolean) => void;
};

const ExpeditionSettingsContext = createContext<ExpeditionSettingsContextValue | null>(null);

/*
  Whether the bottom-right "an expedition is about to depart" nudge (Home.tsx,
  ExpeditionPromptToast.tsx) is allowed to show at all. Global, like pins, so a choice made on
  the Preferences page still holds once you're back browsing the homepage.
*/
export function ExpeditionSettingsProvider({ children }: { children: ReactNode }) {
  const [notifyOnDeparture, setNotifyOnDeparture] = useState(true);

  const value = useMemo<ExpeditionSettingsContextValue>(
    () => ({ notifyOnDeparture, setNotifyOnDeparture }),
    [notifyOnDeparture],
  );

  return <ExpeditionSettingsContext.Provider value={value}>{children}</ExpeditionSettingsContext.Provider>;
}

export function useExpeditionSettings(): ExpeditionSettingsContextValue {
  const ctx = useContext(ExpeditionSettingsContext);
  if (!ctx) throw new Error("useExpeditionSettings must be used within ExpeditionSettingsProvider");
  return ctx;
}
