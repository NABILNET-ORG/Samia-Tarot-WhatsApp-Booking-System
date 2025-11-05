/**
 * 🎤 Voice Transcription API
 * Convert voice messages to text using Google Speech-to-Text
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { transcribeAudioFromUrl, calculateTranscriptionCost } from '@/lib/google/speech-to-text'

/**
 * POST /api/voice/transcribe - Transcribe a voice message
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()
      const { message_id, audio_url, language_code } = body

      if (!message_id || !audio_url) {
        return NextResponse.json(
          { error: 'message_id and audio_url are required' },
          { status: 400 }
        )
      }

      // Get message to verify ownership
      const { data: message, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('id, business_id, media_duration_seconds')
        .eq('id', message_id)
        .eq('business_id', context.business.id)
        .single()

      if (msgError || !message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Transcribe audio
      const result = await transcribeAudioFromUrl(audio_url, language_code)

      // Calculate cost
      const cost = calculateTranscriptionCost(message.media_duration_seconds || 30)

      // Update message with transcription
      const { error: updateError } = await supabaseAdmin
        .from('messages')
        .update({
          transcription_text: result.text,
          transcription_language: result.language,
          transcription_confidence: result.confidence,
        })
        .eq('id', message_id)

      if (updateError) throw updateError

      return NextResponse.json({
        transcription: result.text,
        confidence: result.confidence,
        language: result.language,
        cost,
        message: 'Transcription completed successfully',
      })
    } catch (error: any) {
      console.error('Transcription error:', error)
      return NextResponse.json(
        { error: 'Transcription failed', message: error.message },
        { status: 500 }
      )
    }
  })
}
