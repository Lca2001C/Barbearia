'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Clock,
  DollarSign,
  Scissors,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  active: boolean
}

const EMPTY_FORM = { name: '', description: '', price: '', duration: '' }

export default function AdminServicesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (user.role === 'SUB_ADMIN') {
      router.replace('/admin')
      return
    }
    fetchServices()
  }, [authLoading, user, router])

  async function fetchServices() {
    try {
      const { data } = await api.get('/services')
      setServices(data.data || [])
    } catch {
      toast.error('Erro ao carregar serviços.')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(service: Service) {
    setForm({
      name: service.name,
      description: service.description || '',
      price: Number(service.price).toFixed(2),
      duration: String(service.duration),
    })
    setEditingId(service.id)
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      duration: parseInt(form.duration, 10),
    }
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, payload)
        toast.success('Serviço atualizado!')
      } else {
        await api.post('/services', payload)
        toast.success('Serviço criado!')
      }
      setShowForm(false)
      fetchServices()
    } catch {
      toast.error('Erro ao salvar serviço.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return
    try {
      await api.delete(`/services/${id}`)
      toast.success('Serviço removido!')
      fetchServices()
    } catch {
      toast.error('Erro ao remover serviço.')
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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Serviços</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? 'Editar Serviço' : 'Novo Serviço'}
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
                label="Descrição"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <Input
                label="Preço (R$)"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <Input
                label="Duração (minutos)"
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
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

      {services.length === 0 ? (
        <Card className="py-12 text-center">
          <Scissors className="mx-auto mb-2 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">Nenhum serviço cadastrado.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  Nome
                </th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium text-slate-400 sm:table-cell">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  Duração
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {service.name}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-slate-400 sm:table-cell">
                    {service.description || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm text-amber-500">
                      <DollarSign className="h-3.5 w-3.5" />
                      R$ {Number(service.price).toFixed(2).replace('.', ',')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration} min
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        service.active !== false
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {service.active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(service)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
