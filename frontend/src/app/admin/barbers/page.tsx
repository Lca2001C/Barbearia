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
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
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

  function openHours(barberId: string) {
    setShowHoursFor(barberId)
    const defaultHours: WorkingHour[] = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: i >= 1 && i <= 5 ? '09:00' : '',
      endTime: i >= 1 && i <= 5 ? '18:00' : '',
    }))
    setHours(defaultHours)
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
    } catch {
      toast.error('Erro ao salvar horários.')
    } finally {
      setSavingHours(false)
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
          <h2 className="text-2xl font-bold text-white">Barbeiros</h2>
          <p className="mt-1 text-sm text-slate-400">
            Cortes concluídos e faturamento por profissional (após marcar como
            concluído em Agendamentos).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Barbeiro
        </Button>
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

      {showForm && (
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

      {showHoursFor && (
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

              <div className="flex gap-2">
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
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(barber.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
