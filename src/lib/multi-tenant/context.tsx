/**
 * 🏢 Business Context Provider
 * React context for multi-tenant state management
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Business = {
  id: string
  name: string
  slug: string
  industry: string | null
  logo_url: string | null
  subscription_tier: string
  subscription_status: string
  is_active: boolean
}

export type Employee = {
  id: string
  email: string
  full_name: string
  role_id: string
  role_name: string
  avatar_url: string | null
  is_online: boolean
  permissions: Record<string, any>
}

export type BusinessContextType = {
  business: Business | null
  employee: Employee | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  hasPermission: (resource: string, action: string) => boolean
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

/**
 * Hook to use business context
 */
export function useBusinessContext(): BusinessContextType {
  const context = useContext(BusinessContext)
  
  if (!context) {
    throw new Error('useBusinessContext must be used within BusinessProvider')
  }
  
  return context
}

/**
 * Provider component
 */
export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch current business context from API
   */
  const fetchContext = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/context')
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - redirect to login
          window.location.href = '/login'
          return
        }
        throw new Error('Failed to fetch business context')
      }

      const data = await response.json()
      setBusiness(data.business)
      setEmployee(data.employee)
    } catch (err: any) {
      setError(err.message)
      console.error('Business context error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check if employee has permission
   */
  const hasPermission = (resource: string, action: string): boolean => {
    if (!employee?.permissions) return false

    const resourcePerms = employee.permissions[resource]
    
    if (!resourcePerms) return false
    
    if (typeof resourcePerms === 'boolean') return resourcePerms
    
    if (typeof resourcePerms === 'object') {
      return resourcePerms[action] === true
    }
    
    return false
  }

  useEffect(() => {
    fetchContext()
  }, [])

  const value: BusinessContextType = {
    business,
    employee,
    loading,
    error,
    refetch: fetchContext,
    hasPermission,
  }

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

/**
 * HOC to require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { employee, loading } = useBusinessContext()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!employee) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return null
    }

    return <Component {...props} />
  }
}

/**
 * HOC to require specific permission
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  resource: string,
  action: string
): React.FC<P> {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission, loading } = useBusinessContext()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!hasPermission(resource, action)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You don't have permission to {action} {resource}
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
