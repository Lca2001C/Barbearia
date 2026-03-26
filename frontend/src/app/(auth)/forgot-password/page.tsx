'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      await forgotPassword(email)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Não foi possível enviar o e-mail de recuperação.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <BrandLogo size="md" standalone />
        </div>
        <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
        <p className="mt-1 text-sm text-slate-400">
          Informe seu e-mail para receber o token de redefinição.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" fullWidth loading={loading} className="mt-6">
          Enviar recuperação
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Lembrou a senha?{' '}
        <Link
          href="/login"
          className="font-medium text-amber-500 transition-colors hover:text-amber-400"
        >
          Voltar para login
        </Link>
      </p>
    </Card>
  )
}
