'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Scissors,
  Menu,
  X,
  Calendar,
  Home,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { QuickUserActions, UserMenu } from '@/components/layout/UserMenu'
import { BrandLogo } from '@/components/BrandLogo'

export function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const publicLinks = [{ href: '/', label: 'Início', Icon: Home }]

  return (
    <header className="sticky top-0 z-50 border-b border-amber-100/10 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLogo size="sm" />

        <nav className="hidden items-center gap-4 md:flex">
          {publicLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-amber-100/10 hover:text-amber-100"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          {isAuthenticated && <QuickUserActions />}
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Criar Conta
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-zinc-300 hover:bg-amber-100/10 hover:text-amber-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-amber-100/10 bg-zinc-950 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-amber-100/10 hover:text-amber-100"
              onClick={() => setMobileOpen(false)}
            >
              <Home className="h-4 w-4" />
              Início
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/booking"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-amber-100/10 hover:text-amber-100"
                  onClick={() => setMobileOpen(false)}
                >
                  <Scissors className="h-4 w-4" />
                  Agendar
                </Link>
                <Link
                  href="/my-appointments"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-amber-100/10 hover:text-amber-100"
                  onClick={() => setMobileOpen(false)}
                >
                  <Calendar className="h-4 w-4" />
                  Meus agendamentos
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-amber-100/10 hover:text-amber-100"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Painel admin
                  </Link>
                )}
              </>
            )}
          </nav>
          <div className="mt-3 border-t border-amber-100/10 pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="px-1 text-xs text-zinc-500">
                  {user?.name} · {user?.email}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false)
                    logout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" fullWidth>
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="sm" fullWidth>
                    Criar Conta
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
