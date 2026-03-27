'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Eye,
  Filter,
  Loader2,
  Phone,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface UserRow {
  id: string
  name: string
  email: string
  username?: string | null
  phone?: string | null
  role: 'ADMIN' | 'CLIENT' | 'SUB_ADMIN'
  managedBarberId?: string | null
  createdAt?: string
}

interface UserDetails extends UserRow {
  updatedAt?: string
}

interface BarberOption {
  id: string
  name: string
  active: boolean
}

type UiRole = 'ADMIN' | 'SUB_ADMIN' | 'USER'

function uiRoleLabel(role: UserRow['role']): UiRole {
  if (role === 'ADMIN') return 'ADMIN'
  if (role === 'SUB_ADMIN') return 'SUB_ADMIN'
  return 'USER'
}

const ROLE_BADGE: Record<UiRole, string> = {
  ADMIN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SUB_ADMIN: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  USER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [barbers, setBarbers] = useState<BarberOption[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [details, setDetails] = useState<UserDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [subModalOpen, setSubModalOpen] = useState(false)
  const [subTarget, setSubTarget] = useState<UserRow | null>(null)
  const [subBarberId, setSubBarberId] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | UiRole>('ALL')

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'ADMIN') {
      router.replace('/admin')
      return
    }
    Promise.all([api.get('/users'), api.get('/barbers')])
      .then(([uRes, bRes]) => {
        setUsers(uRes.data.data || [])
        setBarbers((bRes.data.data || []).filter((b: BarberOption) => b.active))
      })
      .catch(() => toast.error('Erro ao carregar usuários.'))
      .finally(() => setLoading(false))
  }, [authLoading, user, router])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((row) => {
      const label = uiRoleLabel(row.role)
      if (filterType !== 'ALL' && label !== filterType) return false
      if (!q) return true
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.phone && row.phone.toLowerCase().includes(q))
      )
    })
  }, [users, search, filterType])
  const hasAdmin = users.some((u) => u.role === 'ADMIN')

  async function saveRole(u: UserRow, role: 'ADMIN' | 'USER') {
    setSavingId(u.id)
    try {
      await api.patch(`/users/${u.id}/role`, { role })
      toast.success('Permissões atualizadas.')
      const { data } = await api.get('/users')
      setUsers(data.data || [])
      if (details?.id === u.id) void loadDetails(u.id, false)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Não foi possível atualizar.'
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  async function saveSubAdmin() {
    if (!subTarget) return
    if (!subBarberId) {
      toast.error('Selecione um barbeiro para vincular o SUB_ADMIN.')
      return
    }
    setSavingId(subTarget.id)
    try {
      await api.patch(`/users/${subTarget.id}/role`, {
        role: 'SUB_ADMIN',
        managedBarberId: subBarberId,
      })
      toast.success('Usuário definido como SUB_ADMIN.')
      const { data } = await api.get('/users')
      setUsers(data.data || [])
      setSubModalOpen(false)
      setSubTarget(null)
      setSubBarberId('')
      if (details?.id === subTarget.id) void loadDetails(subTarget.id, false)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Não foi possível definir SUB_ADMIN.'
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  function openSubAdminModal(target: UserRow) {
    setSubTarget(target)
    setSubBarberId(target.managedBarberId ?? '')
    setSubModalOpen(true)
  }

  async function loadDetails(userId: string, openModal = true) {
    setLoadingDetails(true)
    if (openModal) {
      setDetailsOpen(true)
      setDetails(null)
    }
    try {
      const { data } = await api.get(`/users/${userId}`)
      setDetails(data.data)
    } catch {
      toast.error('Não foi possível carregar o perfil.')
      setDetailsOpen(false)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Deseja remover este usuário?')) return
    setSavingId(userId)
    try {
      await api.delete(`/users/${userId}`)
      toast.success('Usuário removido.')
      const { data } = await api.get('/users')
      setUsers(data.data || [])
      if (details?.id === userId) {
        setDetails(null)
        setDetailsOpen(false)
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Falha ao remover usuário.'
      toast.error(msg)
    } finally {
      setSavingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
          <p className="mt-1 text-sm text-slate-400">
            Lista no mesmo estilo dos agendamentos: filtros, cartões e ações administrativas.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-slate-400">
              <Filter className="h-4 w-4 shrink-0" />
              <span className="text-sm">Filtrar</span>
            </div>
            <Input
              id="admin-users-search"
              label=""
              placeholder="Buscar por nome, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-md"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-400">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="h-11 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
            >
              <option value="ALL">Todos</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUB_ADMIN">SUB_ADMIN</option>
              <option value="USER">USER</option>
            </select>
            {(search || filterType !== 'ALL') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setFilterType('ALL')
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <User className="mx-auto mb-2 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">Nenhum usuário encontrado.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const typeLabel = uiRoleLabel(row.role)
            const isAdmin = typeLabel === 'ADMIN'
            const isSubAdmin = typeLabel === 'SUB_ADMIN'
            const created = row.createdAt
              ? new Date(row.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'

            return (
              <Card key={row.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{row.name}</p>
                      <p className="text-sm text-slate-400">{row.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm lg:flex-1 lg:justify-center">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {row.phone?.trim() || '—'}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {created}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[typeLabel]}`}
                    >
                      {typeLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {!isAdmin && !isSubAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={savingId === row.id}
                        onClick={() => openSubAdminModal(row)}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Definir SUB_ADMIN
                      </Button>
                    )}
                    {isSubAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={savingId === row.id}
                        onClick={() => saveRole(row, 'USER')}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Rebaixar para USER
                      </Button>
                    )}
                    {isSubAdmin && !hasAdmin && (
                      <Button
                        size="sm"
                        loading={savingId === row.id}
                        onClick={() => saveRole(row, 'ADMIN')}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Promover para ADMIN
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => loadDetails(row.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Perfil
                    </Button>
                    {!isAdmin && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={savingId === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {detailsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-details-title"
        >
          <Card className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-2xl shadow-black/40">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              onClick={() => {
                setDetailsOpen(false)
                setDetails(null)
              }}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 id="user-details-title" className="mb-4 pr-10 text-lg font-semibold text-white">
              Perfil detalhado
            </h3>
            {loadingDetails ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              </div>
            ) : !details ? (
              <p className="text-sm text-slate-400">Não foi possível carregar.</p>
            ) : (
              <div className="grid gap-3 text-sm">
                <p>
                  <span className="text-slate-400">Nome:</span>{' '}
                  <span className="text-white">{details.name}</span>
                </p>
                <p>
                  <span className="text-slate-400">E-mail:</span>{' '}
                  <span className="text-white">{details.email}</span>
                </p>
                {details.username ? (
                  <p>
                    <span className="text-slate-400">Username:</span>{' '}
                    <span className="text-white">{details.username}</span>
                  </p>
                ) : null}
                <p>
                  <span className="text-slate-400">Telefone:</span>{' '}
                  <span className="text-white">{details.phone || '—'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Tipo (interface):</span>{' '}
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[uiRoleLabel(details.role)]}`}
                  >
                    {uiRoleLabel(details.role)}
                  </span>
                </p>
                {details.role === 'SUB_ADMIN' && (
                  <p>
                    <span className="text-slate-400">Barbeiro vinculado:</span>{' '}
                    <span className="text-white">
                      {barbers.find((b) => b.id === details.managedBarberId)?.name || '—'}
                    </span>
                  </p>
                )}
                <p>
                  <span className="text-slate-400">Criado em:</span>{' '}
                  <span className="text-white">
                    {details.createdAt
                      ? new Date(details.createdAt).toLocaleString('pt-BR')
                      : '—'}
                  </span>
                </p>
                {details.updatedAt ? (
                  <p>
                    <span className="text-slate-400">Atualizado em:</span>{' '}
                    <span className="text-white">
                      {new Date(details.updatedAt).toLocaleString('pt-BR')}
                    </span>
                  </p>
                ) : null}
              </div>
            )}
          </Card>
        </div>
      )}

      {subModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Definir SUB_ADMIN</h3>
              <button
                type="button"
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                onClick={() => {
                  setSubModalOpen(false)
                  setSubTarget(null)
                  setSubBarberId('')
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-slate-400">
              Usuário: <span className="text-white">{subTarget?.name || '—'}</span>
            </p>
            <label className="mb-2 block text-sm text-slate-300">Barbeiro vinculado</label>
            <select
              value={subBarberId}
              onChange={(e) => setSubBarberId(e.target.value)}
              className="mb-5 h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
            >
              <option value="">Selecione</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSubModalOpen(false)
                  setSubTarget(null)
                  setSubBarberId('')
                }}
              >
                Cancelar
              </Button>
              <Button
                loading={savingId === subTarget?.id}
                onClick={saveSubAdmin}
              >
                Salvar SUB_ADMIN
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
