/**
 * 🔐 Roles Management Page
 * Manage custom roles and permissions
 */

'use client'

import { useEffect, useState } from 'react'
import { useBusinessContext } from '@/lib/multi-tenant/context'
import toast from 'react-hot-toast'

type Permission = {
  view?: boolean
  create?: boolean
  edit?: boolean
  delete?: boolean
  takeover?: boolean
  send_message?: boolean
  assign?: boolean
  export?: boolean
  refund?: boolean
  view_revenue?: boolean
  invite?: boolean
  whatsapp?: boolean
  billing?: boolean
  test?: boolean
}

type PermissionsJson = {
  conversations?: Permission
  bookings?: Permission
  customers?: Permission
  services?: Permission
  analytics?: Permission
  employees?: Permission
  settings?: Permission
  prompts?: Permission
  templates?: Permission
  roles?: Permission
}

type Role = {
  id: string
  name: string
  display_name: string
  description?: string
  color: string
  permissions_json: PermissionsJson
  is_system_role: boolean
  is_active: boolean
}

const permissionCategories = [
  {
    key: 'conversations',
    label: 'Conversations',
    actions: ['view', 'takeover', 'send_message', 'assign', 'delete', 'export']
  },
  {
    key: 'bookings',
    label: 'Bookings',
    actions: ['view', 'create', 'edit', 'delete', 'refund']
  },
  {
    key: 'customers',
    label: 'Customers',
    actions: ['view', 'edit', 'delete', 'export']
  },
  {
    key: 'services',
    label: 'Services',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'analytics',
    label: 'Analytics',
    actions: ['view', 'export', 'view_revenue']
  },
  {
    key: 'employees',
    label: 'Employees',
    actions: ['view', 'invite', 'edit', 'delete']
  },
  {
    key: 'settings',
    label: 'Settings',
    actions: ['view', 'edit', 'whatsapp', 'billing']
  },
  {
    key: 'prompts',
    label: 'AI Prompts',
    actions: ['view', 'edit', 'test']
  },
  {
    key: 'templates',
    label: 'Templates',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    key: 'roles',
    label: 'Roles',
    actions: ['view', 'create', 'edit', 'delete']
  }
]

export default function RolesPage() {
  const { business } = useBusinessContext()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    color: '#6B46C1',
    permissions_json: {} as PermissionsJson
  })

  useEffect(() => {
    loadRoles()
  }, [])

  async function loadRoles() {
    try {
      setLoading(true)
      const response = await fetch('/api/roles')
      const data = await response.json()
      if (data.roles) setRoles(data.roles)
    } catch (error) {
      console.error('Failed to load roles:', error)
    } finally {
      setLoading(false)
    }
  }

  function initializePermissions(): PermissionsJson {
    const permissions: PermissionsJson = {}
    permissionCategories.forEach(category => {
      permissions[category.key as keyof PermissionsJson] = {}
      category.actions.forEach(action => {
        if (permissions[category.key as keyof PermissionsJson]) {
          (permissions[category.key as keyof PermissionsJson] as any)[action] = false
        }
      })
    })
    return permissions
  }

  function handleCreateClick() {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      color: '#6B46C1',
      permissions_json: initializePermissions()
    })
    setShowCreateModal(true)
  }

  function handleEditClick(role: Role) {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      color: role.color,
      permissions_json: role.permissions_json
    })
    setShowEditModal(true)
  }

  function handleDeleteClick(role: Role) {
    setSelectedRole(role)
    setShowDeleteModal(true)
  }

  async function handleCreate() {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Role created successfully')
        setShowCreateModal(false)
        loadRoles()
      } else {
        const data = await response.json()
        toast.error(`Failed to create role: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create role:', error)
      toast.error('Failed to create role. Please try again.')
    }
  }

  async function handleUpdate() {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Role updated successfully')
        setShowEditModal(false)
        setSelectedRole(null)
        loadRoles()
      } else {
        const data = await response.json()
        toast.error(`Failed to update role: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role. Please try again.')
    }
  }

  async function handleDelete() {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Role deleted successfully')
        setShowDeleteModal(false)
        setSelectedRole(null)
        loadRoles()
      } else {
        const data = await response.json()
        toast.error(`Failed to delete role: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete role:', error)
      toast.error('Failed to delete role. Please try again.')
    }
  }

  function togglePermission(category: string, action: string) {
    setFormData(prev => ({
      ...prev,
      permissions_json: {
        ...prev.permissions_json,
        [category]: {
          ...(prev.permissions_json[category as keyof PermissionsJson] || {}),
          [action]: !(prev.permissions_json[category as keyof PermissionsJson] as any)?.[action]
        }
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage custom roles and assign permissions</p>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Custom Role
          </button>
        </div>

        {/* Roles Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.display_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{role.name}</p>
                    </div>
                  </div>
                  {role.is_system_role && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 text-xs rounded-full">
                      System
                    </span>
                  )}
                </div>

                {role.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{role.description}</p>
                )}

                {!role.is_system_role && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEditClick(role)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(role)}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <RoleFormModal
            title="Create Custom Role"
            formData={formData}
            setFormData={setFormData}
            onSave={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            togglePermission={togglePermission}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedRole && (
          <RoleFormModal
            title="Edit Role"
            formData={formData}
            setFormData={setFormData}
            onSave={handleUpdate}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedRole(null)
            }}
            togglePermission={togglePermission}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Delete Role
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Are you sure you want to delete <strong>{selectedRole.display_name}</strong>?
                  This action cannot be undone and will fail if employees are assigned to this role.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedRole(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component for the role form modal
function RoleFormModal({
  title,
  formData,
  setFormData,
  onSave,
  onCancel,
  togglePermission
}: {
  title: string
  formData: any
  setFormData: (data: any) => void
  onSave: () => void
  onCancel: () => void
  togglePermission: (category: string, action: string) => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., sales_manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name *</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sales Manager"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this role"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permissions</h3>
            <div className="space-y-4">
              {permissionCategories.map(category => (
                <div key={category.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">{category.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.actions.map(action => {
                      const isChecked = (formData.permissions_json[category.key as keyof PermissionsJson] as any)?.[action] || false
                      return (
                        <label
                          key={action}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(category.key, action)}
                            className="rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200 capitalize">
                            {action.replace(/_/g, ' ')}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
