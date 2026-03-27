'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/contexts/AuthContext'

const Toaster = dynamic(
  () => import('react-hot-toast').then((mod) => mod.Toaster),
  { ssr: false },
)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: { primary: '#f59e0b', secondary: '#0f172a' },
          },
        }}
      />
    </AuthProvider>
  )
}
