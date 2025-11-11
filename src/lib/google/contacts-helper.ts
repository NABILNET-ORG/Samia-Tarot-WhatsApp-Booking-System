/**
 * 🔍 Google Contacts Helper
 * Check if contact exists and save new contacts
 */

import { google } from 'googleapis'

export async function checkContactExists(
  phoneNumber: string,
  googleCredentials: {
    clientId: string
    clientSecret: string
    refreshToken: string
  }
): Promise<{
  exists: boolean
  contact?: {
    name_english?: string
    name_arabic?: string
    email?: string
    resourceName?: string
  }
}> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      googleCredentials.clientId,
      googleCredentials.clientSecret
    )

    oauth2Client.setCredentials({
      refresh_token: googleCredentials.refreshToken
    })

    const people = google.people({ version: 'v1', auth: oauth2Client })

    // Search for contact by phone number
    const response = await people.people.searchContacts({
      query: phoneNumber.replace(/[^0-9]/g, ''),
      readMask: 'names,phoneNumbers,emailAddresses',
    })

    if (response.data.results && response.data.results.length > 0) {
      const contact = response.data.results[0].person

      return {
        exists: true,
        contact: {
          name_english: contact?.names?.[0]?.displayName,
          email: contact?.emailAddresses?.[0]?.value,
          resourceName: response.data.results[0].person?.resourceName,
        }
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('Error checking Google contact:', error)
    return { exists: false }
  }
}

export async function saveToGoogleContacts(
  customerData: {
    phone: string
    name_english: string
    name_arabic?: string
    email?: string
  },
  googleCredentials: {
    clientId: string
    clientSecret: string
    refreshToken: string
  }
): Promise<{ success: boolean; resourceName?: string }> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      googleCredentials.clientId,
      googleCredentials.clientSecret
    )

    oauth2Client.setCredentials({
      refresh_token: googleCredentials.refreshToken
    })

    const people = google.people({ version: 'v1', auth: oauth2Client })

    const contact = await people.people.createContact({
      requestBody: {
        names: [
          {
            givenName: customerData.name_english,
            displayName: customerData.name_english,
          }
        ],
        phoneNumbers: [
          {
            value: customerData.phone,
            type: 'mobile'
          }
        ],
        emailAddresses: customerData.email ? [
          {
            value: customerData.email,
            type: 'home'
          }
        ] : undefined,
        biographies: customerData.name_arabic ? [
          {
            value: `Arabic name: ${customerData.name_arabic}`,
            contentType: 'TEXT_PLAIN'
          }
        ] : undefined,
      }
    })

    return {
      success: true,
      resourceName: contact.data.resourceName
    }
  } catch (error) {
    console.error('Error saving to Google Contacts:', error)
    return { success: false }
  }
}
