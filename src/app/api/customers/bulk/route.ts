/**
 * 👥 Bulk Customer Operations API
 * Handle bulk delete and bulk actions for customers
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { BulkCustomerSchema } from '@/lib/validation/schemas'

/**
 * POST /api/customers/bulk - Bulk operations on customers
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      const validation = BulkCustomerSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.format() },
          { status: 400 }
        )
      }
      const validatedData = validation.data

      switch (validatedData.action) {
        case 'delete':
          // Bulk soft delete customers (GDPR compliant)
          const results = []

          for (const customerId of validatedData.customer_ids) {
            // Soft delete each customer
            const { error } = await supabaseAdmin
              .from('customers')
              .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: context.employee.id,
                name_english: '[DELETED]',
                name_arabic: '[محذوف]',
                email: null,
                notes: null,
              })
              .eq('id', customerId)
              .eq('business_id', context.business.id)

            if (!error) {
              // Cascade delete conversations
              await supabaseAdmin
                .from('conversations')
                .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                .eq('customer_id', customerId)

              // Cascade delete bookings
              await supabaseAdmin
                .from('bookings')
                .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                .eq('customer_id', customerId)

              results.push({ customer_id: customerId, success: true })
            } else {
              results.push({ customer_id: customerId, success: false, error: error.message })
            }
          }

          // Log bulk deletion
          await supabaseAdmin.from('activity_logs').insert({
            business_id: context.business.id,
            employee_id: context.employee.id,
            action: 'customers.bulk_delete',
            resource_type: 'customer',
            details: {
              customer_count: validatedData.customer_ids.length,
              results,
            },
            severity: 'high',
          })

          const successCount = results.filter(r => r.success).length

          return NextResponse.json({
            success: true,
            message: `Bulk delete completed: ${successCount}/${validatedData.customer_ids.length} customers deleted`,
            results,
          })

        case 'export':
          // Export customer data to CSV
          const { data: customers } = await supabaseAdmin
            .from('customers')
            .select('*')
            .in('id', validatedData.customer_ids)
            .eq('business_id', context.business.id)

          return NextResponse.json({
            success: true,
            customers,
          })
      }
    } catch (error: any) {
      console.error('Bulk operation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  })
}
