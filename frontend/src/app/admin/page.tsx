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
  user: { name: string }
  barber: { name: string }
  service: { name: string; price: number }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcoming, setUpcoming] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/appointments/upcoming'),
    ])
      .then(([statsRes, upcomingRes]) => {
        setStats(statsRes.data.data)
        setUpcoming(upcomingRes.data.data || [])
      })
      .catch(() => toast.error('Erro ao carregar dados do dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Receita Total',
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
      label: 'Receita Mensal',
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
      <h2 className="mb-6 text-2xl font-bold text-white">Dashboard</h2>

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

      <h3 className="mb-4 text-xl font-semibold text-white">
        Próximos Agendamentos
      </h3>

      {upcoming.length === 0 ? (
        <Card className="py-8 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">Nenhum agendamento próximo.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map((appt) => (
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
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(appt.dateTime), 'dd/MM', {
                      locale: ptBR,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(parseISO(appt.dateTime), 'HH:mm')}
                  </span>
                  <span className="font-medium text-amber-500">
                    R${' '}
                    {Number(appt.service.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
