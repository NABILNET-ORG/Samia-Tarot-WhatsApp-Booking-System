/**
 * 📚 Knowledge Base Refresh API
 * Fetches content from business websites for AI RAG
 * Supports single page or entire website crawling
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for crawling

interface CrawlResult {
  url: string
  status: 'success' | 'error'
  chars?: number
  error?: string
  pagesCrawled?: number
}

export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    const { urls, mode = 'single' } = await request.json()

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array required' }, { status: 400 })
    }

    if (urls.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 URLs allowed' }, { status: 400 })
    }

    const results: CrawlResult[] = []
    let totalPagesCrawled = 0

    for (const url of urls) {
      if (mode === 'entire') {
        // Crawl entire website
        const crawlResult = await crawlWebsite(url, context.business.id)
        results.push(crawlResult)
        totalPagesCrawled += crawlResult.pagesCrawled || 1
      } else {
        // Fetch single page
        const fetchResult = await fetchSinglePage(url, context.business.id)
        results.push(fetchResult)
        totalPagesCrawled += 1
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
      successful: results.filter(r => r.status === 'success').length,
      totalPagesCrawled,
      mode
    })
  })
}

/**
 * Fetch a single page
 */
async function fetchSinglePage(url: string, businessId: string): Promise<CrawlResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WhatsApp-AI-Bot/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30s timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || url
    const cleanContent = extractTextFromHTML(html)

    // Save to database
    await supabaseAdmin
      .from('knowledge_base_content')
      .upsert({
        business_id: businessId,
        source_type: 'website',
        source_url: url,
        title,
        content: cleanContent,
        fetched_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'business_id,source_type,source_url'
      })

    return { url, status: 'success', chars: cleanContent.length }
  } catch (error: any) {
    // Save error to database
    await supabaseAdmin
      .from('knowledge_base_content')
      .upsert({
        business_id: businessId,
        source_type: 'website',
        source_url: url,
        title: url,
        content: '',
        fetch_error: error.message,
        fetched_at: new Date().toISOString(),
        is_active: false
      }, {
        onConflict: 'business_id,source_type,source_url'
      })

    return { url, status: 'error', error: error.message }
  }
}

/**
 * Crawl entire website (up to 50 pages)
 */
async function crawlWebsite(startUrl: string, businessId: string): Promise<CrawlResult> {
  try {
    const baseUrl = new URL(startUrl)
    const domain = baseUrl.hostname
    const visited = new Set<string>()
    const toVisit = [startUrl]
    const maxPages = 50
    let totalChars = 0
    let pagesCrawled = 0

    // Delete old pages from this domain first
    await supabaseAdmin
      .from('knowledge_base_content')
      .delete()
      .eq('business_id', businessId)
      .eq('source_type', 'website')
      .like('source_url', `%${domain}%`)

    while (toVisit.length > 0 && pagesCrawled < maxPages) {
      const currentUrl = toVisit.shift()!

      if (visited.has(currentUrl)) continue
      visited.add(currentUrl)

      try {
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'WhatsApp-AI-Bot/1.0'
          },
          signal: AbortSignal.timeout(15000) // 15s timeout per page
        })

        if (!response.ok) continue

        const html = await response.text()
        const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || currentUrl
        const cleanContent = extractTextFromHTML(html)

        // Save page to database
        await supabaseAdmin
          .from('knowledge_base_content')
          .insert({
            business_id: businessId,
            source_type: 'website',
            source_url: currentUrl,
            title,
            content: cleanContent,
            fetched_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            is_active: true
          })

        totalChars += cleanContent.length
        pagesCrawled++

        // Extract links from the page
        const links = extractLinks(html, currentUrl, domain)

        // Add new links to visit
        for (const link of links) {
          if (!visited.has(link) && !toVisit.includes(link)) {
            toVisit.push(link)
          }
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (pageError) {
        // Skip this page and continue
        console.error(`Error crawling ${currentUrl}:`, pageError)
      }
    }

    return {
      url: startUrl,
      status: 'success',
      chars: totalChars,
      pagesCrawled
    }
  } catch (error: any) {
    await supabaseAdmin
      .from('knowledge_base_content')
      .upsert({
        business_id: businessId,
        source_type: 'website',
        source_url: startUrl,
        title: startUrl,
        content: '',
        fetch_error: error.message,
        fetched_at: new Date().toISOString(),
        is_active: false
      }, {
        onConflict: 'business_id,source_type,source_url'
      })

    return { url: startUrl, status: 'error', error: error.message, pagesCrawled: 0 }
  }
}

/**
 * Extract text content from HTML
 */
function extractTextFromHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Clean whitespace
    .trim()
    .substring(0, 10000) // Limit to 10K chars per page
}

/**
 * Extract internal links from HTML
 */
function extractLinks(html: string, baseUrl: string, domain: string): string[] {
  const links: string[] = []
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1]

      // Skip anchors, mailto, tel, javascript, etc.
      if (href.startsWith('#') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || href.startsWith('javascript:')) {
        continue
      }

      // Create absolute URL
      const absoluteUrl = new URL(href, baseUrl)

      // Only include links from same domain
      if (absoluteUrl.hostname === domain) {
        // Remove fragment and normalize
        absoluteUrl.hash = ''
        const normalizedUrl = absoluteUrl.toString()

        // Skip common non-content files
        if (!normalizedUrl.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|exe)$/i)) {
          links.push(normalizedUrl)
        }
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)] // Remove duplicates
}
