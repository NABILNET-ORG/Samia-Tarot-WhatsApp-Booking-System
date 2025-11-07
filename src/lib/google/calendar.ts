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
   * Minimum 1 hour from now, closest slots first
   */
  static async getAvailableSlots(durationMinutes: number = 30): Promise<TimeSlot[]> {
    try {
      const calendar = getCalendarClient()

      // Get events for next 7 days
      const now = new Date()
      // Minimum 1 hour from now for slot availability
      const minStartTime = new Date(now.getTime() + 60 * 60 * 1000)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      // Use specified calendar or primary
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'tarotsamia@gmail.com'

      const { data } = await calendar.events.list({
        calendarId,
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

            // Skip if slot is less than 1 hour from now
            if (slotStart < minStartTime) {
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

      // Use specified calendar or primary
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'tarotsamia@gmail.com'

      const { data } = await calendar.events.insert({
        calendarId,
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
   * Shows ONLY the closest available slot
   */
  static formatSlotsForWhatsApp(slots: TimeSlot[], language: 'ar' | 'en'): string {
    if (slots.length === 0) {
      return language === 'ar'
        ? 'عذراً، لا توجد مواعيد متاحة حالياً. الرجاء المحاولة لاحقاً.'
        : 'Sorry, no available slots at the moment. Please try again later.'
    }

    // Show ONLY the first (closest) slot
    const closestSlot = slots[0]
    const displayText = language === 'ar' ? closestSlot.displayTextAr : closestSlot.displayText

    let message =
      language === 'ar'
        ? `📅 أقرب موعد متاح:\n\n🕐 ${displayText}\n\n` +
          `⚠️ هذا الموعد سيصبح غير متاح بعد 15 دقيقة من الآن.\n\n` +
          `اكتب "نعم" لتأكيد هذا الموعد\n` +
          `أو اكتب "موعد آخر" لرؤية الموعد التالي\n` +
          `أو اذكر وقت محدد (مثال: "3:00 PM" أو "15:00")`
        : `📅 Next Available Time:\n\n🕐 ${displayText}\n\n` +
          `⚠️ This slot will expire 15 minutes from now.\n\n` +
          `Type "yes" to confirm this time\n` +
          `Or "next" to see the next available slot\n` +
          `Or specify a time (e.g., "3:00 PM" or "15:00")`

    return message
  }

  /**
   * Find slot closest to requested time
   */
  static findClosestSlot(slots: TimeSlot[], requestedTime: string): TimeSlot | null {
    if (slots.length === 0) return null
    if (!requestedTime) return slots[0]

    try {
      // Parse the requested time - handle various formats
      const requestedDate = this.parseFlexibleDateTime(requestedTime)
      if (!requestedDate) {
        // If parsing fails, return first available slot
        return slots[0]
      }

      // Find the slot with the closest start time
      let closestSlot = slots[0]
      let minDiff = Math.abs(new Date(slots[0].start).getTime() - requestedDate.getTime())

      for (const slot of slots) {
        const slotTime = new Date(slot.start).getTime()
        const diff = Math.abs(slotTime - requestedDate.getTime())

        if (diff < minDiff) {
          minDiff = diff
          closestSlot = slot
        }
      }

      return closestSlot
    } catch (error) {
      console.error('Error finding closest slot:', error)
      return slots[0]
    }
  }

  /**
   * Parse flexible date/time formats from natural language
   */
  private static parseFlexibleDateTime(input: string): Date | null {
    try {
      // Clean the input
      const cleaned = input.toLowerCase().trim()

      // Get current date/time
      const now = new Date()

      // Handle relative times
      if (cleaned.includes('tomorrow')) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Extract time if specified (e.g., "tomorrow at 3pm")
        const timeMatch = cleaned.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
        if (timeMatch) {
          let hours = parseInt(timeMatch[1])
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
          const ampm = timeMatch[3]

          if (ampm === 'pm' && hours < 12) hours += 12
          if (ampm === 'am' && hours === 12) hours = 0

          tomorrow.setHours(hours, minutes, 0, 0)
        } else {
          tomorrow.setHours(10, 0, 0, 0) // Default to 10 AM
        }
        return tomorrow
      }

      if (cleaned.includes('next week')) {
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + 7)
        nextWeek.setHours(10, 0, 0, 0)
        return nextWeek
      }

      // Handle specific times (e.g., "3pm", "15:30", "3:30 PM")
      const timeOnlyMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
      if (timeOnlyMatch) {
        const result = new Date(now)
        let hours = parseInt(timeOnlyMatch[1])
        const minutes = timeOnlyMatch[2] ? parseInt(timeOnlyMatch[2]) : 0
        const ampm = timeOnlyMatch[3]

        if (ampm === 'pm' && hours < 12) hours += 12
        if (ampm === 'am' && hours === 12) hours = 0

        result.setHours(hours, minutes, 0, 0)

        // If the time is in the past, assume next day
        if (result < now) {
          result.setDate(result.getDate() + 1)
        }

        return result
      }

      // Handle ISO date strings
      if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
        return new Date(input)
      }

      // Try standard Date parsing
      const parsed = new Date(input)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }

      return null
    } catch (error) {
      console.error('Error parsing flexible datetime:', error)
      return null
    }
  }

  /**
   * Create all-day task for reading services (not timed events)
   */
  static async createReadingTask(params: {
    summary: string
    description: string
    dueDate: Date
    customerEmail?: string
  }): Promise<{ taskId: string }> {
    try {
      const calendar = getCalendarClient()
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'tarotsamia@gmail.com'

      // Create all-day event (task)
      const event = {
        summary: params.summary,
        description: params.description,
        start: {
          date: params.dueDate.toISOString().split('T')[0], // All-day format: YYYY-MM-DD
          timeZone: process.env.BUSINESS_TIMEZONE || 'Asia/Beirut',
        },
        end: {
          date: params.dueDate.toISOString().split('T')[0], // Same day
          timeZone: process.env.BUSINESS_TIMEZONE || 'Asia/Beirut',
        },
        // No reminders for reading tasks - admin will handle delivery
      }

      const { data } = await calendar.events.insert({
        calendarId,
        requestBody: event,
      })

      console.log(`✅ Reading task created: ${data.id}`)

      return {
        taskId: data.id!,
      }
    } catch (error: any) {
      console.error('Calendar task creation error:', error)
      throw new Error(`Failed to create reading task: ${error.message}`)
    }
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
