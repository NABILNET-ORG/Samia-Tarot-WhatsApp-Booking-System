/**
 * 🔐 Employee Logout API
 * Destroy employee session
 */

import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'

/**
 * POST /api/auth/logout - Employee logout
 */
export async function POST(request: NextRequest) {
  try {
    await destroySession()

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed', message: error.message },
      { status: 500 }
    )
  }
}
