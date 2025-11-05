/**
 * 🎤 Google Speech-to-Text Integration
 * Transcribe voice messages to text
 */

import { SpeechClient } from '@google-cloud/speech'

// Initialize client with credentials from environment
const speechClient = new SpeechClient({
  credentials: process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : undefined,
})

export type TranscriptionResult = {
  text: string
  confidence: number
  language: string
}

/**
 * Transcribe audio buffer to text
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  languageCode: string = 'en-US'
): Promise<TranscriptionResult> {
  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    }

    const config = {
      encoding: 'OGG_OPUS' as const,
      sampleRateHertz: 16000,
      languageCode,
      alternativeLanguageCodes: ['ar-SA', 'en-US'], // Arabic and English
      enableAutomaticPunctuation: true,
      model: 'latest_long',
    }

    const request = {
      audio,
      config,
    }

    const [response] = await speechClient.recognize(request)
    const transcription = response.results
      ?.map((result) => result.alternatives?.[0])
      .filter(Boolean)

    if (!transcription || transcription.length === 0) {
      throw new Error('No transcription results')
    }

    const bestResult = transcription[0]

    return {
      text: bestResult?.transcript || '',
      confidence: bestResult?.confidence || 0,
      language: languageCode,
    }
  } catch (error: any) {
    console.error('Speech-to-Text error:', error)
    throw new Error(`Transcription failed: ${error.message}`)
  }
}

/**
 * Transcribe audio from URL
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  languageCode: string = 'en-US'
): Promise<TranscriptionResult> {
  try {
    // Download audio file
    const response = await fetch(audioUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return transcribeAudio(buffer, languageCode)
  } catch (error: any) {
    console.error('Transcription from URL error:', error)
    throw new Error(`Failed to transcribe audio from URL: ${error.message}`)
  }
}

/**
 * Detect language and transcribe
 */
export async function transcribeWithAutoDetect(
  audioBuffer: Buffer
): Promise<TranscriptionResult> {
  try {
    // Try English first
    try {
      const result = await transcribeAudio(audioBuffer, 'en-US')
      if (result.confidence > 0.7) {
        return result
      }
    } catch (error) {
      console.log('English transcription failed, trying Arabic...')
    }

    // Try Arabic
    return transcribeAudio(audioBuffer, 'ar-SA')
  } catch (error: any) {
    throw new Error(`Auto-detect transcription failed: ${error.message}`)
  }
}

/**
 * Calculate transcription cost
 * Google charges $0.006 per 15 seconds
 */
export function calculateTranscriptionCost(durationSeconds: number): number {
  const fifteenSecondBlocks = Math.ceil(durationSeconds / 15)
  return fifteenSecondBlocks * 0.006
}
