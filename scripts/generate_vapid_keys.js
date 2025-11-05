/**
 * 🔑 Generate VAPID Keys for Web Push
 * Run this once to get keys for .env file
 */

const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('🔑 VAPID Keys Generated!\n')
console.log('Add these to your .env file:\n')
console.log('# Web Push Notifications')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)
console.log(`VAPID_SUBJECT="mailto:admin@samia-tarot.com"`)
console.log('\n✅ Done!')
