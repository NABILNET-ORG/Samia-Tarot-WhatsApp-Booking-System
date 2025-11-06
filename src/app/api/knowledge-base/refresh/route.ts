/**
 * 📚 Knowledge Base Refresh API
 * Fetches content from business websites for AI RAG
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'
import { JSDOM } from 'jsdom'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array required' }, { status: 400 })
    }

    if (urls.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 URLs allowed' }, { status: 400 })
    }

    const results = []

    for (const url of urls) {
      try {
        // Fetch website content
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'WhatsApp-AI-Bot/1.0'
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const html = await response.text()

        // Parse HTML and extract text
        const dom = new JSDOM(html)
        const document = dom.window.document

        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, footer')
        scripts.forEach(el => el.remove())

        // Get title
        const title = document.querySelector('title')?.textContent || url

        // Get main content
        const body = document.querySelector('body')
        const content = body?.textContent || ''

        // Clean up whitespace
        const cleanContent = content
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 10000) // Limit to 10K chars per URL

        // Save to database
        await supabaseAdmin
          .from('knowledge_base_content')
          .upsert({
            business_id: context.business.id,
            url,
            title,
            content: cleanContent,
            fetched_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            is_active: true
          }, {
            onConflict: 'business_id,url'
          })

        results.push({ url, status: 'success', chars: cleanContent.length })
      } catch (error: any) {
        // Save error to database
        await supabaseAdmin
          .from('knowledge_base_content')
          .upsert({
            business_id: context.business.id,
            url,
            fetch_error: error.message,
            fetched_at: new Date().toISOString(),
            is_active: false
          }, {
            onConflict: 'business_id,url'
          })

        results.push({ url, status: 'error', error: error.message })
      }
    }

    // Update business knowledge_base_urls
    await supabaseAdmin
      .from('businesses')
      .update({ knowledge_base_urls: urls })
      .eq('id', context.business.id)

    return NextResponse.json({
      success: true,
      results,
      total: urls.length,
      successful: results.filter(r => r.status === 'success').length
    })
  })
}
