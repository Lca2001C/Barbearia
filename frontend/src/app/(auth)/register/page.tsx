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

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await register(
        name,
        email,
        password,
        phone || undefined,
        username || undefined,
        confirmPassword
      )
      router.push('/')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Erro ao criar conta. Tente novamente.'
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
          Criar conta
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Cadastre-se para agendar seus horários
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          type="text"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Username"
          type="text"
          placeholder="seu_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Telefone"
          type="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />

        <Button type="submit" fullWidth loading={loading} className="mt-6">
          Criar Conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Já tem uma conta?{' '}
        <Link
          href="/login"
          className="font-medium text-amber-300 transition-colors hover:text-amber-200"
        >
          Entrar
        </Link>
      </p>
    </Card>
  )
}
