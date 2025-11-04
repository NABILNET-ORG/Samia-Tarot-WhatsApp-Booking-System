/**
 * 🧪 Test Google Calendar Connection
 * Verifies calendar API works and shows available slots
 * Run: node scripts/test-calendar.js
 */

const { google } = require('googleapis')

// Load .env file manually
const fs = require('fs')
const path = require('path')
const envPath = path.join(__dirname, '..', '.env')
const envFile = fs.readFileSync(envPath, 'utf8')
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    process.env[key] = value
  }
})

async function testCalendar() {
  console.log('\n' + '='.repeat(70))
  console.log('🧪 TESTING GOOGLE CALENDAR CONNECTION')
  console.log('='.repeat(70) + '\n')

  // Check environment variables
  console.log('📋 Checking environment variables...')
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'tarotsamia@gmail.com'

  console.log(`   GOOGLE_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}`)
  console.log(`   GOOGLE_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}`)
  console.log(`   GOOGLE_REFRESH_TOKEN: ${refreshToken ? '✅ Set (' + refreshToken.substring(0, 20) + '...)' : '❌ Missing'}`)
  console.log(`   GOOGLE_CALENDAR_ID: ${calendarId}`)

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('\n❌ Missing Google credentials!')
    process.exit(1)
  }

  try {
    // Initialize OAuth client
    console.log('\n🔐 Initializing OAuth client...')
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    console.log('   ✅ OAuth client initialized')

    // Get calendar API
    console.log('\n📅 Connecting to Google Calendar API...')
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    console.log('   ✅ Calendar API ready')

    // List calendars
    console.log('\n📋 Listing available calendars...')
    const calendarList = await calendar.calendarList.list()
    console.log(`   ✅ Found ${calendarList.data.items.length} calendars:`)
    calendarList.data.items.forEach((cal, i) => {
      console.log(`      ${i + 1}. ${cal.summary} (${cal.id})`)
    })

    // Get events for next 7 days
    console.log(`\n📆 Fetching events from: ${calendarId}`)
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)

    const { data } = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = data.items || []
    console.log(`   ✅ Found ${events.length} events in next 7 days`)

    if (events.length > 0) {
      console.log('\n   📌 Upcoming events:')
      events.slice(0, 10).forEach((event, i) => {
        const start = event.start.dateTime || event.start.date
        console.log(`      ${i + 1}. ${event.summary} - ${new Date(start).toLocaleString()}`)
      })
    }

    // Calculate available slots
    console.log('\n🕐 Calculating available slots...')
    const startHour = 12 // 12 PM
    const endHour = 20 // 8 PM
    const bufferMinutes = 30
    const sessionDuration = 30

    let totalSlots = 0
    let bookedSlots = 0

    for (let day = 0; day < 7; day++) {
      const date = new Date()
      date.setDate(date.getDate() + day)
      date.setHours(startHour, 0, 0, 0)

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(date)
          slotStart.setHours(hour, minute, 0, 0)

          const slotEnd = new Date(slotStart)
          slotEnd.setMinutes(slotEnd.getMinutes() + sessionDuration)

          if (slotEnd.getHours() >= endHour) continue
          if (slotStart < now) continue

          totalSlots++

          // Check conflicts
          const hasConflict = events.some((event) => {
            const eventStart = new Date(event.start?.dateTime || event.start?.date || '')
            const eventEnd = new Date(event.end?.dateTime || event.end?.date || '')
            const bufferedEnd = new Date(eventEnd)
            bufferedEnd.setMinutes(bufferedEnd.getMinutes() + bufferMinutes)
            return slotStart < bufferedEnd && slotEnd > eventStart
          })

          if (hasConflict) bookedSlots++
        }
      }
    }

    const availableSlots = totalSlots - bookedSlots

    console.log(`   Total possible slots: ${totalSlots}`)
    console.log(`   Booked slots: ${bookedSlots}`)
    console.log(`   Available slots: ${availableSlots}`)

    if (availableSlots === 0) {
      console.log('\n⚠️  WARNING: No available time slots!')
      console.log('   This is why customers see "no available slots" message')
      console.log('   Either calendar is fully booked, or business hours need adjustment')
    } else {
      console.log(`\n✅ SUCCESS: ${availableSlots} slots available for booking!`)
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ CALENDAR TEST COMPLETED SUCCESSFULLY')
    console.log('='.repeat(70) + '\n')
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    if (error.response) {
      console.error('   Response:', error.response.data)
    }
    console.log('\n' + '='.repeat(70))
    console.log('❌ CALENDAR TEST FAILED')
    console.log('='.repeat(70) + '\n')
    process.exit(1)
  }
}

testCalendar()
