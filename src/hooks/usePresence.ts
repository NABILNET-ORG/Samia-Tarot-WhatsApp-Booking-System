/**
 * 👥 usePresence Hook
 * Track employee online/offline status
 */

'use client'

import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  subscribeToPresence,
  trackPresence,
  unsubscribeChannel,
  PresenceState,
} from '@/lib/realtime/supabase-realtime'

export function usePresence(
  businessId: string | null,
  currentEmployee?: { id: string; name: string } | null
) {
  const [onlineEmployees, setOnlineEmployees] = useState<PresenceState[]>([])
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    if (!businessId) return

    let presenceChannel: RealtimeChannel | null = null
    let trackingChannel: RealtimeChannel | null = null

    // Subscribe to all employees' presence
    presenceChannel = subscribeToPresence(businessId, (presences) => {
      setOnlineEmployees(presences)
    })

    // Track current employee's presence
    if (currentEmployee) {
      trackPresence(businessId, currentEmployee.id, currentEmployee.name).then((channel) => {
        trackingChannel = channel
        setIsTracking(true)
      })
    }

    // Cleanup
    return () => {
      if (presenceChannel) {
        unsubscribeChannel(presenceChannel)
      }
      if (trackingChannel) {
        unsubscribeChannel(trackingChannel)
      }
      setIsTracking(false)
    }
  }, [businessId, currentEmployee?.id, currentEmployee?.name])

  return {
    onlineEmployees,
    isTracking,
    isEmployeeOnline: (employeeId: string) =>
      onlineEmployees.some((e) => e.employee_id === employeeId),
  }
}
