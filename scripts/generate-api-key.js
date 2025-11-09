/**
 * 🔑 Generate New Internal API Key
 * Run: node scripts/generate-api-key.js
 */

const crypto = require('crypto')

function generateApiKey(prefix = 'internal') {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const timestamp = Date.now().toString(36)
  return `wh_${prefix}_${timestamp}_${randomBytes}`
}

const newKey = generateApiKey('internal')

console.log('\n' + '='.repeat(80))
console.log('🔑 NEW INTERNAL API KEY GENERATED')
console.log('='.repeat(80))
console.log('\n📋 Copy this key:\n')
console.log('\x1b[32m%s\x1b[0m', newKey)
console.log('\n📝 Add to your .env file:')
console.log('\x1b[33m%s\x1b[0m', `INTERNAL_API_KEY=${newKey}`)
console.log('\n📝 Add to Vercel environment variables:')
console.log('   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
console.log('   2. Add: INTERNAL_API_KEY = ' + newKey)
console.log('   3. Select: Production, Preview, Development')
console.log('   4. Click "Save"')
console.log('\n⚠️  SECURITY NOTES:')
console.log('   • Never commit this key to git')
console.log('   • Store securely (password manager recommended)')
console.log('   • Rotate periodically (every 90 days)')
console.log('   • Use different keys for dev/staging/production')
console.log('\n' + '='.repeat(80) + '\n')
