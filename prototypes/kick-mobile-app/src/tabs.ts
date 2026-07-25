export const TABS = ['community', 'home', 'profile'] as const;
export type Tab = (typeof TABS)[number];
