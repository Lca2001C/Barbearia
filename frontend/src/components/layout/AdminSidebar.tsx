'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Scissors,
  Calendar,
  Package,
  Home,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

const allLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/barbers', label: 'Barbeiros', icon: UsersRound },
  { href: '/admin/services', label: 'Serviços', icon: Scissors, adminOnly: true },
  { href: '/admin/stock', label: 'Estoque', icon: Package },
  { href: '/admin/appointments', label: 'Agendamentos', icon: Calendar },
  {
    href: '/admin/users',
    label: 'Gerenciamento de Usuários',
    icon: Users,
    adminOnly: true,
  },
] as const

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isSub = user?.role === 'SUB_ADMIN'

  const links = allLinks.filter((link) => {
    if ('adminOnly' in link && link.adminOnly) return !isSub
    return true
  })

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r
          border-slate-800 bg-slate-900 transition-transform duration-300
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Cia do Disfarce
            </span>
            <span className="font-bold text-white">
              {isSub ? 'Sub-admin' : 'Admin'}
            </span>
          </div>
          <button className="text-slate-400 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-colors
                  ${
                    active
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 leading-snug">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Home className="h-5 w-5 shrink-0" />
            <span>Voltar ao início</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
