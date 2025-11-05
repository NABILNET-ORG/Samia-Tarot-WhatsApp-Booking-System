/**
 * 🔐 RBAC Permission System
 * Permission definitions and checking utilities
 */

import { BusinessContext } from '@/lib/multi-tenant/middleware'

/**
 * Default permission structure for all roles
 */
export const DEFAULT_PERMISSIONS = {
  // Business settings
  businesses: {
    read: false,
    update: false,
    delete: false,
    list: false,
  },
  
  // Employee management
  employees: {
    create: false,
    read: false,
    update: false,
    delete: false,
    list: false,
  },
  
  // Role management
  roles: {
    create: false,
    read: false,
    update: false,
    delete: false,
    list: false,
  },
  
  // Conversation management
  conversations: {
    read: false,
    list: false,
    takeover: false,
    close: false,
    assign: false,
  },
  
  // Customer management
  customers: {
    read: false,
    update: false,
    delete: false,
    list: false,
    export: false,
  },
  
  // Analytics & reporting
  analytics: {
    view: false,
    export: false,
  },
  
  // Template management
  templates: {
    create: false,
    read: false,
    update: false,
    delete: false,
    list: false,
  },
}

/**
 * System role permissions
 */
export const ROLE_PERMISSIONS = {
  admin: {
    businesses: { read: true, update: true, delete: false, list: true },
    employees: { create: true, read: true, update: true, delete: true, list: true },
    roles: { create: true, read: true, update: true, delete: true, list: true },
    conversations: { read: true, list: true, takeover: true, close: true, assign: true },
    customers: { read: true, update: true, delete: true, list: true, export: true },
    analytics: { view: true, export: true },
    templates: { create: true, read: true, update: true, delete: true, list: true },
  },
  
  manager: {
    businesses: { read: true, update: false, delete: false, list: false },
    employees: { create: false, read: true, update: false, delete: false, list: true },
    roles: { create: false, read: true, update: false, delete: false, list: true },
    conversations: { read: true, list: true, takeover: true, close: true, assign: true },
    customers: { read: true, update: true, delete: false, list: true, export: true },
    analytics: { view: true, export: true },
    templates: { create: true, read: true, update: true, delete: false, list: true },
  },
  
  agent: {
    businesses: { read: false, update: false, delete: false, list: false },
    employees: { create: false, read: false, update: false, delete: false, list: false },
    roles: { create: false, read: false, update: false, delete: false, list: false },
    conversations: { read: true, list: true, takeover: true, close: false, assign: false },
    customers: { read: true, update: false, delete: false, list: true, export: false },
    analytics: { view: false, export: false },
    templates: { create: false, read: true, update: false, delete: false, list: true },
  },
  
  viewer: {
    businesses: { read: false, update: false, delete: false, list: false },
    employees: { create: false, read: false, update: false, delete: false, list: false },
    roles: { create: false, read: false, update: false, delete: false, list: false },
    conversations: { read: true, list: true, takeover: false, close: false, assign: false },
    customers: { read: true, update: false, delete: false, list: true, export: false },
    analytics: { view: false, export: false },
    templates: { create: false, read: true, update: false, delete: false, list: true },
  },
}

/**
 * Check if employee has specific permission
 */
export function checkPermission(
  context: BusinessContext,
  resource: string,
  action: string
): boolean {
  const permissions = context.employee.permissions

  // Navigate nested permission object
  if (!permissions[resource]) {
    return false
  }

  if (typeof permissions[resource] === 'boolean') {
    return permissions[resource]
  }

  if (typeof permissions[resource] === 'object') {
    return permissions[resource][action] === true
  }

  return false
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleName: string): Record<string, any> {
  return ROLE_PERMISSIONS[roleName as keyof typeof ROLE_PERMISSIONS] || DEFAULT_PERMISSIONS
}

/**
 * Merge role permissions with custom permissions
 * Custom permissions override role permissions
 */
export function mergePermissions(
  rolePermissions: Record<string, any>,
  customPermissions: Record<string, any>
): Record<string, any> {
  const merged = { ...rolePermissions }

  for (const resource in customPermissions) {
    if (typeof customPermissions[resource] === 'object' && !Array.isArray(customPermissions[resource])) {
      merged[resource] = {
        ...merged[resource],
        ...customPermissions[resource],
      }
    } else {
      merged[resource] = customPermissions[resource]
    }
  }

  return merged
}

/**
 * Validate permission structure
 */
export function validatePermissions(permissions: any): boolean {
  if (typeof permissions !== 'object' || permissions === null) {
    return false
  }

  // Check if all top-level keys exist in DEFAULT_PERMISSIONS
  for (const resource in permissions) {
    if (!(resource in DEFAULT_PERMISSIONS)) {
      return false
    }

    // Check if all actions are boolean
    for (const action in permissions[resource]) {
      if (typeof permissions[resource][action] !== 'boolean') {
        return false
      }
    }
  }

  return true
}

/**
 * Get list of permissions for UI display
 */
export function getPermissionsList(): Array<{
  resource: string
  actions: string[]
  description: string
}> {
  return [
    {
      resource: 'businesses',
      actions: ['read', 'update', 'delete', 'list'],
      description: 'Manage business settings and configuration',
    },
    {
      resource: 'employees',
      actions: ['create', 'read', 'update', 'delete', 'list'],
      description: 'Manage team members and employee accounts',
    },
    {
      resource: 'roles',
      actions: ['create', 'read', 'update', 'delete', 'list'],
      description: 'Manage roles and permissions',
    },
    {
      resource: 'conversations',
      actions: ['read', 'list', 'takeover', 'close', 'assign'],
      description: 'View and manage customer conversations',
    },
    {
      resource: 'customers',
      actions: ['read', 'update', 'delete', 'list', 'export'],
      description: 'Manage customer data and profiles',
    },
    {
      resource: 'analytics',
      actions: ['view', 'export'],
      description: 'Access analytics and reporting',
    },
    {
      resource: 'templates',
      actions: ['create', 'read', 'update', 'delete', 'list'],
      description: 'Manage AI prompt templates and canned responses',
    },
  ]
}
