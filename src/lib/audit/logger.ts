/**
 * 📝 Audit Logger
 * Track all sensitive operations
 */

import { supabaseAdmin } from '@/lib/supabase/client'

export type AuditAction =
  | 'login' | 'logout' | 'failed_login'
  | 'create' | 'update' | 'delete'
  | 'takeover' | 'password_reset' | 'email_verified'

export async function logAudit(params: {
  businessId?: string
  employeeId?: string
  action: AuditAction
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  details?: Record<string, any>
}) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      business_id: params.businessId,
      employee_id: params.employeeId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      details: params.details,
    })
  } catch (error) {
    console.error('Audit logging failed:', error)
    // Don't throw - audit logging should never break the main flow
  }
}
