'use client'
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
          stroke={active ? '#FF453A' : 'white'}
          strokeWidth="1.8" strokeLinejoin="round"
          fill={active ? '#FF453A' : 'white'}
          fillOpacity={active ? 0.9 : 1}
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
          stroke={active ? '#FF453A' : 'white'}
          strokeWidth="1.8"
          fill={active ? '#FF453A' : 'white'}
          fillOpacity={active ? 0.15 : 0.1}
        />
        <path d="M16 8L13.5 13.5L8 16L10.5 10.5L16 8Z"
          stroke={active ? '#FF453A' : 'white'}
          strokeWidth="1.8" strokeLinejoin="round"
          fill={active ? '#FF453A' : 'white'}
          fillOpacity={active ? 1 : 1}
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
          stroke={active ? '#FF453A' : 'white'} strokeWidth="1.8"
          fill={active ? '#FF453A' : 'white'} fillOpacity={active ? 0.9 : 1}/>
        <rect x="10" y="4" width="5" height="13" rx="1.5"
          stroke={active ? '#FF453A' : 'white'} strokeWidth="1.8"
          fill={active ? '#FF453A' : 'white'} fillOpacity={active ? 0.9 : 1}/>
        <rect x="17" y="4" width="4" height="13" rx="1.5"
          stroke={active ? '#FF453A' : 'white'} strokeWidth="1.8"
          fill={active ? '#FF453A' : 'white'} fillOpacity={active ? 0.9 : 1}/>
        <rect x="3" y="19" width="18" height="2" rx="1"
          stroke={active ? '#FF453A' : 'white'} strokeWidth="1.8"
          fill={active ? '#FF453A' : 'white'} fillOpacity={active ? 0.9 : 1}/>
      </svg>
    ),
  },
]

