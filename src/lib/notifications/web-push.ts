/**
 * 🔔 Web Push Notifications
 * Browser-native push notifications (no external service)
 */

import webpush from 'web-push'

// VAPID keys for Web Push (generate with: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@samia-tarot.com'

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export type PushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export type NotificationPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  tag?: string
  requireInteraction?: boolean
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify(payload)
    )
  } catch (error: any) {
    console.error('Push notification error:', error)
    throw new Error(`Failed to send push: ${error.message}`)
  }
}

/**
 * Send push to multiple subscriptions
 */
export async function sendPushToMultiple(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{ successful: number; failed: number }> {
  let successful = 0
  let failed = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await sendPushNotification(sub, payload)
        successful++
      } catch (error) {
        failed++
      }
    })
  )

  return { successful, failed }
}

/**
 * Generate VAPID keys (run this once to get keys for .env)
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys()
}
