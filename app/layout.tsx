import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNavWrapper from './components/BottomNavWrapper'
import InstallBanner from './components/InstallBanner'
import TouchActiveFix from './components/TouchActiveFix'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'


export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "Goes To...",
  description: "Um novo app para acompanhar, avaliar e compartilhar os filmes indicados às principais premiações",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Goes To...",
    startupImage: "/apple-touch-icon.png",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Goes To...",
    description: "Um novo app para acompanhar, avaliar e compartilhar os filmes indicados às principais premiações",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
    keywords: {
    "votar oscar",
    "filmes oscar",
    "letterboxd oscar",
    "aplicativo oscar"
    },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  alternates: {
  canonical: "https://goes-to.vercel.app",
  },
  robots: {
  index: true,
  follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#db3a30',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        {/*
          SVG filters — LiquidGlassKit visual concepts traduzidos para web:
          • #lg-refract  → feTurbulence + feDisplacementMap: simula refração do vidro
                           (Metal shader: refractiveIndex + dispersionStrength)
          • #lg-gooey    → feGaussianBlur + feColorMatrix: shape merging suave
                           (Metal shader: smoothUnion / shapeMergeSmoothness)
        */}
        <svg aria-hidden="true" focusable="false"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <defs>
            <filter id="lg-refract" colorInterpolationFilters="linearRGB"
              x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.014"
                numOctaves="2" seed="7" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise"
                scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
            <filter id="lg-gooey" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
              <feColorMatrix in="blur" mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo"/>
              <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            </filter>
          </defs>
        </svg>
        {children}
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
        <TouchActiveFix />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
