/**
 * 👥 Google Contacts Integration
 * Save customer contacts to Google after successful payment
 */

import { google } from 'googleapis'

// Initialize Google People API (Contacts)
function getContactsClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })

  return google.people({ version: 'v1', auth: oauth2Client })
}

export type ContactData = {
  firstName: string
  lastName?: string
  nickname?: string
  phone: string
  email?: string
  notes?: string
}

export class ContactsHelpers {
  /**
   * Search for existing contact by phone number
   */
  static async findContactByPhone(phone: string): Promise<any | null> {
    try {
      const people = getContactsClient()

      // Search for contact by phone number
      const { data } = await people.people.searchContacts({
        query: phone.replace(/\D/g, ''), // Remove non-digits
        readMask: 'names,emailAddresses,phoneNumbers,nicknames',
      })

      if (data.results && data.results.length > 0) {
        const contact = data.results[0].person
        console.log(`✅ Found existing contact in Google: ${contact?.names?.[0]?.displayName}`)
        return contact
      }

      return null
    } catch (error: any) {
      console.error('❌ Error searching contacts:', error)
      return null
    }
  }

  /**
   * Save customer contact to Google Contacts
   */
  static async saveContact(contactData: ContactData): Promise<{ resourceName: string; vCardUrl?: string }> {
    try {
      const people = getContactsClient()

      // Build contact resource
      const contact: any = {
        names: [
          {
            givenName: contactData.firstName,
            familyName: contactData.lastName || '',
          },
        ],
        phoneNumbers: [
          {
            value: contactData.phone,
            type: 'mobile',
          },
        ],
      }

      // Add nickname (Arabic name)
      if (contactData.nickname) {
        contact.nicknames = [
          {
            value: contactData.nickname,
            type: 'default',
          },
        ]
      }

      // Add email
      if (contactData.email) {
        contact.emailAddresses = [
          {
            value: contactData.email,
            type: 'home',
          },
        ]
      }

      // Add notes
      if (contactData.notes) {
        contact.biographies = [
          {
            value: contactData.notes,
            contentType: 'TEXT_PLAIN',
          },
        ]
      }

      // Create contact
      const { data } = await people.people.createContact({
        requestBody: contact,
      })

      console.log(`✅ Contact saved to Google: ${data.resourceName}`)

      return {
        resourceName: data.resourceName!,
        vCardUrl: `https://contacts.google.com/person/${data.resourceName}`,
      }
    } catch (error: any) {
      console.error('❌ Error saving contact to Google:', error)
      throw new Error(`Failed to save contact: ${error.message}`)
    }
  }

  /**
   * Generate vCard format for WhatsApp sharing
   */
  static generateVCard(contactData: ContactData): string {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contactData.firstName}${contactData.lastName ? ' ' + contactData.lastName : ''}`,
      contactData.lastName ? `N:${contactData.lastName};${contactData.firstName};;;` : `N:;${contactData.firstName};;;`,
      contactData.nickname ? `NICKNAME:${contactData.nickname}` : '',
      `TEL;TYPE=CELL:${contactData.phone}`,
      contactData.email ? `EMAIL;TYPE=HOME:${contactData.email}` : '',
      contactData.notes ? `NOTE:${contactData.notes}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n')

    return vcard
  }

  /**
   * Format contact details for WhatsApp message
   */
  static formatContactMessage(
    contactData: ContactData,
    booking: any,
    service: any,
    language: 'ar' | 'en'
  ): string {
    if (language === 'ar') {
      return (
        `📇 بيانات العميل الجديد\n\n` +
        `👤 الاسم: ${contactData.firstName}${contactData.lastName ? ' ' + contactData.lastName : ''}\n` +
        `${contactData.nickname ? `🏷️ الاسم العربي: ${contactData.nickname}\n` : ''}` +
        `📱 الهاتف: ${contactData.phone}\n` +
        `${contactData.email ? `📧 البريد: ${contactData.email}\n` : ''}` +
        `\n━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔮 الخدمة: ${service.name_arabic}\n` +
        `💰 المبلغ: $${service.price}\n` +
        `📲 رقم الحجز: ${booking.id.substring(0, 8)}\n` +
        `📅 التاريخ: ${new Date(booking.scheduled_date).toLocaleDateString('ar-EG')}\n\n` +
        `✅ تم حفظ جهة الاتصال في Google Contacts`
      )
    } else {
      return (
        `📇 New Customer Contact\n\n` +
        `👤 Name: ${contactData.firstName}${contactData.lastName ? ' ' + contactData.lastName : ''}\n` +
        `${contactData.nickname ? `🏷️ Arabic Name: ${contactData.nickname}\n` : ''}` +
        `📱 Phone: ${contactData.phone}\n` +
        `${contactData.email ? `📧 Email: ${contactData.email}\n` : ''}` +
        `\n━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔮 Service: ${service.name_english}\n` +
        `💰 Amount: $${service.price}\n` +
        `📲 Booking: ${booking.id.substring(0, 8)}\n` +
        `📅 Date: ${new Date(booking.scheduled_date).toLocaleDateString('en-US')}\n\n` +
        `✅ Contact saved to Google Contacts`
      )
    }
  }

  /**
   * Extract first and last name from full name
   */
  static parseFullName(fullName: string): { firstName: string; lastName?: string } {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) {
      return { firstName: parts[0] }
    }
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ')
    return { firstName, lastName }
  }
}
