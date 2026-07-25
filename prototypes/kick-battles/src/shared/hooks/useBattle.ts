import { useEffect, useState } from 'react';
import type { BattleState, ConnectionStatus, ContributionEvent, WsMessage } from '../types';
import { createMockBattle, createMockContributionEvent, tickMockBattleScores } from '../mock/mockData';
import { isMockMode } from './useMockMode';

export interface BattleEvent extends ContributionEvent {
  id: string;
}

interface UseBattleResult {
  battle: BattleState | null;
  events: BattleEvent[];
  status: ConnectionStatus;
}

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15000;
const MOCK_SCORE_TICK_MS = 1500;
const MOCK_EVENT_MIN_MS = 1800;
const MOCK_EVENT_MAX_MS = 3600;
/** How long the mock battle stays in `'starting'` before going `'live'`. */
const MOCK_STARTING_DURATION_MS = 5000;
/** How long a contribution event stays mounted for its flight + impact + fade. */
const EVENT_TTL_MS = 1600;

/**
 * Live state for the multi-streamer battle overlay: the running score per
 * competitor (`battle_update`) plus a rolling list of individual
 * contribution events (`contribution_event`) for the flying-label effect.
 * Falls back to a generated mock battle + mock event stream so the overlay
 * is fully renderable before the real event stream exists.
 */
export function useBattle(): UseBattleResult {
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const pushEvent = (event: ContributionEvent) => {
      const id = `${event.streamerId}-${event.timestamp}-${Math.random().toString(36).slice(2, 8)}`;
      setEvents((prev) => [...prev, { ...event, id }]);
      window.setTimeout(() => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }, EVENT_TTL_MS);
    };

    if (isMockMode()) {
      setStatus('mock');

      const initial = createMockBattle();
      setBattle(initial);
      const streamerIds = initial.sides.flatMap((side) => side.streamers.map((s) => s.streamerId));

      const goLiveTimer = window.setTimeout(() => {
        setBattle((prev) => (prev ? { ...prev, status: 'live' } : prev));
      }, MOCK_STARTING_DURATION_MS);

      const scoreInterval = window.setInterval(() => {
        setBattle((prev) => (prev && prev.status === 'live' ? tickMockBattleScores(prev) : prev));
      }, MOCK_SCORE_TICK_MS);

      let eventTimer: number;
      const scheduleEvent = () => {
        const delay = MOCK_EVENT_MIN_MS + Math.random() * (MOCK_EVENT_MAX_MS - MOCK_EVENT_MIN_MS);
        eventTimer = window.setTimeout(() => {
          pushEvent(createMockContributionEvent(streamerIds));
          scheduleEvent();
        }, delay);
      };
      const eventStartTimer = window.setTimeout(scheduleEvent, MOCK_STARTING_DURATION_MS);

      return () => {
        window.clearTimeout(goLiveTimer);
        window.clearInterval(scoreInterval);
        window.clearTimeout(eventTimer);
        window.clearTimeout(eventStartTimer);
      };
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let reconnectDelay = RECONNECT_BASE_DELAY_MS;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setStatus('connecting');
      ws = new WebSocket(import.meta.env.VITE_WS_URL);

      ws.onopen = () => {
        reconnectDelay = RECONNECT_BASE_DELAY_MS;
        setStatus('open');
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as WsMessage;
          if (message.type === 'battle_update') setBattle(message.payload);
          if (message.type === 'contribution_event') pushEvent(message.payload);
        } catch {
          // Ignore malformed frames rather than crashing the overlay.
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setStatus('closed');
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY_MS);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { battle, events, status };
}
