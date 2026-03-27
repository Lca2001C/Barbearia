'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  Calendar,
  Users,
  Scissors,
  TrendingUp,
  BarChart,
  Loader2,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Card } from '@/components/ui/Card'

interface DashboardStats {
  totalRevenue: number
  appointmentsToday: number
  totalClients: number
  totalBarbers: number
  monthlyRevenue: number
  weeklyAppointments: number
}

interface Appointment {
  id: string
  dateTime: string
  status: string
  user: { name: string; email?: string }
  barber: { name: string }
  service: { name: string; price: number }
  payment?: { status: string }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPartialError, setHasPartialError] = useState(false)

  const STATUS_CONFIG: Record<
    string,
    { label: string; color: string }
  > = {
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

  useEffect(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // #region agent log
    fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H1',location:'frontend/src/app/admin/page.tsx:useEffect:start',message:'Dashboard fetch cycle started',data:{todayStart:todayStart.toISOString(),todayEnd:todayEnd.toISOString(),weekStart:weekStart.toISOString(),weekEnd:weekEnd.toISOString()},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    Promise.allSettled([
      api.get('/dashboard/stats', {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
      }),
      api.get('/appointments/today', {
        params: {
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString(),
        },
      }),
      api.get('/appointments/week', {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
      }),
    ])
      .then(([statsRes, todayRes, weekRes]) => {
        // #region agent log
        fetch('http://127.0.0.1:7772/ingest/efa8c094-3985-4d28-bcde-0c4cf7f1376c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ff99de'},body:JSON.stringify({sessionId:'ff99de',runId:'initial',hypothesisId:'H1',location:'frontend/src/app/admin/page.tsx:useEffect:allSettled',message:'Dashboard requests settled',data:{statsStatus:statsRes.status,todayStatus:todayRes.status,weekStatus:weekRes.status},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        const hasErrors =
          statsRes.status === 'rejected' ||
          todayRes.status === 'rejected' ||
          weekRes.status === 'rejected'

        setHasPartialError(hasErrors)

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data.data)
        } else {
          setStats(null)
        }

        if (todayRes.status === 'fulfilled') {
          setTodayAppointments(todayRes.value.data.data || [])
        } else {
          setTodayAppointments([])
        }

        if (weekRes.status === 'fulfilled') {
          setWeekAppointments(weekRes.value.data.data || [])
        } else {
          setWeekAppointments([])
        }

        if (hasErrors) {
          toast.error('Parte dos dados do dashboard não pôde ser carregada.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`skeleton-${index}`}>
              <div className="h-16 animate-pulse rounded bg-slate-800/70" />
            </Card>
          ))}
        </div>
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Receita total (concluídos)',
      value: `R$ ${Number(stats?.totalRevenue ?? 0).toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
    },
    {
      label: 'Agendamentos Hoje',
      value: stats?.appointmentsToday ?? 0,
      icon: Calendar,
    },
    {
      label: 'Total de Clientes',
      value: stats?.totalClients ?? 0,
      icon: Users,
    },
    {
      label: 'Barbeiros Ativos',
      value: stats?.totalBarbers ?? 0,
      icon: Scissors,
    },
    {
      label: 'Receita mensal (concluídos)',
      value: `R$ ${Number(stats?.monthlyRevenue ?? 0).toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
    },
    {
      label: 'Agendamentos Semana',
      value: stats?.weeklyAppointments ?? 0,
      icon: BarChart,
    },
  ]

  return (
    <div>
      {hasPartialError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Alguns dados falharam no carregamento. A tela continua disponível com as
            informações recuperadas.
          </p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Valores de receita somam o preço do serviço dos agendamentos marcados como{' '}
          <span className="text-slate-300">concluídos</span>.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <Icon className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-6">
        <h3 className="mb-4 text-xl font-semibold text-white">
          Agendamentos Hoje
        </h3>

        {todayAppointments.length === 0 ? (
          <Card className="py-8 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-600" />
            <p className="text-slate-400">Nenhum agendamento para hoje.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appt) => {
              const statusCfg =
                STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING
              return (
                <Card key={appt.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {appt.user?.name || 'Cliente'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {appt.service.name} com {appt.barber.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Clock className="h-4 w-4" />
                        {format(parseISO(appt.dateTime), 'HH:mm')}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                      <span className="font-medium text-amber-500">
                        R${' '}
                        {Number(appt.service.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold text-white">
          Agendamentos da Semana
        </h3>

        {weekAppointments.length === 0 ? (
          <Card className="py-8 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-600" />
            <p className="text-slate-400">Nenhum agendamento na semana.</p>
          </Card>
        ) : (
          (() => {
            const grouped = weekAppointments.reduce(
              (acc, appt) => {
                const dayKey = format(parseISO(appt.dateTime), 'yyyy-MM-dd')
                if (!acc[dayKey]) acc[dayKey] = []
                acc[dayKey].push(appt)
                return acc
              },
              {} as Record<string, Appointment[]>,
            )

            const dayKeys = Object.keys(grouped).sort()

            return (
              <div className="space-y-5">
                {dayKeys.map((dayKey) => (
                  <div key={dayKey} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-sm font-medium text-slate-200">
                        {format(parseISO(dayKey), 'dd/MM', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {grouped[dayKey].length} agend.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {grouped[dayKey].map((appt) => {
                        const statusCfg =
                          STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING
                        return (
                          <Card key={appt.id}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                                  <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">
                                    {appt.user?.name || 'Cliente'}
                                  </p>
                                  <p className="text-sm text-slate-400">
                                    {appt.service.name} com {appt.barber.name}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex items-center gap-1 text-sm text-slate-400">
                                  <Clock className="h-4 w-4" />
                                  {format(parseISO(appt.dateTime), 'HH:mm')}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}
                                >
                                  {statusCfg.label}
                                </span>
                                <span className="font-medium text-amber-500">
                                  R${' '}
                                  {Number(appt.service.price).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
