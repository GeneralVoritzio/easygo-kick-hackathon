import { useEffect } from 'react'
import { useInteraction } from './interactionStore'

/**
 * Tier-1 acknowledgement source: live transcript of streamer audio via the
 * Web Speech API (Chrome). Final utterances flow into onTranscript, where
 * verbatim username matching turns them into explicit AcknowledgementEvents.
 * No model to fail on stage — and the click-to-ack fallback stays available.
 */

type SpeechResult = { isFinal: boolean; 0: { transcript: string } }
type SpeechEvent = { resultIndex: number; results: { length: number; [i: number]: SpeechResult } }
type SpeechRec = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

export function useTranscript() {
  const enabled = useInteraction((s) => s.transcriptEnabled)

  useEffect(() => {
    if (!enabled) return
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Ctor) {
      useInteraction.getState().setTranscriptSupported(false)
      useInteraction.getState().setTranscriptEnabled(false)
      return
    }
    let cancelled = false
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) useInteraction.getState().onTranscript(r[0].transcript)
      }
    }
    // Chrome stops recognition after silence — keep it alive for the session
    rec.onend = () => {
      if (!cancelled) {
        try {
          rec.start()
        } catch {
          /* already restarting */
        }
      }
    }
    rec.onerror = () => {}
    try {
      rec.start()
    } catch {
      /* double-start */
    }
    return () => {
      cancelled = true
      rec.onend = null
      rec.stop()
    }
  }, [enabled])
}
