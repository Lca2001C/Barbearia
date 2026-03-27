'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, UserCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ProfileData {
  id: string
  name: string
  email: string
  phone?: string
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  useEffect(() => {
    api
      .get('/users/me')
      .then((res) => {
        const data = res.data.data as ProfileData
        setProfile(data)
        setForm({
          name: data.name || '',
          phone: data.phone || '',
        })
      })
      .catch(() => toast.error('Erro ao carregar perfil.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/users/me', {
        name: form.name,
        phone: form.phone || undefined,
      })
      setProfile(data.data)
      toast.success('Perfil atualizado.')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Erro ao atualizar perfil.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    setSavingPassword(true)
    try {
      await api.post('/users/me/change-password', passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
      toast.success('Senha alterada com sucesso.')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Erro ao alterar senha.'
      toast.error(msg)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <UserCircle2 className="h-7 w-7 text-amber-500" />
            Perfil do usuário
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Atualize seus dados e altere sua senha com segurança. O e-mail não pode ser alterado.
          </p>
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Dados da conta</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input label="E-mail" value={profile.email} disabled />
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={saving}>
                Atualizar dados
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Alterar senha</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Senha atual"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              required
            />
            <Input
              label="Nova senha"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              required
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, confirmNewPassword: e.target.value }))
              }
              required
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={savingPassword}>
                Alterar senha
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
