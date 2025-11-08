/**
 * 🏢 Multi-Tenant Middleware
 * Ensures every request is scoped to the correct business
 * Sets Supabase context for Row-Level Security
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getEmployeeFromSession } from '@/lib/auth/session'

export type BusinessContext = {
  business: {
    id: string
    name: string
    slug: string
    subscription_tier: string
    is_active: boolean
  }
  employee: {
    id: string
    email: string
    full_name: string
    role_id: string
    role_name: string
    permissions: Record<string, any>
  }
}

/**
 * Middleware to inject business context into every API request
 * Usage: const context = await withBusinessContext(request)
 */
export async function withBusinessContext(request: NextRequest): Promise<BusinessContext | null> {
  try {
    // 1. Get employee from session/JWT
    const employee = await getEmployeeFromSession(request)

    if (!employee) {
      return null
    }

    // 2. Get employee's business and role
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select(`
        id,
        email,
        full_name,
        business_id,
        role_id,
        custom_permissions_json,
        businesses (
          id,
          name,
          slug,
          subscription_tier,
          subscription_status,
          is_active,
          is_suspended
        ),
        roles (
          id,
          name,
          permissions_json
        )
      `)
      .eq('id', employee.id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('Employee not found or inactive:', error)
      return null
    }

    // 3. Check business is active
    if (!data.businesses?.is_active || data.businesses?.is_suspended) {
      console.error('Business is inactive or suspended')
      return null
    }

    // 4. Merge role permissions with custom permissions
    const rolePermissions = data.roles?.permissions_json || {}
    const customPermissions = data.custom_permissions_json || {}
    const mergedPermissions = { ...rolePermissions, ...customPermissions }

    // 5. Set Supabase context for RLS
    await supabaseAdmin.rpc('set_business_context', {
      p_business_id: data.business_id,
    })

    await supabaseAdmin.rpc('set_employee_context', {
      p_employee_id: data.id,
    })

    // 6. Return context
    return {
      business: {
        id: data.businesses.id,
        name: data.businesses.name,
        slug: data.businesses.slug,
        subscription_tier: data.businesses.subscription_tier,
        is_active: data.businesses.is_active,
      },
      employee: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role_id: data.role_id,
        role_name: data.roles?.name || 'unknown',
        permissions: mergedPermissions,
      },
    }
  } catch (error: any) {
    console.error('Multi-tenant middleware error:', error)
    return null
  }
}

/**
 * Middleware wrapper for API routes
 * Returns 401 if not authenticated, 403 if no access
 */
export async function requireBusinessContext(
  request: NextRequest,
  handler: (context: BusinessContext, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const context = await withBusinessContext(request)

  if (!context) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid business context required' },
      { status: 401 }
    )
  }

  // Check subscription status and usage limits
  const usageCheck = await checkUsageLimits(context)
  if (!usageCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Usage limit exceeded',
        message: usageCheck.message,
        current_usage: usageCheck.current,
        limit: usageCheck.limit,
      },
      { status: 429 }
    )
  }

  return handler(context, request)
}

/**
 * Check usage limits based on subscription tier
 */
async function checkUsageLimits(context: BusinessContext): Promise<{
  allowed: boolean
  message?: string
  current?: number
  limit?: number
}> {
  try {
    // Get subscription tier limits
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_max_conversations_monthly, plan_name')
      .eq('business_id', context.business.id)
      .eq('status', 'active')
      .single()

    // If no active subscription or unlimited plan, allow
    if (!subscription || subscription.plan_max_conversations_monthly === -1) {
      return { allowed: true }
    }

    // Count conversations this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', context.business.id)
      .gte('created_at', startOfMonth.toISOString())

    if (error) {
      console.error('Error checking usage limits:', error)
      // On error, allow the request to proceed
      return { allowed: true }
    }

    const currentUsage = count || 0
    const limit = subscription.plan_max_conversations_monthly

    if (currentUsage >= limit) {
      return {
        allowed: false,
        message: `Monthly conversation limit reached (${limit} conversations). Upgrade your plan to continue.`,
        current: currentUsage,
        limit: limit,
      }
    }

    return { allowed: true, current: currentUsage, limit: limit }
  } catch (error: any) {
    console.error('Usage limit check error:', error)
    // On error, allow the request to proceed
    return { allowed: true }
  }
}

/**
 * Check if employee has specific permission
 */
export function hasPermission(
  context: BusinessContext,
  resource: string,
  action: string
): boolean {
  // Admin and Owner roles have all permissions (case-insensitive)
  const roleName = context.employee.role_name?.toLowerCase() || ''
  if (['admin', 'owner'].includes(roleName)) {
    return true
  }

  const permissions = context.employee.permissions

  // Navigate nested permission object
  // e.g., resource='conversations', action='takeover'
  // checks permissions.conversations.takeover

  if (!permissions[resource]) {
    return false
  }

  if (typeof permissions[resource] === 'boolean') {
    return permissions[resource]
  }

  if (typeof permissions[resource] === 'object') {
    return permissions[resource][action] === true
  }

  return false
}

/**
 * Middleware that also checks permission
 * Returns 403 if employee doesn't have permission
 */
export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: string,
  handler: (context: BusinessContext, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const context = await withBusinessContext(request)

  if (!context) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!hasPermission(context, resource, action)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `You don't have permission to ${action} ${resource}`,
        required_permission: `${resource}.${action}`,
      },
      { status: 403 }
    )
  }

  return handler(context, request)
}
