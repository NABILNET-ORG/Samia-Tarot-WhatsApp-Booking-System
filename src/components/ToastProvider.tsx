/**
 * 🍞 Toast Notification Provider
 * Global toast notifications using react-hot-toast
 */

'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },

        // Success toast
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },

        // Error toast
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },

        // Loading toast
        loading: {
          duration: Infinity,
        },

        // Dark mode support
        className: 'dark:bg-gray-800 dark:text-white',
      }}
    />
  )
}
