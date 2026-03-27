'use client'

import { useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Appointment {
  id: string
  dateTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notes?: string
  user: { name: string; email: string }
  barber: { name: string }
  service: { name: string; price: number }
  payment?: { status: string }
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
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterDate, setFilterDate] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    try {
      const { data } = await api.get('/appointments/upcoming')
      setAppointments(data.data || [])
    } catch {
      toast.error('Erro ao carregar agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(id: string) {
    setActionId(id)
    try {
      await api.patch(`/appointments/${id}/complete`)
      toast.success('Agendamento concluído!')
      fetchAppointments()
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
      fetchAppointments()
    } catch {
      toast.error('Erro ao cancelar agendamento.')
    } finally {
      setActionId(null)
    }
  }

  const filtered = appointments.filter((appt) => {
    if (filterStatus !== 'ALL' && appt.status !== filterStatus) return false
    if (filterDate) {
      const apptDate = format(parseISO(appt.dateTime), 'yyyy-MM-dd')
      if (apptDate !== filterDate) return false
    }
    return true
  })

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
