import { useEffect, useState } from 'react';
import type { KickPassport } from '../types';
import { createMockPassport } from '../mock/mockData';

interface UseKickPassportResult {
  passport: KickPassport | null;
  loading: boolean;
}

/**
 * Kick Communities is a new pitch with no backend contract yet — this is
 * mock-only so /community's passport tab is renderable for the concept
 * demo. Once a real `/api/passport` endpoint exists this should follow the
 * same REST-with-mock-fallback shape as usePreStreamReport.
 */
export function useKickPassport(): UseKickPassportResult {
  const [passport, setPassport] = useState<KickPassport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (cancelled) return;
      setPassport(createMockPassport());
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { passport, loading };
}
