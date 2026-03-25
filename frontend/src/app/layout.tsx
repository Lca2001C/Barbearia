import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
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
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: { primary: '#f59e0b', secondary: '#0f172a' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
