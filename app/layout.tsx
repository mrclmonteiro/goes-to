import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNavWrapper from './components/BottomNavWrapper'
import InstallBanner from './components/InstallBanner'


export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Goes To...',
  description: 'Acompanhe os indicados ao Oscar 2026',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Goes To...',
  },
  // Next.js gera "mobile-web-app-capable" (Chrome) mas não "apple-mobile-web-app-capable" (iOS).
  // Sem esta tag no iOS, o WebView não expande para cobrir as safe-areas físicas da tela.
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        {/* Camada de background fixo — cobre toda a tela física incluindo
            safe-areas no iOS e barra de navegação no Android */}
        <div aria-hidden style={{
          position: 'fixed', inset: 0, zIndex: -1,
          backgroundColor: '#0a0a0f',
        }} />
        <div id="app-scroll">
          {children}
        </div>
        {/* gradiente topo — cobre status bar / relógio */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
          height: 'calc(env(safe-area-inset-top) + 28px)',
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.55) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        {/* gradiente inferior — suaviza a borda do bottom nav */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          height: 'calc(env(safe-area-inset-bottom) + 80px)',
          background: 'linear-gradient(to top, rgba(10,10,15,0.55) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <BottomNavWrapper />
        <InstallBanner/>
      </body>
    </html>
  )
}
