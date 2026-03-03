'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mainTabs = [
  { href: '/filmes', label: 'Início', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
    </svg>
  )},
  { href: '/descobrir', label: 'Descobrir', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}/>
      <path d="M16 8L13.5 13.5L8 16L10.5 10.5L16 8Z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.3 : 0}/>
    </svg>
  )},
  { href: '/estante', label: 'Estante', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="5" height="13" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <rect x="10" y="4" width="5" height="13" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <rect x="17" y="4" width="4" height="13" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
      <rect x="3" y="19" width="18" height="2" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.2 : 0}/>
    </svg>
  )},
]

// Liquid Glass Effect atualizado
const liquidGlassStyle = {
  background: 'rgba(120,120,128,0.18)',
  backdropFilter: 'blur(48px) saturate(200%)',
  WebkitBackdropFilter: 'blur(48px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.25)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
}

export default function BottomNav() {
  const pathname = usePathname()
  const searchActive = pathname === '/busca'

  return (
    // Alterado px-4 para px-5 (20px) e paddingBottom fixo para manter os 20px do chão
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-5"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>

      {/* Pill principal — Altura ajustada para 60px */}
      <div className="flex items-center px-3 rounded-[30px] gap-1"
        style={{ ...liquidGlassStyle, height: '60px' }}>
        {mainTabs.map(tab => {
          const active = tab.href === '/filmes' 
  ? pathname === tab.href 
  : pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href}
              className="flex flex-col items-center gap-[2px] px-4 rounded-[22px] transition-all"
              style={{
                background: active ? 'rgba(251,191,36,0.2)' : 'transparent',
                height: '48px',
                justifyContent: 'center',
              }}>
              <span style={{ color: active ? '#fbbf24' : 'rgba(128,128,128,0.75)' }}>
                {tab.icon(active)}
              </span>
              {/* Tamanho da fonte ajustado para a proporção real */}
              <span className="text-[9px] font-bold tracking-wide"
                style={{ color: active ? '#fbbf24' : 'rgba(128,128,128,0.6)' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Botão de busca — Círculo ajustado para 60x60 */}
      <Link href="/busca"
        className="flex items-center justify-center rounded-full transition-all"
        style={{
          ...liquidGlassStyle,
          width: '60px',
          height: '60px',
          background: searchActive ? 'rgba(251,191,36,0.25)' : 'rgba(120,120,128,0.18)',
          border: `1px solid ${searchActive ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.25)'}`,
        }}>
        {/* Ícone ajustado para 24px */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7"
            stroke={searchActive ? '#fbbf24' : 'rgba(128,128,128,0.75)'}
            strokeWidth={searchActive ? 2.2 : 1.7}/>
          <path d="M17 17L21 21"
            stroke={searchActive ? '#fbbf24' : 'rgba(128,128,128,0.75)'}
            strokeWidth={searchActive ? 2.2 : 1.7} strokeLinecap="round"/>
        </svg>
      </Link>

    </nav>
  )
}