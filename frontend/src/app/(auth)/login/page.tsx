'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Erro ao fazer login. Verifique suas credenciais.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-amber-100/15 bg-zinc-950/85 shadow-2xl ring-1 ring-amber-100/10">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <BrandLogo size="md" standalone />
        </div>
        <h1 className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-2xl font-bold text-transparent">
          Bem-vindo de volta
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Entre na sua conta para continuar
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
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" fullWidth loading={loading} className="mt-6">
          Entrar
        </Button>
      </form>

      <p className="mt-3 text-center text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-zinc-300 transition-colors hover:text-amber-100"
        >
          Esqueci minha senha
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Não tem uma conta?{' '}
        <Link
          href="/register"
          className="font-medium text-amber-300 transition-colors hover:text-amber-200"
        >
          Criar conta
        </Link>
      </p>
    </Card>
  )
}
