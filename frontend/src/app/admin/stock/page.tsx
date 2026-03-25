'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Package,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface Barber {
  id: string
  name: string
  active: boolean
}

interface StockItem {
  id: string
  barberId: string
  name: string
  description: string | null
  quantity: number
  unit: string
}

const EMPTY = { name: '', description: '', quantity: '0', unit: 'un' }

export default function AdminStockPage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [barberId, setBarberId] = useState<string>('')
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/barbers')
      .then((res) => {
        const list: Barber[] = (res.data.data || []).filter((b: Barber) => b.active)
        setBarbers(list)
        if (list.length && !barberId) {
          setBarberId(list[0].id)
        }
      })
      .catch(() => toast.error('Erro ao carregar barbeiros.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!barberId) return
    setLoadingItems(true)
    api
      .get(`/stock/barber/${barberId}`)
      .then((res) => setItems(res.data.data || []))
      .catch(() => {
        setItems([])
        toast.error('Erro ao carregar estoque.')
      })
      .finally(() => setLoadingItems(false))
  }, [barberId])

  function openCreate() {
    setForm(EMPTY)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(item: StockItem) {
    setForm({
      name: item.name,
      description: item.description || '',
      quantity: String(item.quantity),
      unit: item.unit || 'un',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!barberId) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        quantity: parseInt(form.quantity, 10) || 0,
        unit: form.unit.trim() || 'un',
      }
      if (editingId) {
        await api.put(`/stock/${editingId}`, payload)
        toast.success('Produto atualizado!')
      } else {
        await api.post(`/stock/barber/${barberId}`, payload)
        toast.success('Produto adicionado ao estoque!')
      }
      setShowForm(false)
      const { data } = await api.get(`/stock/barber/${barberId}`)
      setItems(data.data || [])
    } catch {
      toast.error('Não foi possível salvar o produto.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este item do estoque?')) return
    try {
      await api.delete(`/stock/${id}`)
      toast.success('Item removido.')
      const { data } = await api.get(`/stock/barber/${barberId}`)
      setItems(data.data || [])
    } catch {
      toast.error('Erro ao remover.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-100" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Estoque por barbeiro</h2>
          <p className="mt-1 text-sm text-slate-400">
            Cadastre produtos, controle quantidades e unidades (un, ml, cx…).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-400">
            Barbeiro
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={openCreate} disabled={!barberId}>
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6 border-zinc-600">
          <h3 className="mb-4 text-lg font-semibold text-white">
            {editingId ? 'Editar produto' : 'Novo produto'}
          </h3>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Unidade (ex: un, ml, cx)"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
            <Input
              label="Quantidade em estoque"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Descrição (opcional)"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={saving}>
                Salvar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!barberId ? (
        <Card className="py-12 text-center text-slate-400">
          Cadastre um barbeiro antes de gerenciar o estoque.
        </Card>
      ) : loadingItems ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-100" />
        </div>
      ) : items.length === 0 ? (
        <Card className="py-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-slate-400">Nenhum produto no estoque deste barbeiro.</p>
          <Button className="mt-4" onClick={openCreate}>
            Adicionar primeiro produto
          </Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-300">Produto</th>
                <th className="px-4 py-3 font-medium text-slate-300">Qtd</th>
                <th className="px-4 py-3 font-medium text-slate-300">Un.</th>
                <th className="px-4 py-3 font-medium text-slate-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-300">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((item) => {
                const low = item.quantity <= 5
                return (
                  <tr key={item.id} className="bg-slate-950/50 hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-slate-500">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-400">{item.unit}</td>
                    <td className="px-4 py-3">
                      {low ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          Baixo
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="mr-2 inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-red-950/50 hover:text-red-400"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
