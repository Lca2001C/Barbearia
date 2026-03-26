'use client'
import { Suspense, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])
  const { resetPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!token) {
      toast.error('Token de recuperação ausente.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      await resetPassword(token, password)
      router.push('/login')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message || 'Não foi possível redefinir sua senha.'
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
        <h1 className="text-2xl font-bold text-white">Redefinir senha</h1>
        <p className="mt-1 text-sm text-slate-400">
          Defina uma nova senha para sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nova senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={6}
          required
        />
        <Button type="submit" fullWidth loading={loading} className="mt-6">
          Redefinir senha
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <p className="text-center text-sm text-slate-400">Carregando recuperação...</p>
        </Card>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
