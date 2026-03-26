'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin dashboard error boundary:', error)
  }, [error])

  return (
    <Card className="mx-auto mt-8 max-w-xl text-center">
      <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-400" />
      <h2 className="text-xl font-semibold text-white">Falha ao carregar o painel</h2>
      <p className="mt-2 text-sm text-slate-400">
        Ocorreu um erro inesperado ao renderizar esta área administrativa.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </Card>
  )
}
