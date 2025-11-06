/**
 * 🔐 Context API
 * Returns current business & employee context for authenticated session
 */

import { NextRequest, NextResponse } from "next/server"
import { requireBusinessContext } from "@/lib/multi-tenant/middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/context - Get current business context
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    return NextResponse.json({
      business: context.business,
      employee: context.employee,
    })
  })
}
