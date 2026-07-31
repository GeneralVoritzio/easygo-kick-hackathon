export const TABS = ['discover', 'home', 'profile'] as const;
export type Tab = (typeof TABS)[number];
