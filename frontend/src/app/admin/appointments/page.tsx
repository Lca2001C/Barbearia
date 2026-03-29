'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import axios from 'axios'
import {
  Calendar,
  Clock,
  Loader2,
  User,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface Appointment {
  id: string
  userId: string
  barberId: string
  serviceId: string
  dateTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notes?: string
  user: { name: string; email: string }
  barber: { id?: string; name: string }
  service: { name: string; price: number }
  payment?: { status: string }
}

interface UserOption {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CLIENT'
}

interface BarberOption {
  id: string
  name: string
  active: boolean
}

interface ServiceOption {
  id: string
  name: string
  price: number
  active: boolean
}

interface Slot {
  time: string
  available: boolean
  reservedKind?: 'active' | 'completed'
}

const EMPTY_FORM = {
  userId: '',
  barberId: '',
  serviceId: '',
  dateTime: '',
  status: 'CONFIRMED' as Appointment['status'],
  notes: '',
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as {
      error?: { message?: string; issues?: { message: string }[] }
    }
    const msg = data?.error?.message
    if (typeof msg === 'string' && msg.length > 0) return msg
    const issues = data?.error?.issues
    if (Array.isArray(issues) && issues.length > 0) {
      return issues.map((i) => i.message).join(' · ')
    }
    if (err.response?.status === 409)
      return 'Horário indisponível. Escolha outro horário.'
    if (err.response?.status === 401) return 'Sessão expirada. Faça login novamente.'
    if (err.response?.status === 403) return 'Você não tem permissão para essa ação.'
  }
  return fallback
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: 'Pendente',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  CONFIRMED: {
    label: 'Confirmado',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
}

export default function AdminAppointmentsPage() {
  const { user } = useAuth()
  const isSub = user?.role === 'SUB_ADMIN'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [barbers, setBarbers] = useState<BarberOption[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterDate, setFilterDate] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [appointmentsRes, usersRes, barbersRes, servicesRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/users/clients'),
        api.get('/barbers'),
        api.get('/services'),
      ])
      setAppointments(appointmentsRes.data.data || [])
      setUsers(usersRes.data.data || [])
      setBarbers((barbersRes.data.data || []).filter((b: BarberOption) => b.active))
      setServices((servicesRes.data.data || []).filter((s: ServiceOption) => s.active))
    } catch {
      toast.error('Erro ao carregar agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  function toDateTimeInputValue(value: string) {
    return format(parseISO(value), "yyyy-MM-dd'T'HH:mm")
  }

  async function fetchSlotsForForm(nextForm = form) {
    const dateStr = nextForm.dateTime?.slice(0, 10)
    if (!nextForm.barberId || !nextForm.serviceId || !dateStr) {
      setSlots([])
      return
    }

    setLoadingSlots(true)
    try {
      let url = `/barbers/${nextForm.barberId}/availability?date=${dateStr}&serviceId=${encodeURIComponent(nextForm.serviceId)}`
      if (editingId && nextForm.status !== 'COMPLETED') {
        url += `&excludeAppointmentId=${encodeURIComponent(editingId)}`
      }
      const { data } = await api.get(url)
      setSlots(data.data || [])
    } catch {
      setSlots([])
      toast.error('Não foi possível carregar os horários do dia.')
    } finally {
      setLoadingSlots(false)
    }
  }

  function openCreate() {
    const next = { ...EMPTY_FORM }
    if (isSub && user?.managedBarberId) {
      next.barberId = user.managedBarberId
    }
    setForm(next)
    setEditingId(null)
    setShowForm(true)
    setSlots([])
  }

  function openEdit(appt: Appointment) {
    const next = {
      userId: appt.userId,
      barberId: appt.barberId,
      serviceId: appt.serviceId,
      dateTime: toDateTimeInputValue(appt.dateTime),
      status: appt.status,
      notes: appt.notes || '',
    }
    setForm(next)
    setEditingId(appt.id)
    setShowForm(true)
    fetchSlotsForForm(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        userId: form.userId,
        barberId: form.barberId,
        serviceId: form.serviceId,
        dateTime: new Date(form.dateTime).toISOString(),
        status: form.status,
        notes: form.notes || undefined,
      }

      if (editingId) {
        await api.patch(`/appointments/${editingId}`, payload)
        toast.success('Agendamento atualizado!')
      } else {
        await api.post('/appointments/admin', payload)
        toast.success('Agendamento criado!')
      }

      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      await fetchData()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Erro ao salvar agendamento.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return
    setActionId(id)
    try {
      await api.delete(`/appointments/${id}`)
      toast.success('Agendamento excluído!')
      await fetchData()
    } catch {
      toast.error('Erro ao excluir agendamento.')
    } finally {
      setActionId(null)
    }
  }

  async function handleComplete(id: string) {
    setActionId(id)
    try {
      await api.patch(`/appointments/${id}/complete`)
      toast.success('Agendamento concluído!')
      await fetchData()
      if (showForm && editingId === id) {
        const nextForm = { ...form, status: 'COMPLETED' as Appointment['status'] }
        setForm(nextForm)
        await fetchSlotsForForm(nextForm)
      }
    } catch {
      toast.error('Erro ao concluir agendamento.')
    } finally {
      setActionId(null)
    }
  }

  async function handleCancel(id: string) {
    setActionId(id)
    try {
      await api.patch(`/appointments/${id}/cancel`)
      toast.success('Agendamento cancelado!')
      fetchData()
    } catch {
      toast.error('Erro ao cancelar agendamento.')
    } finally {
      setActionId(null)
    }
  }

  const filtered = useMemo(() => appointments.filter((appt) => {
    if (filterStatus !== 'ALL' && appt.status !== filterStatus) return false
    if (filterDate) {
      const apptDate = format(parseISO(appt.dateTime), 'yyyy-MM-dd')
      if (apptDate !== filterDate) return false
    }
    return true
  }), [appointments, filterStatus, filterDate])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-white">Agendamentos</h2>

      <div className="mb-6 flex justify-end">
        <Button onClick={openCreate}>
          <Calendar className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setForm(EMPTY_FORM)
                setSlots([])
              }}
              className="text-slate-400 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Cliente</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
                  required
                >
                  <option value="">Selecione</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Barbeiro</label>
                <select
                  value={form.barberId}
                  onChange={(e) => {
                    const next = { ...form, barberId: e.target.value }
                    setForm(next)
                    fetchSlotsForForm(next)
                  }}
                  disabled={isSub}
                  title={isSub ? 'Vinculado ao seu perfil de barbeiro' : undefined}
                  className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                  required
                >
                  <option value="">Selecione</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Serviço</label>
                <select
                  value={form.serviceId}
                  onChange={(e) => {
                    const next = { ...form, serviceId: e.target.value }
                    setForm(next)
                    fetchSlotsForForm(next)
                  }}
                  className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
                  required
                >
                  <option value="">Selecione</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (R$ {Number(s.price).toFixed(2).replace('.', ',')})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Data e hora"
                type="datetime-local"
                value={form.dateTime}
                onChange={(e) => {
                  const next = { ...form, dateTime: e.target.value }
                  setForm(next)
                  fetchSlotsForForm(next)
                }}
                required
              />

              <div>
                <label className="mb-1 block text-sm text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => {
                    const status = e.target.value as Appointment['status']
                    setForm((prev) => {
                      const next = { ...prev, status }
                      void fetchSlotsForForm(next)
                      return next
                    })
                  }}
                  className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="COMPLETED">Concluído</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm text-slate-300">
                  Horários do dia (mostra reservados)
                </label>
                <span className="text-xs text-slate-500">
                  {form.barberId && form.serviceId && form.dateTime?.slice(0, 10)
                    ? `Data: ${format(
                        parseISO(`${form.dateTime.slice(0, 10)}T00:00:00`),
                        'dd/MM/yyyy',
                        { locale: ptBR },
                      )}`
                    : 'Selecione barbeiro, serviço e data'}
                </span>
              </div>

              {loadingSlots ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-3 text-sm text-slate-400">
                  {form.barberId && form.serviceId && form.dateTime?.slice(0, 10)
                    ? 'Sem horários configurados/disponíveis para esse dia.'
                    : 'Escolha barbeiro, serviço e uma data para carregar os horários.'}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {slots.map((slot) => {
                    const dateStr = form.dateTime.slice(0, 10)
                    const selectedTime = form.dateTime.slice(11, 16)
                    const isSelected = selectedTime === slot.time
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            dateTime: `${dateStr}T${slot.time}`,
                          }))
                        }
                        className={`
                          rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                          ${
                            isSelected && slot.available
                              ? 'bg-amber-500 text-slate-950'
                              : slot.available
                                ? 'border border-slate-700 bg-slate-800 text-white hover:border-amber-500'
                                : 'cursor-not-allowed border border-slate-800 bg-slate-900/30 text-slate-500 opacity-60'
                          }
                        `}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span>{slot.time}</span>
                          {!slot.available && (
                            <span className="text-[11px] font-medium text-slate-500">
                              {slot.reservedKind === 'completed'
                                ? 'Concluído'
                                : 'Reservado'}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Observações</label>
              <textarea
                value={form.notes}
                rows={3}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                placeholder="Opcional"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setForm(EMPTY_FORM)
                  setSlots([])
                }}
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

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Filtrar:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          >
            <option value="ALL">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="COMPLETED">Concluído</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          />
          {(filterStatus !== 'ALL' || filterDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus('ALL')
                setFilterDate('')
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">Nenhum agendamento encontrado.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => {
            const statusCfg =
              STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING
            const canComplete = appt.status === 'CONFIRMED'
            const canCancel =
              appt.status === 'PENDING' || appt.status === 'CONFIRMED'

            return (
              <Card key={appt.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {appt.user?.name || 'Cliente'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {appt.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-slate-300">{appt.service.name}</span>
                    <span className="text-slate-400">
                      com {appt.barber.name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(appt.dateTime), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {format(parseISO(appt.dateTime), 'HH:mm')}
                    </span>
                    <span className="font-medium text-amber-500">
                      R${' '}
                      {Number(appt.service.price).toFixed(2).replace('.', ',')}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}
                    >
                      {statusCfg.label}
                    </span>
                    {appt.payment && (
                      <span className="text-xs text-slate-500">
                        Pag: {appt.payment.status}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEdit(appt)}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    {canComplete && (
                      <Button
                        size="sm"
                        loading={actionId === appt.id}
                        onClick={() => handleComplete(appt.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Concluir
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={actionId === appt.id}
                        onClick={() => handleCancel(appt.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      loading={actionId === appt.id}
                      onClick={() => handleDelete(appt.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