// Variante com blur mais pesado — exclusiva da nav bar persistente
const navGlass: React.CSSProperties = {
  background: 'rgba(12,12,16,0.5)',
  backdropFilter: 'blur(3px) saturate(350%)',
  WebkitBackdropFilter: 'blur(3px) saturate(350%)',
  /* Borda fina: lado iluminado (top-left) mais brilhante, lado em sombra (bottom-right) mais escuro */
  border: '1px solid transparent',
  /* Fresnel + Glare + Dispersão cromática — baseado no LiquidGlassFragment.metal */
  boxShadow: [
    '0 8px 32px rgba(0,0,0,0.2)',
    'inset 1px 1px 0px rgba(255,255,255,0.12)',
    'inset -1px -1px 0px rgba(0,0,0,0.18)',
    'inset 1px 1px 0px rgba(255,120,100,0.03)',
    'inset -1px -1px 0px rgba(100,130,255,0.02)',
    // Glow corner topo-esquerda — luz direta (quente)
    'inset 14px 14px 24px rgba(255,255,255,0.05)',
    // Glow corner baixo-direita — reflexo frio
    'inset -14px -14px 24px rgba(160,190,255,0.03)',
  ].join(', '),
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
  if (activeIdx >= 0) lastActiveIdxRef.current = activeIdx
  const pinnedIdx = lastActiveIdxRef.current

  const [stage, setStage] = useState<'idle' | 'expanded' | 'focused'>('idle')
  const [query, setQuery] = useState('')
  const [pressedIdx, setPressedIdx] = useState<number | null>(null)
  const [pressedSearch, setPressedSearch] = useState(false)
  const [pressedBar, setPressedBar] = useState(false)
  const [pressedClose, setPressedClose] = useState(false)
  const [pressedCondensed, setPressedCondensed] = useState(false)

  const isExpanded = stage === 'expanded' || stage === 'focused'
  const isFocused  = stage === 'focused'

  useEffect(() => {
    if (pathname !== '/busca') { setStage('idle'); setQuery('') }
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

      {/* ── Main pill + bubble wrapper ─────────────────────────────────── */}
      {/* Wrapper: contexto de posicionamento da bubble, sem overflow nem transform */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        // Zoom do pill nativo quando pressionado — aplicado no wrapper, não no pill
        // (para não criar stacking context que clipa a bubble)
        transform: (!isExpanded && pressedIdx !== null) || (isExpanded && pressedCondensed) ? 'scale(1.08)' : 'scale(1)',
        transition: (!isExpanded && pressedIdx !== null) || (isExpanded && pressedCondensed)
          ? 'transform 0.06s ease'
          : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
      }}>
        {/* Pill */}
        <div
          className="nav-glass-border relative flex items-center justify-center rounded-[30px]"
          style={{
            ...navGlass,
            height: 60,
            width: isFocused ? 0 : isExpanded ? 60 : undefined,
            minWidth: isFocused ? 0 : isExpanded ? 60 : undefined,
            border: isFocused ? 'none' : '1px solid transparent',
            boxShadow: isFocused ? 'none' : navGlass.boxShadow,
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.32,0.72,0,1)',
            opacity: isFocused ? 0 : 1,
          }}
        >
          {/* Brightness overlay quando pressionado — WebKit-safe */}
          {(pressedIdx !== null && !isExpanded) || (pressedCondensed && isExpanded) ? (
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, borderRadius: 'inherit',
              background: 'rgba(255,255,255,0.16)',
              pointerEvents: 'none', zIndex: 3,
            }} />
          ) : null}
          {/* Glare overlay */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden', borderRadius: 'inherit', zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
          </div>

          {/* Condensed: only active icon */}
          {isExpanded && !isFocused && (
            <button
              onClick={handleCondensedPillPress}
              onPointerDown={() => setPressedCondensed(true)}
              onPointerUp={() => setPressedCondensed(false)}
              onPointerLeave={() => setPressedCondensed(false)}
              onPointerCancel={() => setPressedCondensed(false)}
              className="flex items-center justify-center w-full h-full rounded-[30px]"
              style={{ background: 'transparent' }}
            >
              {TABS[pinnedIdx].icon(true)}
            </button>
          )}

          {/* Full pill */}
          {!isExpanded && (
            <>
              {/* Indicador de ativo */}
              {activeIdx >= 0 && pressedIdx !== activeIdx && (
                <div
                  className="absolute rounded-[22px] pointer-events-none"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
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
                    <div
                      key={tab.href}
                      onPointerDown={() => setPressedIdx(i)}
                      onPointerUp={() => { router.push(tab.href); setTimeout(() => setPressedIdx(null), 230) }}
                      onPointerLeave={() => setPressedIdx(null)}
                      onPointerCancel={() => setPressedIdx(null)}
                      className="relative z-10 flex flex-col items-center justify-center gap-[2px] rounded-[22px] select-none"
                      style={{ width: TAB_W, height: 48, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        opacity: pressedIdx === i ? 0 : 1,
                        transition: pressedIdx === i ? 'opacity 0.04s ease' : 'opacity 0.15s ease',
                      } as React.CSSProperties}
                    >
                      {tab.icon(active)}
                      <span
                        className="text-[9px] font-bold tracking-wide"
                        style={{ color: active ? '#FF453A' : 'white' }}
                      >
                        {tab.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Bubble de press — irmã do pill, fora do clip, pode crescer livremente */}
        {pressedIdx !== null && !isExpanded && (
          <div
            aria-hidden="true"
            className="nav-bubble"
            style={{
              position: 'absolute',
              width: TAB_W + 6,
              height: 56,
              borderRadius: 28,
              left: PILL_PX + pressedIdx * TAB_STRIDE - 3,
              top: (60 - 56) / 2,          // centralizado verticalmente no pill de 60px
              pointerEvents: 'none',
              zIndex: 20,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(6px) saturate(300%) brightness(1.15)',
              WebkitBackdropFilter: 'blur(6px) saturate(300%) brightness(1.15)',
              boxShadow: [
                '0 8px 32px rgba(0,0,0,0.35)',
                'inset 1px 1px 0px rgba(255,255,255,0.22)',
                'inset -1px -1px 0px rgba(0,0,0,0.12)',
                'inset 10px 10px 18px rgba(255,255,255,0.06)',
              ].join(', '),
              animation: 'nav-bubble-pop 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            {/* Glare diagonal */}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 50%)', pointerEvents: 'none' }} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              {TABS[pressedIdx].icon(pressedIdx === activeIdx)}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em', position: 'relative', zIndex: 1,
              color: pressedIdx === activeIdx ? '#FF453A' : 'rgba(255,255,255,0.85)' }}>
              {TABS[pressedIdx].label}
            </span>
          </div>
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
        {/* Wrapper de zoom — mesmo padrão do pill wrapper */}
        <div style={{
          position: 'relative',
          flexGrow: isExpanded ? 1 : 0,
          flexShrink: 0,
          flexBasis: isExpanded ? 0 : 'auto',
          minWidth: 0,
          transform: (!isExpanded && pressedSearch) || (isExpanded && !isFocused && pressedBar) ? 'scale(1.15)' : 'scale(1)',
          transition: (!isExpanded && pressedSearch) || (isExpanded && !isFocused && pressedBar)
            ? 'transform 0.06s ease'
            : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
        }}>
        <div
          className="nav-glass-border flex items-center gap-3 rounded-[30px]"
          style={{
            ...navGlass,
            height: 60,
            flex: isExpanded ? 1 : 'none',
            width: isExpanded ? undefined : 60,
            paddingLeft: isExpanded ? 20 : 0,
            paddingRight: isExpanded ? 16 : 0,
            justifyContent: isExpanded ? 'flex-start' : 'center',
            transition: 'all 0.4s cubic-bezier(0.32,0.72,0,1)',
            cursor: 'pointer',
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
            border: isFocused ? '0.5px solid rgba(255,69,58,0.4)' : '1px solid transparent',
            boxShadow: isFocused
              ? `${navGlass.boxShadow}, 0 0 0 3px rgba(255,69,58,0.1)`
              : navGlass.boxShadow,
          }}
          onClick={isExpanded ? handleBarPress : handleSearchBubblePress}
          onPointerDown={() => { if (!isExpanded) setPressedSearch(true); else if (!isFocused) setPressedBar(true) }}
          onPointerUp={() => { setPressedSearch(false); setPressedBar(false) }}
          onPointerLeave={() => { setPressedSearch(false); setPressedBar(false) }}
          onPointerCancel={() => { setPressedSearch(false); setPressedBar(false) }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onFocus={() => { if (stage === 'expanded') setStage('focused') }}
        >
          {/* Brightness overlay — WebKit-safe, mesmo padrão do pill */}
          {((pressedSearch && !isExpanded) || (pressedBar && isExpanded && !isFocused)) && (
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'rgba(255,255,255,0.16)', zIndex: 6, pointerEvents: 'none' }} />
          )}
          {/* Glare overlay: streak especular diagonal */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', zIndex: 2 }}
          />
          <span className="flex-shrink-0 flex items-center" style={{ position: 'relative', zIndex: 3 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7"
                stroke={isExpanded ? '#FF453A' : 'white'}
                strokeWidth="1.8"/>
              <path d="M17 17L21 21"
                stroke={isExpanded ? '#FF453A' : 'white'}
                strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>

          {isExpanded && (
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={e => {
            const val = e.target.value
            setQuery(val)
            if (pathname === '/busca') {
              router.replace(`/busca?q=${encodeURIComponent(val)}`, { scroll: false })
            }
          }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Buscar filmes, diretores..."
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              className="flex-1 bg-transparent outline-none text-sm min-w-0 [&::-webkit-search-cancel-button]:hidden"
              style={{ color: 'white', pointerEvents: isFocused ? 'auto' : 'none', position: 'relative', zIndex: 3 }}
              readOnly={!isFocused}
            />
          )}


        </div>
        </div>

        {isFocused && (
          <div style={{
            flexShrink: 0,
            transform: pressedClose ? 'scale(1.15)' : 'scale(1)',
            transition: pressedClose
              ? 'transform 0.06s ease'
              : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
          }}>
            <button
              onClick={handleClose}
              onPointerDown={() => setPressedClose(true)}
              onPointerUp={() => setPressedClose(false)}
              onPointerLeave={() => setPressedClose(false)}
              onPointerCancel={() => setPressedClose(false)}
              className="nav-glass-border flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                ...navGlass, width: 60, height: 60, border: '1px solid transparent',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Brightness overlay */}
              {pressedClose && (
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'rgba(255,255,255,0.16)', pointerEvents: 'none', zIndex: 3 }} />
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                <path d="M18 6L6 18M6 6L18 18"
                  stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

    </nav>
  )
}