/**
 * 📅 Google Calendar Integration
 * Check availability, show time slots, create events
 */

import { google } from 'googleapis'
import { supabaseHelpers } from '../supabase/client'

// Initialize Google Calendar API
function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export type TimeSlot = {
  id: string
  startTime: Date
  endTime: Date
  displayText: string
  displayTextAr: string
}

export class CalendarHelpers {
  /**
   * Get available time slots for next 7 days
   */
  static async getAvailableSlots(durationMinutes: number = 30): Promise<TimeSlot[]> {
    try {
      const calendar = getCalendarClient()

      // Get events for next 7 days
      const now = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      const { data } = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      })

      const existingEvents = data.items || []

      // Get business hours from database
      const startHourSetting = await supabaseHelpers.getSetting('call_hours_start')
      const endHourSetting = await supabaseHelpers.getSetting('call_hours_end')
      const bufferMinutesSetting = await supabaseHelpers.getSetting('call_buffer_minutes')

      const startHour = parseInt(startHourSetting || '12')
      const endHour = parseInt(endHourSetting || '20')
      const bufferMinutes = parseInt(bufferMinutesSetting || '30')

      // Generate all possible slots
      const slots: TimeSlot[] = []
      const totalSlotDuration = durationMinutes + bufferMinutes

      for (let day = 0; day < 7; day++) {
        const date = new Date()
        date.setDate(date.getDate() + day)
        date.setHours(startHour, 0, 0, 0)

        // Generate slots for this day
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotStart = new Date(date)
            slotStart.setHours(hour, minute, 0, 0)

            const slotEnd = new Date(slotStart)
            slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes)

            // Skip if slot end goes past business hours
            if (slotEnd.getHours() >= endHour) {
              continue
            }

            // Skip if slot is in the past
            if (slotStart < now) {
              continue
            }

            // Check if slot conflicts with existing events
            const hasConflict = existingEvents.some((event) => {
              const eventStart = new Date(event.start?.dateTime || event.start?.date || '')
              const eventEnd = new Date(event.end?.dateTime || event.end?.date || '')

              // Add buffer to event end
              const bufferedEnd = new Date(eventEnd)
              bufferedEnd.setMinutes(bufferedEnd.getMinutes() + bufferMinutes)

              return slotStart < bufferedEnd && slotEnd > eventStart
            })

            if (!hasConflict) {
              // Format display text
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
              const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

              const dayName = dayNames[slotStart.getDay()]
              const dayNameAr = dayNamesAr[slotStart.getDay()]
              const month = monthNames[slotStart.getMonth()]
              const dayNum = slotStart.getDate()
              const timeStr = slotStart.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
              const timeStrAr = slotStart.toLocaleTimeString('ar-EG', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })

              slots.push({
                id: `${slotStart.getTime()}`,
                startTime: slotStart,
                endTime: slotEnd,
                displayText: `${dayName}, ${month} ${dayNum}, ${timeStr}`,
                displayTextAr: `${dayNameAr}، ${dayNum} ${month}، ${timeStrAr}`,
              })
            }
          }
        }
      }

      return slots.slice(0, 20) // Return max 20 slots
    } catch (error: any) {
      console.error('Calendar availability error:', error)
      return []
    }
  }

  /**
   * Create calendar event with Google Meet
   */
  static async createEvent(params: {
    summary: string
    description: string
    startTime: Date
    endTime: Date
    attendeeEmail?: string
    attendeeName?: string
  }): Promise<{ eventId: string; meetLink: string }> {
    try {
      const calendar = getCalendarClient()

      const event = {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: params.startTime.toISOString(),
          timeZone: process.env.BUSINESS_TIMEZONE || 'Asia/Beirut',
        },
        end: {
          dateTime: params.endTime.toISOString(),
          timeZone: process.env.BUSINESS_TIMEZONE || 'Asia/Beirut',
        },
        attendees: params.attendeeEmail
          ? [
              {
                email: params.attendeeEmail,
                displayName: params.attendeeName || 'Customer',
              },
            ]
          : [],
        conferenceData: {
          createRequest: {
            requestId: `samia-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      }

      const { data } = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: event,
      })

      return {
        eventId: data.id!,
        meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri || '',
      }
    } catch (error: any) {
      console.error('Calendar event creation error:', error)
      throw new Error(`Failed to create calendar event: ${error.message}`)
    }
  }

  /**
   * Format time slots for WhatsApp message
   */
  static formatSlotsForWhatsApp(slots: TimeSlot[], language: 'ar' | 'en'): string {
    if (slots.length === 0) {
      return language === 'ar'
        ? 'عذراً، لا توجد مواعيد متاحة حالياً. الرجاء المحاولة لاحقاً.'
        : 'Sorry, no available slots at the moment. Please try again later.'
    }

    let message =
      language === 'ar'
        ? '📅 الأوقات المتاحة للمكالمة:\n\n'
        : '📅 Available Call Times:\n\n'

    slots.forEach((slot, index) => {
      const displayText = language === 'ar' ? slot.displayTextAr : slot.displayText
      message += `${index + 1}. ${displayText}\n`
    })

    message +=
      '\n' +
      (language === 'ar'
        ? 'اكتب رقم الموعد المناسب لك:'
        : 'Type the number of your preferred time:')

    return message
  }

  /**
   * Get slot by number from list
   */
  static getSlotByNumber(slots: TimeSlot[], number: number): TimeSlot | null {
    if (number < 1 || number > slots.length) {
      return null
    }
    return slots[number - 1]
  }
}
