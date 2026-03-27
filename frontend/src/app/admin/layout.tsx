'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isStaffRole } from '@/lib/auth'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !isStaffRole(user.role))) {
      router.push('/')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!user || !isStaffRole(user.role)) return null

  return (
    <div className="flex min-h-screen">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <header className="flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-950 px-4 lg:px-8">
          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {user.role === 'SUB_ADMIN' ? 'Meu painel' : 'Painel Administrativo'}
          </h1>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
