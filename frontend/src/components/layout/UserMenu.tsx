'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Scissors,
  User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isStaffRole } from '@/lib/auth'
import { Button } from '@/components/ui/Button'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const items = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/profile', label: 'Perfil', icon: Settings },
    { href: '/booking', label: 'Agendar', icon: Scissors },
    { href: '/my-appointments', label: 'Meus agendamentos', icon: Calendar },
    ...(isStaffRole(user.role)
      ? [{ href: '/admin', label: 'Painel admin', icon: LayoutDashboard }]
      : []),
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-amber-500/50 hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">
          {user.name}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-[60] mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-xl"
          role="menu"
        >
          <div className="border-b border-slate-800 px-3 py-2">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="py-1">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-amber-400"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
          <div className="border-t border-slate-800 p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Botões de atalho para usuário logado (desktop) */
export function QuickUserActions() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return null

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link href="/booking">
        <Button size="sm" variant="primary" className="gap-1.5">
          <Scissors className="h-3.5 w-3.5" />
          Agendar
        </Button>
      </Link>
      <Link href="/my-appointments">
        <Button size="sm" variant="secondary" className="gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Meus cortes
        </Button>
      </Link>
    </div>
  )
}
