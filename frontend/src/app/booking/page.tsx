'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Home,
  Loader2,
  Scissors,
  User,
  Calendar,
} from 'lucide-react'
import { format, addDays, isSameDay, formatISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  active?: boolean
}

interface Barber {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string | null
  bio: string | null
  active: boolean
}

const STEPS = ['Serviço', 'Barbeiro', 'Data e Hora', 'Confirmação']

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
      return 'Este horário acabou de ser reservado. Escolha outro.'
    if (err.response?.status === 401) return 'Sessão expirada. Faça login novamente.'
  }
  return fallback
}

export default function BookingPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [step, setStep] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [loadingData, setLoadingData] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookingDone, setBookingDone] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    api
      .get('/services')
      .then((res) => {
        setServices(res.data.data?.filter((s: Service) => s.active !== false) || [])
      })
      .catch(() => {
        toast.error('Não foi possível carregar os serviços.')
      })
  }, [])

  useEffect(() => {
    if (step === 1) {
      api
        .get('/barbers')
        .then((res) => {
          setBarbers(res.data.data?.filter((b: Barber) => b.active) || [])
        })
        .catch(() => {
          toast.error('Não foi possível carregar os barbeiros.')
        })
    }
  }, [step])

  const fetchSlots = useCallback(async () => {
    if (!selectedBarber || !selectedService) return
    setLoadingData(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const { data } = await api.get(
        `/barbers/${selectedBarber.id}/availability?date=${dateStr}&serviceId=${selectedService.id}`,
      )
      setSlots(data.data || [])
    } catch {
      setSlots([])
      toast.error('Não foi possível carregar os horários.')
    } finally {
      setLoadingData(false)
    }
  }, [selectedBarber, selectedService, selectedDate])

  useEffect(() => {
    if (step === 2) {
      setSelectedTime(null)
      fetchSlots()
    }
  }, [step, selectedDate, fetchSlots])

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  function goBack() {
    if (bookingDone) return
    if (step > 0) setStep(step - 1)
  }

  function resetFlow() {
    setStep(0)
    setSelectedService(null)
    setSelectedBarber(null)
    setSelectedDate(new Date())
    setSelectedTime(null)
    setBookingDone(false)
  }

  function selectService(service: Service) {
    setSelectedService(service)
    setStep(1)
  }

  function selectBarber(barber: Barber) {
    setSelectedBarber(barber)
    setStep(2)
  }

  function selectTime(time: string) {
    setSelectedTime(time)
    setStep(3)
  }

  async function handleConfirm() {
    if (!selectedService || !selectedBarber || !selectedTime) return
    setSubmitting(true)

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const local = new Date(`${dateStr}T${selectedTime}:00`)
      const dateTime = formatISO(local)

      await api.post('/appointments', {
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        dateTime,
      })

      setBookingDone(true)
      toast.success('Agendamento confirmado!')
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(err, 'Não foi possível confirmar o agendamento.'),
      )
    } finally {
      setSubmitting(false)
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
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                    ${
                      i < step
                        ? 'bg-amber-500 text-slate-950'
                        : i === step
                          ? 'border-2 border-amber-500 text-amber-500'
                          : 'border border-slate-700 text-slate-500'
                    }
                  `}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`hidden text-sm sm:block ${
                    i <= step ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px w-8 sm:w-12 ${
                      i < step ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {step > 0 && !bookingDone && (
          <button
            type="button"
            onClick={goBack}
            className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        )}

        {step === 0 && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-white">Escolha o Serviço</h2>
            {services.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    hover
                    onClick={() => selectService(service)}
                    className={`transition-all ${
                      selectedService?.id === service.id
                        ? 'border-amber-500 ring-1 ring-amber-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {service.description || 'Serviço profissional'}
                        </p>
                      </div>
                      <Scissors className="h-5 w-5 shrink-0 text-amber-500" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-amber-500">
                        R$ {Number(service.price).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Clock className="h-4 w-4" />
                        {service.duration} min
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-white">Escolha o Barbeiro</h2>
            {barbers.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {barbers.map((barber) => (
                  <Card
                    key={barber.id}
                    hover
                    onClick={() => selectBarber(barber)}
                    className={`text-center transition-all ${
                      selectedBarber?.id === barber.id
                        ? 'border-amber-500 ring-1 ring-amber-500'
                        : ''
                    }`}
                  >
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
                      {barber.avatarUrl ? (
                        <img
                          src={barber.avatarUrl}
                          alt={barber.name}
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-slate-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{barber.name}</h3>
                    {barber.bio && (
                      <p className="mt-1 text-sm text-slate-400">{barber.bio}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-white">Escolha Data e Horário</h2>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-slate-300">Data</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((date) => {
                  const active = isSameDay(date, selectedDate)
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`
                        flex shrink-0 flex-col items-center rounded-xl px-4 py-3
                        transition-all
                        ${
                          active
                            ? 'bg-amber-500 text-slate-950'
                            : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                        }
                      `}
                    >
                      <span className="text-xs font-medium uppercase">
                        {format(date, 'EEE', { locale: ptBR })}
                      </span>
                      <span className="text-lg font-bold">{format(date, 'dd')}</span>
                      <span className="text-xs">{format(date, 'MMM', { locale: ptBR })}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-300">Horários Disponíveis</h3>
              {loadingData ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : slots.length === 0 ? (
                <p className="py-8 text-center text-slate-400">
                  Nenhum horário disponível para esta data.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => selectTime(slot.time)}
                      className={`
                        rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                        ${
                          selectedTime === slot.time && slot.available
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
                            Reservado
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            {!bookingDone ? (
              <>
                <h2 className="mb-6 text-2xl font-bold text-white">Confirmar agendamento</h2>

                <Card className="mb-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Resumo</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Serviço</span>
                      <span className="font-medium text-white">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Barbeiro</span>
                      <span className="font-medium text-white">{selectedBarber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Data</span>
                      <span className="font-medium text-white">
                        {format(selectedDate, "dd 'de' MMMM, EEEE", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Horário</span>
                      <span className="font-medium text-white">{selectedTime}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-white">Total</span>
                        <span className="text-lg font-bold text-amber-500">
                          R${' '}
                          {selectedService
                            ? Number(selectedService.price).toFixed(2).replace('.', ',')
                            : '0,00'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Pagamento na barbearia no dia do atendimento.
                      </p>
                    </div>
                  </div>
                </Card>

                <Button fullWidth size="lg" loading={submitting} onClick={handleConfirm}>
                  <Check className="h-5 w-5" />
                  Confirmar agendamento
                </Button>
              </>
            ) : (
              <Card className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Tudo certo!</h2>
                <p className="mt-2 text-slate-400">
                  Seu horário está reservado. Você receberá a confirmação em &quot;Meus
                  agendamentos&quot;.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button
                    variant="primary"
                    className="gap-2"
                    onClick={() => router.push('/my-appointments')}
                  >
                    <Calendar className="h-4 w-4" />
                    Meus agendamentos
                  </Button>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => router.push('/')}
                  >
                    <Home className="h-4 w-4" />
                    Início
                  </Button>
                </div>
                <div className="mt-3">
                  <Button variant="ghost" className="gap-2" onClick={resetFlow}>
                    <Scissors className="h-4 w-4" />
                    Novo agendamento
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
