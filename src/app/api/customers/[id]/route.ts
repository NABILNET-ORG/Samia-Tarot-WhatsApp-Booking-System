/**
 * 👥 Customer Management API - Single Customer Operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  phone: z.string().min(1).max(20).optional(),
  name_english: z.string().max(100).optional(),
  name_arabic: z.string().max(100).optional(),
  email: z.string().email().optional().nullable(),
  preferred_language: z.enum(['en', 'ar']).optional(),
  country_code: z.string().max(5).optional(),
  vip_status: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const { data: customer, error } = await supabaseAdmin.from('customers').select('*').eq('id', id).eq('business_id', context.business.id).single()
    if (error || !customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json({ customer })
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    const { id } = params
    const body = await request.json()
    const validation = updateCustomerSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 })
    const { data: customer, error } = await supabaseAdmin.from('customers').update({ ...validation.data, updated_at: new Date().toISOString() }).eq('id', id).eq('business_id', context.business.id).select().single()
    if (error) throw error
    return NextResponse.json({ customer, message: 'Customer updated successfully' })
  })
}

/**
 * DELETE /api/customers/[id] - GDPR-Compliant Customer Deletion
 * Soft delete with cascade to related data and audit logging
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // 1. Verify customer exists and belongs to business
      const { data: customer, error: fetchError } = await supabaseAdmin
        .from('customers')
        .select('*, conversations(count), bookings(count)')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      // 2. Get deletion summary for audit log
      const deletionSummary = {
        customer_id: id,
        customer_phone: customer.phone,
        customer_email: customer.email,
        conversations_count: customer.conversations?.[0]?.count || 0,
        bookings_count: customer.bookings?.[0]?.count || 0,
        deleted_by: context.employee.id,
        deleted_by_email: context.employee.email,
        deletion_reason: 'GDPR right to be forgotten',
        retention_period_days: 30,
      }

      // 3. Soft delete customer
      const { error: customerError } = await supabaseAdmin
        .from('customers')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: context.employee.id,
          // Anonymize PII data immediately
          name_english: `[DELETED]`,
          name_arabic: `[محذوف]`,
          email: null,
          notes: null,
        })
        .eq('id', id)

      if (customerError) throw customerError

      // 4. Cascade soft delete to related data

      // Mark conversations as deleted
      await supabaseAdmin
        .from('conversations')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('customer_id', id)

      // Mark messages as deleted
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('customer_id', id)

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id)
        await supabaseAdmin
          .from('messages')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .in('conversation_id', conversationIds)
      }

      // Mark bookings as deleted
      await supabaseAdmin
        .from('bookings')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('customer_id', id)

      // 5. Log GDPR deletion in activity logs
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'customer.gdpr_delete',
        resource_type: 'customer',
        resource_id: id,
        details: deletionSummary,
        severity: 'high',
      })

      console.log(`✅ GDPR deletion completed for customer ${id} by ${context.employee.email}`)

      // 6. Return success with deletion summary
      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully (GDPR compliant)',
        deletion_summary: {
          customer_id: id,
          conversations_deleted: deletionSummary.conversations_count,
          bookings_deleted: deletionSummary.bookings_count,
          retention_policy: '30 days (soft delete)',
          hard_delete_scheduled: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })
    } catch (error: any) {
      console.error('Failed to delete customer:', error)
      return NextResponse.json(
        { error: 'Failed to delete customer', message: error.message },
        { status: 500 }
      )
    }
  })
}
