import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { encryptApiKey } from '@/lib/encryption/keys'
import { UpdateSettingsSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  return requirePermission(request, 'businesses', 'read', async (context) => {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', context.business.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ settings: data })
  })
}

export async function PATCH(request: NextRequest) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = UpdateSettingsSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data
      const updates: any = {}

      // Handle non-sensitive fields
      const allowedFields = ['name', 'timezone', 'logo_url', 'primary_color', 'ai_model', 'ai_temperature', 'ai_max_tokens']
      for (const field of allowedFields) {
        if (validatedData[field as keyof typeof validatedData] !== undefined) {
          updates[field] = validatedData[field as keyof typeof validatedData]
        }
      }

      // Handle encrypted fields (note: openai_api_key is not in UpdateSettingsSchema, keeping original logic)
      if (body.openai_api_key) {
        updates.openai_api_key_encrypted = encryptApiKey(body.openai_api_key, context.business.id)
      }

      const { data, error } = await supabaseAdmin
        .from('businesses')
        .update(updates)
        .eq('id', context.business.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ settings: data, message: 'Settings updated' })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
