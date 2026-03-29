'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, Menu, Loader2, UserCircle2 } from 'lucide-react'
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
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-white">
            {user.role === 'SUB_ADMIN' ? 'Meu painel' : 'Painel Administrativo'}
          </h1>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-amber-500/40 hover:bg-slate-800 hover:text-amber-400"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Início</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-amber-500/40 hover:bg-slate-800 hover:text-amber-400"
            >
              <UserCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
