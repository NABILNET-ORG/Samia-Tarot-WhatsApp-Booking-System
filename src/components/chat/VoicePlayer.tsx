/**
 * 🎤 Voice Player Component
 * Audio player with transcription display
 */

'use client'

import { useState, useRef, useEffect } from 'react'

type VoicePlayerProps = {
  audioUrl: string
  duration?: number
  transcription?: string
  transcriptionLanguage?: string
  transcriptionConfidence?: number
  messageId?: string
  onTranscribe?: () => void
}

export function VoicePlayer({
  audioUrl,
  duration = 0,
  transcription,
  transcriptionLanguage,
  transcriptionConfidence,
  messageId,
  onTranscribe,
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const [transcribing, setTranscribing] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setAudioDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  async function handleTranscribe() {
    if (!messageId || !onTranscribe) return

    try {
      setTranscribing(true)
      onTranscribe()
    } finally {
      setTranscribing(false)
    }
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  return (
    <div className="space-y-2">
      {/* Audio Player */}
      <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Transcribe Button */}
        {!transcription && messageId && (
          <button
            onClick={handleTranscribe}
            disabled={transcribing}
            className="flex-shrink-0 px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/60 disabled:opacity-50 transition-colors"
          >
            {transcribing ? 'Transcribing...' : 'Transcribe'}
          </button>
        )}
      </div>

      {/* Transcription */}
      {transcription && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">Transcription:</span>
            <div className="flex items-center gap-2">
              {transcriptionLanguage && (
                <span className="text-xs text-blue-600 dark:text-blue-400 uppercase">
                  {transcriptionLanguage}
                </span>
              )}
              {transcriptionConfidence !== undefined && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {Math.round(transcriptionConfidence * 100)}% confidence
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100">{transcription}</p>
        </div>
      )}
    </div>
  )
}
