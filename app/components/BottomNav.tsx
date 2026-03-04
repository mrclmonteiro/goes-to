'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const TABS = [
  {
    href: '/filmes',
    label: 'Início',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          stroke={active ? '#fbbf24' : 'white'}
          strokeWidth="1.8" strokeLinejoin="round"
          fill={active ? '#fbbf24' : 'white'}
          fillOpacity={active ? 0.9 : 0.85}
        />
      </svg>
    ),
  },
  {
    href: '/descobrir',
    label: 'Descobrir',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9"
          stroke={active ? '#fbbf24' : 'white'}
          strokeWidth="1.8"
          fill={active ? '#fbbf24' : 'white'}
          fillOpacity={active ? 0.15 : 0.1}
        />
        <path d="M16 8L13.5 13.5L8 16L10.5 10.5L16 8Z"
          stroke={active ? '#fbbf24' : 'white'}
          strokeWidth="1.8" strokeLinejoin="round"
          fill={active ? '#fbbf24' : 'white'}
          fillOpacity={active ? 1 : 0.85}
        />
      </svg>
    ),
  },
  {
    href: '/estante',
    label: 'Estante',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="5" height="13" rx="1.5"
          stroke={active ? '#fbbf24' : 'white'} strokeWidth="1.8"
          fill={active ? '#fbbf24' : 'white'} fillOpacity={active ? 0.9 : 0.85}/>
        <rect x="10" y="4" width="5" height="13" rx="1.5"
          stroke={active ? '#fbbf24' : 'white'} strokeWidth="1.8"
          fill={active ? '#fbbf24' : 'white'} fillOpacity={active ? 0.9 : 0.85}/>
        <rect x="17" y="4" width="4" height="13" rx="1.5"
          stroke={active ? '#fbbf24' : 'white'} strokeWidth="1.8"
          fill={active ? '#fbbf24' : 'white'} fillOpacity={active ? 0.9 : 0.85}/>
        <rect x="3" y="19" width="18" height="2" rx="1"
          stroke={active ? '#fbbf24' : 'white'} strokeWidth="1.8"
          fill={active ? '#fbbf24' : 'white'} fillOpacity={active ? 0.9 : 0.85}/>
      </svg>
    ),
  },
]

const glass: React.CSSProperties = {
  background: 'rgba(120,120,128,0.18)',
  backdropFilter: 'blur(48px) saturate(200%)',
  WebkitBackdropFilter: 'blur(48px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.25)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
}

const TAB_STRIDE = 80
const TAB_W = 76
const PILL_PX = 12

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const activeIdx = TABS.findIndex(t =>
    t.href === '/filmes'
      ? pathname === t.href
      : pathname === t.href || pathname.startsWith(t.href + '/')
  )

  const lastActiveIdxRef = useRef(0)
  const [pinnedIdx, setPinnedIdx] = useState(0)
  // update ref and pinned state in effect to avoid accessing/modifying refs during render
  useEffect(() => {
    if (activeIdx >= 0) {
      lastActiveIdxRef.current = activeIdx
      requestAnimationFrame(() => setPinnedIdx(activeIdx))
    }
  }, [activeIdx])

  const [stage, setStage] = useState<'idle' | 'expanded' | 'focused'>('idle')
  const [query, setQuery] = useState('')

  const isExpanded = stage === 'expanded' || stage === 'focused'
  const isFocused  = stage === 'focused'

  useEffect(() => {
    if (pathname !== '/busca') {
      requestAnimationFrame(() => setStage('idle'))
      requestAnimationFrame(() => setQuery(''))
    }
  }, [pathname])

  function handleSearchBubblePress() {
    setStage('expanded')
    router.push('/busca')
  }

  function handleBarPress() {
    if (stage === 'expanded') {
      setStage('focused')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  // ✅ Função que estava faltando — recolhe a busca e volta para a aba ativa
  function handleCondensedPillPress() {
    setStage('idle')
    setQuery('')
    router.push(TABS[pinnedIdx].href)
  }

  function handleClose() {
    inputRef.current?.blur()
    setStage('idle')
    setQuery('')
    router.back()
  }

  function handleSubmit() {
    router.push(`/busca?q=${encodeURIComponent(query)}`)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-5"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', height: 'auto' }}
    >

      {/* ── Main pill ──────────────────────────────────────────────────── */}
      <div
        className="relative flex items-center justify-center rounded-[30px]"
        style={{
          ...glass,
          height: 60,
          width: isFocused ? 0 : isExpanded ? 60 : undefined,
          minWidth: isFocused ? 0 : isExpanded ? 60 : undefined,
          padding: isFocused ? 0 : 0,
          border: isFocused ? 'none' : glass.border,
          boxShadow: isFocused ? 'none' : glass.boxShadow,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'all 0.4s cubic-bezier(0.32,0.72,0,1)',
          opacity: isFocused ? 0 : 1,
        }}
      >
        {/* Condensed: only active icon */}
        {isExpanded && !isFocused && (
          <button
            onClick={handleCondensedPillPress}
            className="flex items-center justify-center w-full h-full"
          >
            {TABS[pinnedIdx].icon(true)}
          </button>
        )}

        {/* Full pill */}
        {!isExpanded && (
          <>
            {activeIdx >= 0 && (
              <div
                className="absolute rounded-[22px] pointer-events-none"
                style={{
                  background: 'rgba(0,0,0,0.18)',
                  height: 48,
                  width: TAB_W,
                  top: 6,
                  left: PILL_PX + activeIdx * TAB_STRIDE,
                  transition: 'left 0.35s cubic-bezier(0.34,1.2,0.64,1)',
                  zIndex: 0,
                }}
              />
            )}
            <div className="flex items-center px-3 gap-1 h-full">
              {TABS.map((tab, i) => {
                const active = i === activeIdx
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="relative z-10 flex flex-col items-center justify-center gap-[2px] rounded-[22px]"
                    style={{ width: TAB_W, height: 48 }}
                  >
                    {tab.icon(active)}
                    <span
                      className="text-[9px] font-bold tracking-wide"
                      style={{ color: active ? '#fbbf24' : 'rgba(255,255,255,0.6)' }}
                    >
                      {tab.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3"
        style={{
          flex: isExpanded ? 1 : 'none',
          transition: 'flex 0.4s cubic-bezier(0.32,0.72,0,1)',
          minWidth: 0,
        }}
      >
        <div
          className="flex items-center gap-3 rounded-[30px]"
          style={{
            ...glass,
            height: 60,
            flex: isExpanded ? 1 : 'none',
            width: isExpanded ? undefined : 60,
            paddingLeft: isExpanded ? 20 : 0,
            paddingRight: isExpanded ? 16 : 0,
            justifyContent: isExpanded ? 'flex-start' : 'center',
            transition: 'all 0.4s cubic-bezier(0.32,0.72,0,1)',
            cursor: 'pointer',
            minWidth: 0,
          }}
          onClick={isExpanded ? handleBarPress : handleSearchBubblePress}
        >
          <span className="flex-shrink-0 flex items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7"
                stroke={isExpanded ? '#fbbf24' : 'white'}
                strokeWidth="1.8"/>
              <path d="M17 17L21 21"
                stroke={isExpanded ? '#fbbf24' : 'white'}
                strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>

          {isExpanded && (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Buscar filmes, diretores..."
              className="flex-1 bg-transparent outline-none text-sm min-w-0"
              style={{ color: 'white', pointerEvents: isFocused ? 'auto' : 'none' }}
              readOnly={!isFocused}
            />
          )}
        </div>

        {isFocused && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ ...glass, width: 60, height: 60 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18"
                stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

    </nav>
  )
}