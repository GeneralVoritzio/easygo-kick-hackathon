import { useEffect, useState, type RefObject } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { faceState, markLost } from './faceState'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

export type TrackerStatus = 'starting' | 'running' | 'error'

// one landmarker for the whole app — creation is expensive, reuse across routes
let landmarkerPromise: Promise<FaceLandmarker> | null = null

async function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL)
      const options = (delegate: 'GPU' | 'CPU') =>
        ({
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO' as const,
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false,
        }) as const
      try {
        return await FaceLandmarker.createFromOptions(vision, options('GPU'))
      } catch {
        return await FaceLandmarker.createFromOptions(vision, options('CPU'))
      }
    })()
    landmarkerPromise.catch(() => (landmarkerPromise = null))
  }
  return landmarkerPromise
}

/**
 * Webcam + MediaPipe detection loop. Feeds the RAW (unmirrored) video into
 * detection; mirroring happens once in CSS on the shared video+canvas container.
 */
export function useFaceTracker(videoRef: RefObject<HTMLVideoElement | null>, enabled = true) {
  const [status, setStatus] = useState<TrackerStatus>('starting')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) return
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    let stream: MediaStream | null = null
    let rafId = 0
    let vfcId = 0
    let lastVideoTime = -1

    const loop = (landmarker: FaceLandmarker) => {
      const detect = () => {
        if (cancelled) return
        // guard: rAF can outrun the camera; never detect the same frame twice
        if (video.readyState >= 2 && video.videoWidth > 0 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime
          const now = performance.now()
          try {
            const res = landmarker.detectForVideo(video, now)
            const m = res.facialTransformationMatrixes?.[0]?.data
            if (m && res.faceLandmarks.length > 0) {
              faceState.matrix.set(m)
              faceState.hasFace = true
              faceState.lastDetectionAt = now
            } else {
              markLost()
            }
          } catch {
            // transient decode/GPU hiccup — drop the frame, keep the loop alive
          }
        }
        schedule()
      }
      const schedule = () => {
        if (cancelled) return
        if ('requestVideoFrameCallback' in video) {
          vfcId = video.requestVideoFrameCallback(() => detect())
        } else {
          rafId = requestAnimationFrame(detect)
        }
      }
      schedule()
    }

    ;(async () => {
      try {
        const [landmarker, mediaStream] = await Promise.all([
          getLandmarker(),
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: false,
          }),
        ])
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop())
          return
        }
        stream = mediaStream
        video.srcObject = mediaStream
        await video.play()
        setStatus('running')
        loop(landmarker)
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setError(e instanceof Error ? e.message : 'camera unavailable')
      }
    })()

    return () => {
      cancelled = true
      markLost()
      if (rafId) cancelAnimationFrame(rafId)
      if (vfcId && 'cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(vfcId)
      stream?.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
  }, [videoRef, enabled])

  return { status, error }
}
