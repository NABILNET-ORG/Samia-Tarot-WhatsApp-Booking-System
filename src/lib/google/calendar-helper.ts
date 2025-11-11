/**
 * 📅 Google Calendar Helper
 * Check availability and create events
 */

import { google } from 'googleapis'

export async function checkCalendarAvailability(
  requestedDateTime: Date,
  durationMinutes: number,
  googleCredentials: {
    clientId: string
    clientSecret: string
    refreshToken: string
    calendarId: string
  }
): Promise<{
  available: boolean
  conflicts?: any[]
}> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      googleCredentials.clientId,
      googleCredentials.clientSecret
    )

    oauth2Client.setCredentials({
      refresh_token: googleCredentials.refreshToken
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const startTime = requestedDateTime
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

    // Check for conflicting events
    const response = await calendar.events.list({
      calendarId: googleCredentials.calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
    })

    const conflicts = response.data.items || []

    return {
      available: conflicts.length === 0,
      conflicts
    }
  } catch (error) {
    console.error('Error checking calendar availability:', error)
    return { available: true } // Default to available if check fails
  }
}

export async function createCalendarEvent(
  eventData: {
    summary: string
    description: string
    startDateTime: Date
    endDateTime?: Date
    durationMinutes?: number
    serviceType: 'reading' | 'call'
    attendeeEmail?: string
    customerName: string
    customerPhone: string
  },
  googleCredentials: {
    clientId: string
    clientSecret: string
    refreshToken: string
    calendarId: string
  }
): Promise<{
  success: boolean
  eventId?: string
  meetLink?: string
  htmlLink?: string
}> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      googleCredentials.clientId,
      googleCredentials.clientSecret
    )

    oauth2Client.setCredentials({
      refresh_token: googleCredentials.refreshToken
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const endDateTime = eventData.endDateTime || new Date(
      eventData.startDateTime.getTime() + (eventData.durationMinutes || 60) * 60 * 1000
    )

    const event: any = {
      summary: eventData.summary,
      description: `${eventData.description}\n\nCustomer: ${eventData.customerName}\nPhone: ${eventData.customerPhone}`,
      start: {},
      end: {},
      attendees: eventData.attendeeEmail ? [
        { email: eventData.attendeeEmail }
      ] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 },
        ],
      },
    }

    // For reading services: create as all-day task (no specific time)
    if (eventData.serviceType === 'reading') {
      event.start.date = eventData.startDateTime.toISOString().split('T')[0]
      event.end.date = eventData.startDateTime.toISOString().split('T')[0]
    } else {
      // For calling services: create with specific time + Meet link
      event.start.dateTime = eventData.startDateTime.toISOString()
      event.start.timeZone = 'Asia/Beirut'
      event.end.dateTime = endDateTime.toISOString()
      event.end.timeZone = 'Asia/Beirut'
      event.conferenceData = {
        createRequest: {
          requestId: `${Date.now()}-${Math.random()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    }

    const response = await calendar.events.insert({
      calendarId: googleCredentials.calendarId,
      conferenceDataVersion: eventData.serviceType === 'call' ? 1 : undefined,
      requestBody: event,
      sendUpdates: 'all', // Send email notifications
    })

    return {
      success: true,
      eventId: response.data.id || undefined,
      meetLink: response.data.hangoutLink || undefined,
      htmlLink: response.data.htmlLink || undefined,
    }
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return { success: false }
  }
}
