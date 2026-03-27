'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  User,
  Clock,
  TrendingUp,
  Scissors,
  History,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface Barber {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string | null
  bio: string | null
  active: boolean
}

interface WorkingHour {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface BarberMetricRow {
  id: string
  name: string
  email: string
  active: boolean
  completedCuts: number
  totalRevenue: number
}

interface BarberHistoryRow {
  id: string
  dateTime: string
  status: 'COMPLETED'
  user: {
    id: string
    name: string
    email: string
  }
  service: {
    id: string
    name: string
    price: number
  }
}

const DAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

const EMPTY_FORM = { name: '', email: '', phone: '', bio: '' }

export default function AdminBarbersPage() {
  const { user } = useAuth()
  const isSub = user?.role === 'SUB_ADMIN'
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [showHoursFor, setShowHoursFor] = useState<string | null>(null)
  const [hours, setHours] = useState<WorkingHour[]>([])
  const [savingHours, setSavingHours] = useState(false)
  const [metrics, setMetrics] = useState<BarberMetricRow[]>([])
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null)
  const [historyRows, setHistoryRows] = useState<BarberHistoryRow[]>([])
  const [historySort, setHistorySort] = useState<'desc' | 'asc'>('desc')
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchBarbers()
  }, [])

  async function fetchBarbers() {
    try {
      const [listRes, metricsRes] = await Promise.all([
        api.get('/barbers'),
        api.get('/barbers/metrics/overview'),
      ])
      setBarbers(listRes.data.data || [])
      setMetrics(metricsRes.data.data || [])
    } catch {
      toast.error('Erro ao carregar barbeiros.')
    } finally {
      setLoading(false)
    }
  }

  function metricFor(barberId: string) {
    return metrics.find((m) => m.id === barberId)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(barber: Barber) {
    setForm({
      name: barber.name,
      email: barber.email,
      phone: barber.phone || '',
      bio: barber.bio || '',
    })
    setEditingId(barber.id)
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/barbers/${editingId}`, form)
        toast.success('Barbeiro atualizado!')
      } else {
        await api.post('/barbers', form)
        toast.success('Barbeiro criado!')
      }
      setShowForm(false)
      await fetchBarbers()
    } catch {
      toast.error('Erro ao salvar barbeiro.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este barbeiro?')) return
    try {
      await api.delete(`/barbers/${id}`)
      toast.success('Barbeiro removido!')
      await fetchBarbers()
    } catch {
      toast.error('Erro ao remover barbeiro.')
    }
  }

  async function openHours(barberId: string) {
    setShowHoursFor(barberId)
    setSavingHours(false)
    try {
      const { data } = await api.get(`/barbers/${barberId}`)
      const savedHours: WorkingHour[] = data.data?.workingHours || []

      const normalized = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const existing = savedHours.find((h) => h.dayOfWeek === dayOfWeek)
        return (
          existing || {
            dayOfWeek,
            startTime: '',
            endTime: '',
          }
        )
      })

      setHours(normalized)
    } catch {
      setHours(
        Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          startTime: '',
          endTime: '',
        }))
      )
      toast.error('Erro ao carregar horários do barbeiro.')
    }
  }

  function updateHour(dayOfWeek: number, field: 'startTime' | 'endTime', value: string) {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      )
    )
  }

  async function saveHours(e: FormEvent) {
    e.preventDefault()
    if (!showHoursFor) return
    setSavingHours(true)
    try {
      const activeHours = hours.filter((h) => h.startTime && h.endTime)
      await api.put(`/barbers/${showHoursFor}/working-hours`, {
        hours: activeHours,
      })
      toast.success('Horários atualizados!')
      setShowHoursFor(null)
      await fetchBarbers()
    } catch {
      toast.error('Erro ao salvar horários.')
    } finally {
      setSavingHours(false)
    }
  }

  async function openHistory(barberId: string) {
    setShowHistoryFor(barberId)
    setHistorySort('desc')
    setLoadingHistory(true)
    try {
      const { data } = await api.get(`/barbers/${barberId}/history?order=desc`)
      setHistoryRows(data.data || [])
    } catch {
      toast.error('Erro ao carregar histórico do barbeiro.')
      setHistoryRows([])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function changeHistoryOrder(order: 'asc' | 'desc') {
    if (!showHistoryFor) return
    setHistorySort(order)
    setLoadingHistory(true)
    try {
      const { data } = await api.get(`/barbers/${showHistoryFor}/history?order=${order}`)
      setHistoryRows(data.data || [])
    } catch {
      toast.error('Erro ao ordenar histórico.')
      setHistoryRows([])
    } finally {
      setLoadingHistory(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isSub ? 'Meu faturamento' : 'Barbeiros'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isSub
              ? 'Consulta dos seus cortes concluídos e faturamento vinculado ao seu perfil.'
              : 'Cortes concluídos e faturamento por profissional (após marcar como concluído em Agendamentos).'}
          </p>
        </div>
        {!isSub && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo Barbeiro
          </Button>
        )}
      </div>

      {metrics.length > 0 && (
        <Card className="mb-6 overflow-x-auto border-slate-700">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Resumo por barbeiro
          </h3>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 pr-4 font-medium">Barbeiro</th>
                <th className="pb-2 pr-4 font-medium">Cortes concluídos</th>
                <th className="pb-2 font-medium">Faturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {metrics.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-4">
                    <span className="font-medium text-white">{m.name}</span>
                    {!m.active && (
                      <span className="ml-2 text-xs text-slate-500">(inativo)</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Scissors className="h-3.5 w-3.5 text-slate-500" />
                      {m.completedCuts}
                    </span>
                  </td>
                  <td className="py-2 font-semibold text-amber-500">
                    R${' '}
                    {Number(m.totalRevenue).toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {showForm && !isSub && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? 'Editar Barbeiro' : 'Novo Barbeiro'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showHoursFor && !isSub && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Horários de Trabalho
            </h3>
            <button
              onClick={() => setShowHoursFor(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={saveHours} className="space-y-3">
            {hours.map((h) => (
              <div
                key={h.dayOfWeek}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 p-3 sm:flex-row sm:items-center"
              >
                <span className="w-24 text-sm font-medium text-slate-300">
                  {DAY_NAMES[h.dayOfWeek]}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={h.startTime}
                    onChange={(e) =>
                      updateHour(h.dayOfWeek, 'startTime', e.target.value)
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                  <span className="text-slate-500">até</span>
                  <input
                    type="time"
                    value={h.endTime}
                    onChange={(e) =>
                      updateHour(h.dayOfWeek, 'endTime', e.target.value)
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {!h.startTime && !h.endTime ? 'Folga' : ''}
                </span>
              </div>
            ))}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowHoursFor(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={savingHours}>
                Salvar Horários
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showHistoryFor && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Histórico de cortes concluídos
              </h3>
              <p className="text-sm text-slate-400">
                Cliente, serviço, data, valor e status.
              </p>
            </div>
            <button
              onClick={() => setShowHistoryFor(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-end gap-2">
            <span className="text-sm text-slate-400">Ordenar por data:</span>
            <select
              value={historySort}
              onChange={(e) => changeHistoryOrder(e.target.value as 'asc' | 'desc')}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="desc">Mais recente</option>
              <option value="asc">Mais antigo</option>
            </select>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : historyRows.length === 0 ? (
            <p className="py-8 text-center text-slate-400">
              Nenhum atendimento concluído para este barbeiro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 pr-4 font-medium">Cliente</th>
                    <th className="pb-2 pr-4 font-medium">Serviço</th>
                    <th className="pb-2 pr-4 font-medium">Data</th>
                    <th className="pb-2 pr-4 font-medium">Valor</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {historyRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 pr-4">
                        <p className="font-medium text-white">{row.user.name}</p>
                        <p className="text-xs text-slate-500">{row.user.email}</p>
                      </td>
                      <td className="py-2 pr-4 text-slate-300">{row.service.name}</td>
                      <td className="py-2 pr-4 text-slate-300">
                        {format(parseISO(row.dateTime), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="py-2 pr-4 font-semibold text-amber-500">
                        R$ {Number(row.service.price).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-2">
                        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                          Concluído
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {barbers.length === 0 ? (
        <Card className="py-12 text-center">
          <User className="mx-auto mb-2 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">Nenhum barbeiro cadastrado.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card key={barber.id}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                  {barber.avatarUrl ? (
                    <img
                      src={barber.avatarUrl}
                      alt={barber.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{barber.name}</h3>
                  <p className="text-sm text-slate-400">{barber.email}</p>
                </div>
              </div>

              {barber.bio && (
                <p className="mb-3 text-sm text-slate-400">{barber.bio}</p>
              )}
              {barber.phone && (
                <p className="mb-3 text-sm text-slate-500">{barber.phone}</p>
              )}

              {(() => {
                const m = metricFor(barber.id)
                if (!m) return null
                return (
                  <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm">
                    <p className="text-slate-400">
                      Cortes concluídos:{' '}
                      <span className="font-semibold text-white">
                        {m.completedCuts}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Faturado:{' '}
                      <span className="font-semibold text-amber-500">
                        R${' '}
                        {Number(m.totalRevenue).toFixed(2).replace('.', ',')}
                      </span>
                    </p>
                  </div>
                )
              })()}

              <div className="flex flex-wrap gap-2">
                {!isSub && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(barber)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openHours(barber.id)}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Horários
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openHistory(barber.id)}
                >
                  <History className="h-3.5 w-3.5" />
                  Histórico
                </Button>
                {!isSub && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(barber.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
