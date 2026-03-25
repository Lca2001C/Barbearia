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
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Erro ao fazer login. Verifique suas credenciais.'
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
        <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-slate-400">
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

      <p className="mt-6 text-center text-sm text-slate-400">
        Não tem uma conta?{' '}
        <Link
          href="/register"
          className="font-medium text-amber-500 transition-colors hover:text-amber-400"
        >
          Criar conta
        </Link>
      </p>
    </Card>
  )
}
