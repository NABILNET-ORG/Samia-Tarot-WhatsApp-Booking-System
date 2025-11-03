/**
 * 🔐 Admin Auth Check API
 */

import { NextResponse } from 'next/server'

export async function GET() {
  // For now, always allow (no authentication required)
  // In production, implement proper NextAuth.js authentication
  return NextResponse.json({ authenticated: true })
}
