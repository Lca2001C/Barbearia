'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  Package,
  X,
  UserCog,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

const baseLinks: Array<{
  href: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}> = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Usuários', icon: UserCog, adminOnly: true },
  { href: '/admin/barbers', label: 'Barbeiros', icon: Users },
  { href: '/admin/services', label: 'Serviços', icon: Scissors },
  { href: '/admin/stock', label: 'Estoque', icon: Package },
  { href: '/admin/appointments', label: 'Agendamentos', icon: Calendar },
]

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const links = baseLinks.filter(
    (link) => !link.adminOnly || user?.role === 'ADMIN',
  )

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
            <span className="font-bold text-white">Admin</span>
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
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
