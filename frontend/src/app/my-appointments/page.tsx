'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Loader2, User, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Appointment {
  id: string
  dateTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notes?: string
  barber: { id: string; name: string }
  service: { id: string; name: string; price: number; duration: number }
  payment?: { id: string; status: string; amount: number }
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  COMPLETED: { label: 'Concluído', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
}

export default function MyAppointmentsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments()
    }
  }, [isAuthenticated])

  async function fetchAppointments() {
    try {
      const { data } = await api.get('/appointments')
      setAppointments(data.data || [])
    } catch {
      toast.error('Erro ao carregar agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id: string) {
    setCancellingId(id)
    try {
      await api.patch(`/appointments/${id}/cancel`)
      toast.success('Agendamento cancelado.')
      fetchAppointments()
    } catch {
      toast.error('Erro ao cancelar agendamento.')
    } finally {
      setCancellingId(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-white">
          Meus Agendamentos
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="py-16 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <h2 className="text-xl font-semibold text-white">
              Nenhum agendamento
            </h2>
            <p className="mt-2 text-slate-400">
              Você ainda não tem agendamentos. Que tal marcar um horário?
            </p>
            <Button className="mt-6" onClick={() => router.push('/booking')}>
              Agendar Agora
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => {
              const statusCfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING
              const canCancel =
                appt.status === 'PENDING' || appt.status === 'CONFIRMED'

              return (
                <Card key={appt.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {appt.service.name}
                        </h3>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          {appt.barber.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(appt.dateTime), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {format(parseISO(appt.dateTime), 'HH:mm')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="font-medium text-amber-500">
                          R${' '}
                          {Number(appt.service.price)
                            .toFixed(2)
                            .replace('.', ',')}
                        </span>
                        {appt.payment && (
                          <span className="text-slate-400">
                            Pagamento:{' '}
                            <span className="capitalize">
                              {appt.payment.status.toLowerCase()}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {canCancel && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={cancellingId === appt.id}
                        onClick={() => handleCancel(appt.id)}
                      >
                        <AlertCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
