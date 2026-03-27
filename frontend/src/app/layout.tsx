import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cia do Disfarce — Barber Shop',
  description:
    'Cia do Disfarce: barbearia e visagismo. Agende seu horário com estilo clássico e atendimento premium.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
