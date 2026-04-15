import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/Providers'
import { Toaster } from 'sonner'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: { default: 'CriArt Oficina Digital', template: '%s | CriArt Oficina Digital' },
  description: 'Plataforma SaaS para catálogos de MDF, corte laser e personalizados.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${syne.variable} ${dmSans.variable}`}>
      <body style={{ fontFamily: 'var(--font-body, system-ui)', background: 'var(--lp-base)', color: 'var(--lp-ink)' }}>
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'var(--font-body)', fontSize: '14px' } }} />
        </Providers>
      </body>
    </html>
  )
}
