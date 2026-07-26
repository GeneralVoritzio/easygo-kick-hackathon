/** ?mock=1 (or ?mock=0) in the URL always wins over the VITE_USE_MOCK build-time default. */
export function isMockMode(): boolean {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('mock');
    if (param === '1' || param === 'true') return true;
    if (param === '0' || param === 'false') return false;
  }
  return import.meta.env.VITE_USE_MOCK === 'true';
}
