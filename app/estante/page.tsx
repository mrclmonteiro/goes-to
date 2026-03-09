'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData } from '@/lib/tmdb'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Spinner from '../components/Spinner'
import Image from 'next/image'
import { EasterEgg, EggType } from '@/app/components/EasterEgg'

const AVATARS = [
  '🎬', '🍿', '🎭', '🏆', '🎞️', '⭐', '🎪', '🎨',
  '🦁', '🎈', '🤵', '🦇', '🗼', '☕️', '🛳', '💰',
  '🐶', '👵', '🐔', '👩‍🦱', '💀', '🛸', '🏊‍♀️', '🤡',
  '🦈'
]
const AVATAR_COLORS = [
  ['#A1C4FD', '#C2E9FB'], ['#B5EAD7', '#83C5BE'], ['#FFDAC1', '#FF9AA2'],
  ['#C7CEEA', '#A3B1C6'], ['#FDFD96', '#F6D365'], ['#E0C3FC', '#8EC5FC'],
  ['#84FAB0', '#8FD3F4'], ['#E2E2E2', '#C9D6FF'], ['#A18CD1', '#FBC2EB'],
  ['#D4FC79', '#96E6A1'], ['#FBC2EB', '#A6C1EE'], ['#FF9A9E', '#FECFEF'],
  ['#89F7FE', '#66A6FF'], ['#FFECD2', '#FCB69F'], ['#D4FC79', '#96E6A1'],
  ['#F3E7E9', '#E3EEFF'], ['#A1C4FD', '#C2E9FB'], ['#E0C3FC', '#8EC5FC'],
  ['#A8E6CF', '#DCEDC1'], ['#D4FC79', '#96E6A1'], ['#CFD9DF', '#E2EBF0'],
  ['#FFECD2', '#FCB69F'], ['#FFDAC1', '#FF9AA2'], ['#FBC2EB', '#A6C1EE'],
  ['#FFDAB9', '#F08080']
]

// ── metas em português + personalizada ──────────────────────────────
const GOAL_OPTIONS = [
  { label: 'Melhor Filme',   category: 'Best Picture' },
  { label: 'Atuação',        category: 'Atuação' },
  { label: 'Direção',        category: 'Best Director' },
  { label: 'Internacional',  category: 'Best International Feature' },
  { label: 'Elenco',         category: 'Best Casting' },
  { label: 'Todos os indicados', category: 'Todos' },
  { label: 'Personalizada',  category: 'custom' },
]

// ── bolão ───────────────────────────────────────────────────────────
const BOLAO_CATEGORIES = [
  { label: 'Elenco',                   cat: 'Best Casting' },
  { label: 'Roteiro Original',         cat: 'Best Original Screenplay' },
  { label: 'Roteiro Adaptado',         cat: 'Best Adapted Screenplay' },
  { label: 'Fotografia',               cat: 'Best Cinematography' },
  { label: 'Melhor Direção',           cat: 'Best Director' },
  { label: 'Melhor Ator Coadjuvante',  cat: 'Best Supporting Actor' },
  { label: 'Melhor Atriz Coadjuvante', cat: 'Best Supporting Actress' },
  { label: 'Melhor Ator',             cat: 'Best Actor' },
  { label: 'Melhor Atriz',            cat: 'Best Actress' },
  { label: 'Melhor Filme',            cat: 'Best Picture' },
]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Nomination = { film_id: string; category: string; nominee?: string | null }
type Profile = { display_name: string | null; username: string | null; avatar_index: number; goal_category: string; is_admin?: boolean }

function SectionTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-lg font-semibold ${className}`} style={{ color: 'white' }}>{children}</p>
}

// Liquid glass — tudo inline (Tailwind v4 interfere via CSS)
const lgStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid transparent',
  boxShadow: 'var(--lg-shadow)',
}
const ddStyle: React.CSSProperties = {
  background: 'rgba(20,20,25,0.65)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
}
// ── PWA detection ────────────────────────────────────────────────────
function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false)
  useEffect(() => {
    setIsPWA(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )
  }, [])
  return isPWA
}

function detectOS(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

function InstallGate({ onClose }: { onClose: () => void }) {
  const os = detectOS()
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  function dismiss() { setVisible(false); setTimeout(onClose, 280) }
  const instructions =
    os === 'ios'
      ? 'No Safari, toque em ⬡ (Compartilhar) → "Adicionar à Tela de Início" → "Adicionar".'
      : os === 'android'
      ? 'No Chrome, toque em ⋮ (Menu) → "Adicionar à tela inicial" → "Instalar".'
      : 'No seu navegador, procure a opção "Instalar app" ou "Adicionar à tela inicial".'
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
      style={{
        backdropFilter: visible ? 'blur(18px) saturate(160%)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(18px) saturate(160%)' : 'blur(0px)',
        background: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        transition: 'backdrop-filter 0.3s ease, background 0.3s ease',
      }}
      onClick={dismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(12,12,18,0.72)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: '28px 24px 24px',
          width: '100%',
          maxWidth: 360,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
          position: 'relative',
        }}
      >
        <button onClick={dismiss}
          className="lg-btn rounded-full flex items-center justify-center"
          style={{
            position: 'absolute', top: 16, right: 16, width: 43, height: 43,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(6px) saturate(280%)',
            WebkitBackdropFilter: 'blur(6px) saturate(280%)',
            border: '1px solid transparent',
            boxShadow: 'var(--lg-shadow)',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 16 }}>
          <span style={{ fontSize: 52, lineHeight: 1, display: 'block' }}>👮</span>
          <span style={{ fontSize: 26, position: 'absolute', bottom: 0, right: -4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>🔦</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.2 }}>
          Pego pelo lanterninha!
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
          Para compartilhar nos Stories, você precisa adicionar o atalho do app no seu celular.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 14px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {os === 'ios' ? 'iPhone / iPad' : os === 'android' ? 'Android' : 'Como instalar'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>{instructions}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button onClick={dismiss} className="primary-btn">
            OK, entendi!
          </button>
          <button onClick={dismiss}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
              fontSize: 13, cursor: 'pointer', padding: '8px', minHeight: 44 }}>
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bottom Sheet ──────────────────────────────────────────────────────
function BottomSheet({ open, onClose, children, title, onAction, actionLabel }: {
  open: boolean; onClose: () => void; children: React.ReactNode
  title?: string; onAction?: () => void; actionLabel?: string
}) {
  const [translateY, setTranslateY] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<number | null>(null)
  const currentY = useRef(0)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => setTranslateY(0))
    } else {
      requestAnimationFrame(() => setTranslateY(100))
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open && translateY >= 100) return null
  const hasActions = !!onAction

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}/>
      <div className="relative w-full rounded-t-[32px] flex flex-col overflow-hidden sheet"
        style={{
          transform: `translateY(${translateY}%)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
          maxHeight: '92vh',
        }}
        onTouchStart={e => { dragStart.current = e.touches[0].clientY; setIsDragging(true) }}
        onTouchMove={e => {
          if (dragStart.current === null) return
          const d = e.touches[0].clientY - dragStart.current
          if (d < 0) return
          currentY.current = d
          setTranslateY((d / window.innerHeight) * 100)
        }}
        onTouchEnd={() => {
          setIsDragging(false)
          if (currentY.current > 120) onClose()
          else setTranslateY(0)
          dragStart.current = null; currentY.current = 0
        }}>

        <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 z-30 pointer-events-none">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>

        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-6 z-30"
          style={{ justifyContent: hasActions ? 'space-between' : 'flex-end' }}>
          <button onClick={onClose}
            className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
            style={{ position: 'relative', ...lgStyle, width: 43, height: 43 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {hasActions && title && (
            <p className="text-base font-semibold absolute left-0 right-0 text-center pointer-events-none"
              style={{ color: 'white', top: 'calc(1.5rem + 10px)' }}>{title}</p>
          )}
          {!hasActions && title && (
            <p className="text-lg font-semibold mr-auto ml-0 pointer-events-none"
              style={{ color: 'white', position: 'absolute', left: 20, top: 'calc(1.5rem + 10px)' }}>{title}</p>
          )}
          {hasActions && (
            <button onClick={onAction}
              className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
              style={{ position: 'relative', width: 43, height: 43, background: '#FF453A', border: '1px solid rgba(255,255,255,0.25)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,69,58,0.4), inset 1px 1px 0px rgba(255,255,255,0.35), inset -1px -1px 0px rgba(0,0,0,0.15)' }}>
              <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 3 }}>
                <path d="M5 12L10 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        <div className="sheet-content-fade"/>
        <div className="overflow-y-auto flex-1 z-10 w-full"
          style={{ paddingTop: '90px', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Tour de boas-vindas ─────────────────────────────────────────────
function InlineGear() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      style={{ display: 'inline', verticalAlign: 'middle', marginBottom: 1 }}>
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

function InlineBolao() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      style={{ display: 'inline', verticalAlign: 'middle', marginBottom: 1 }}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="9" y="3" width="6" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

const TOUR_STEPS = [
  { msg: <>Seu perfil fica aqui, na página <b>Estante</b></>, anchor: 'profile' as const },
  { msg: <>Você pode editá-lo a qualquer momento clicando em <InlineGear/></>, anchor: 'toolbar-config' as const },
  { msg: <>Em <InlineGear/> você altera o nome de exibição, nome de usuário, e-mail e senha</>, anchor: 'toolbar-config' as const },
  { msg: <>Você também pode escolher entre diversos avatares super divertidos (e com algumas surpresas…)</>, anchor: 'toolbar-config' as const },
  { msg: <>Em <InlineBolao/> você pode fazer o seu bolão e compartilhar com os amigos</>, anchor: 'toolbar-bolao' as const },
  { msg: <>Você também pode definir uma meta de filmes que vai assistir 🎯</>, anchor: 'meta' as const },
]

type TourAnchor = typeof TOUR_STEPS[number]['anchor']

function EstanteTour({
  step, onAdvance, toolbarRef, profileRef, metaRef,
}: {
  step: number
  onAdvance: () => void
  toolbarRef: { current: HTMLDivElement | null }
  profileRef: { current: HTMLDivElement | null }
  metaRef: { current: HTMLDivElement | null }
}) {
  const [visible, setVisible] = useState(false)
  const [bubblePos, setBubblePos] = useState<{
    left: number; top?: number; bottom?: number; width: number; tailX: number; tailSide: 'top' | 'bottom'
  } | null>(null)

  useEffect(() => {
    let outerRaf = 0, innerRaf = 0
    let mounted = true
    setVisible(false)

    outerRaf = requestAnimationFrame(() => {
      if (!mounted) return
      const W = window.innerWidth
      const BW = Math.min(280, W - 20)
      const anchor: TourAnchor = TOUR_STEPS[step]?.anchor
      const tbr = toolbarRef.current?.getBoundingClientRect()
      const pfr = profileRef.current?.getBoundingClientRect()
      const mtr = metaRef.current?.getBoundingClientRect()
      let pos: typeof bubblePos = null

      if (anchor === 'profile' && pfr) {
        const bl = Math.max(10, W / 2 - BW / 2)
        pos = { left: bl, top: pfr.bottom + 14, width: BW, tailX: W / 2 - bl - 8, tailSide: 'top' }
      } else if ((anchor === 'toolbar-config' || anchor === 'toolbar-bolao') && tbr) {
        const bl = W - BW - 10
        const bx = anchor === 'toolbar-config' ? tbr.right - 27 : tbr.right - 74
        pos = { left: bl, top: tbr.bottom + 10, width: BW, tailX: Math.max(16, Math.min(bx - bl - 8, BW - 24)), tailSide: 'top' }
      } else if (anchor === 'meta' && mtr) {
        const bl = Math.max(10, W / 2 - BW / 2)
        pos = { left: bl, bottom: window.innerHeight - mtr.top + 10, width: BW, tailX: W / 2 - bl - 8, tailSide: 'bottom' }
      }

      if (mounted) setBubblePos(pos)
      innerRaf = requestAnimationFrame(() => { if (mounted) setVisible(true) })
    })

    return () => {
      mounted = false
      cancelAnimationFrame(outerRaf)
      cancelAnimationFrame(innerRaf)
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!bubblePos) return null
  const isLast = step === TOUR_STEPS.length - 1
  const tailBorders = bubblePos.tailSide === 'top'
    ? { borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '10px solid white' }
    : { borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid white' }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: visible ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0)',
        backdropFilter: 'blur(1px)',
        transition: 'background 0.25s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={onAdvance}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: bubblePos.left, top: bubblePos.top, bottom: bubblePos.bottom, width: bubblePos.width,
          background: 'white', borderRadius: 18, padding: '14px 16px 12px',
          color: '#0a0a0f', fontSize: 14, lineHeight: 1.5, fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(6px)',
          transition: 'opacity 0.25s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Tail */}
        <div style={{
          position: 'absolute', width: 0, height: 0,
          ...(bubblePos.tailSide === 'top' ? { top: -9 } : { bottom: -9 }),
          left: bubblePos.tailX,
          ...tailBorders,
        }}/>

        {/* Message */}
        <p style={{ margin: 0, marginBottom: 12 }}>{TOUR_STEPS[step].msg}</p>

        {/* Footer: dots + button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{
                height: 5, width: i === step ? 14 : 5, borderRadius: 3,
                background: i === step ? '#FF453A' : 'rgba(0,0,0,0.15)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}/>
            ))}
          </div>
          <button
            onClick={onAdvance}
            style={{
              background: '#FF453A', color: 'white', border: 'none', borderRadius: 99,
              cursor: 'pointer', padding: '6px 14px', fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(255,69,58,0.4)',
            }}
          >
            {isLast ? 'Entendido!' : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EstantePage() {
  const router = useRouter()
  const shareRef = useRef<HTMLDivElement>(null)
  const bolaoShareRef = useRef<HTMLDivElement>(null)
  const isPWA = useIsPWA()
  const [showInstallGate, setShowInstallGate] = useState(false)
  const [bolaoOpen, setBolaoOpen] = useState(false)
  const [bolaoStep, setBolaoStep] = useState(0)
  const [bolao, setBolao] = useState<Record<string, string>>({})
  const [bolaoResultsOpen, setBolaoResultsOpen] = useState(false)
  const [iconDataUrl, setIconDataUrl] = useState<string>('')

  // meta personalizada
  const [customGoalCount, setCustomGoalCount] = useState(10)
  const [customGoalInput, setCustomGoalInput] = useState('10')

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({ display_name: null, username: null, avatar_index: 0, goal_category: 'Best Picture' })
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [posters, setPosters] = useState<Record<string, string | null>>({})
  const [ptTitles, setPtTitles] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false)
  const goalBtnRef = useRef<HTMLButtonElement>(null)
  const [goalBtnAnchor, setGoalBtnAnchor] = useState<{top: number, right: number} | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const [tourStep, setTourStep] = useState(-1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [activeEgg, setActiveEgg] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)
  const [prevProgress, setPrevProgress] = useState(0)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState('')
  const [tempAvatarIndex, setTempAvatarIndex] = useState(0)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'subscribed' | 'denied'>('idle')
  const [notifLoading, setNotifLoading] = useState(false)

  // Pre-load app icon as base64 for html2canvas
  useEffect(() => {
    fetch('/icon.png')
      .then(r => r.blob())
      .then(blob => new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      }))
      .then(setIconDataUrl)
      .catch(() => {})
  }, [])

  // Load bolão from localStorage when userId is set
  useEffect(() => {
    if (!userId) return
    try {
      const saved = localStorage.getItem(`bolao_${userId}`)
      if (saved) setBolao(JSON.parse(saved))
    } catch (_) {}
  }, [userId])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) { router.push('/'); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      setEditEmail(user.email ?? '')
      const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
      if (profileData) {
        setProfile(profileData)
        setEditDisplayName(profileData.display_name ?? '')
        setEditUsername(profileData.username ?? '')
      } else {
        const np = { id: user.id, display_name: 'Cinéfilo', username: user.email?.split('@')[0], avatar_index: 0, goal_category: 'Best Picture' }
        await supabase.from('user_profiles').insert(np)
        setProfile({ display_name: 'Cinéfilo', username: user.email?.split('@')[0] ?? null, avatar_index: 0, goal_category: 'Best Picture' })
        setEditDisplayName('Cinéfilo'); setEditUsername(user.email?.split('@')[0] ?? '')
      }
      const { data: filmsData } = await supabase.from('films').select('*')
      const { data: nomsData } = await supabase.from('nominations').select('*')
      const { data: ufData } = await supabase.from('user_films').select('*').eq('user_id', user.id)
      const loaded = filmsData ?? []
      setFilms(loaded); setNominations(nomsData ?? []); setUserFilms(ufData ?? [])
      setLoading(false)
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setPosters(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.poster])))
      setPtTitles(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.ptTitle ?? null])))
    }
    load().catch(e => console.error('[estante] load error:', e))
  }, [router])

  // Push notifications — ao encontrar subscription existente, garante que está salva no Supabase
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'denied') { setNotifStatus('denied'); return }
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(async reg => {
        const sub = await reg.pushManager.getSubscription()
        if (!sub) return
        setNotifStatus('subscribed')
        // Re-envia para o Supabase (upsert idempotente) caso não tenha sido salvo antes
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase!.auth.getSession()
          if (!session?.access_token) return
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ subscription: sub.toJSON() }),
          })
        } catch (_) {}
      }).catch(() => {})
    }
  }, [])

  async function subscribeToNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setNotifLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setNotifStatus('denied'); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      // Obter token JWT para autenticar na API route
      const supabase = createClient()
      const { data: { session } } = await supabase!.auth.getSession()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })
      if (res.ok) setNotifStatus('subscribed')
      else console.error('Push subscribe failed:', await res.text())
    } catch (e) {
      console.error('Push subscribe error:', e)
    } finally {
      setNotifLoading(false)
    }
  }

  const filmCategories = (filmId: string) => nominations.filter(n => n.film_id === filmId).map(n => n.category)

  const isCustomGoal = profile.goal_category === 'custom'

  const goalFilms = isCustomGoal
    ? films
    : films.filter(f => {
        const cats = filmCategories(f.id)
        if (profile.goal_category === 'Todos') return true
        if (profile.goal_category === 'Atuação') return cats.some(c => c.includes('Actor') || c.includes('Actress'))
        return cats.includes(profile.goal_category)
      })

  const watchedGoal = goalFilms.filter(f => userFilms.find(u => u.film_id === f.id && u.watched)).length
  const customTarget = isCustomGoal ? customGoalCount : goalFilms.length
  const progress = customTarget > 0 ? Math.min(watchedGoal / customTarget, 1) : 0
  const goalComplete = progress >= 1 && customTarget > 0
  const watchedFilms = films.filter(f => userFilms.find(u => u.film_id === f.id && u.watched))

  const goalLabel = isCustomGoal
    ? `${customGoalCount} filmes`
    : (GOAL_OPTIONS.find(g => g.category === profile.goal_category)?.label ?? 'Melhor Filme')

  useEffect(() => {
    if (progress === 1 && prevProgress < 1 && customTarget > 0) {
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000)
    }
    setPrevProgress(progress)
  }, [progress, prevProgress, customTarget])

  useEffect(() => {
    if (loading) return
    try {
      const flag = localStorage.getItem('estante_tour')
      if (flag) { localStorage.removeItem('estante_tour'); setTimeout(() => setTourStep(0), 700) }
    } catch (_) {}
  }, [loading])

  async function updateGoal(cat: string) {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return
    setProfile(p => ({ ...p, goal_category: cat })); setGoalDropdownOpen(false)
    await supabase.from('user_profiles').update({ goal_category: cat }).eq('id', userId)
  }

  async function saveConfig() {
    if (!userId) return
    setSavingConfig(true)
    const supabase = createClient()
    if (supabase) {
      if (editEmail) await supabase.auth.updateUser({ email: editEmail })
      if (editPassword) await supabase.auth.updateUser({ password: editPassword })
      await supabase.from('user_profiles').update({
        display_name: editDisplayName,
        username: editUsername,
        avatar_index: tempAvatarIndex
      }).eq('id', userId)
    }
    setProfile(p => ({ ...p, display_name: editDisplayName, username: editUsername, avatar_index: tempAvatarIndex }))
    setConfigMsg('Configurações salvas!')
    setTimeout(() => {
      setConfigMsg('')
      setSavingConfig(false)
      setConfigOpen(false)
      setTimeout(() => {
        const a = AVATARS[tempAvatarIndex]
        const eggMap: Record<string, string> = {
          '🦁': 'lion', '🎈': 'up', '🤵': '007', '🦇': 'batman',
          '🗼': 'paris', '☕️': 'clube', '🛳': 'titanic', '💰': 'chefao',
          '🐶': 'compadecida', '👵': 'central',
          '🐔': 'cidadededeus', '👩‍🦱': 'minhamae', '💀': 'tropa',
          '🛸': 'bacurau', '🏊‍♀️': 'quehoras', '🤡': 'palhaco',
          '🦈': 'agente'
        }
        const egg = eggMap[a]
        if (egg) {
          setActiveEgg(egg)
          setTimeout(() => setActiveEgg(null), ['up', 'titanic', 'central', 'minhamae', 'cidadededeus', 'agente'].includes(egg) ? 4000 : 3000)
        }
      }, 500)
    }, 1500)
  }

  async function shareGoal() {
    if (!isPWA) { setShowInstallGate(true); return }
    if (!shareRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const el = shareRef.current
    const canvas = await html2canvas(el, {
      backgroundColor: '#0a0a0f', scale: 3, useCORS: false, allowTaint: false, logging: false,
      scrollX: 0, scrollY: 0,
      onclone: (doc: Document) => { doc.documentElement.style.fontFeatureSettings = 'normal' },
    })
    canvas.toBlob(async blob => {
      if (!blob) return
      const file = new File([blob], 'goes-to-oscar2026.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Goes To... · Oscar 2026' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'goes-to-oscar2026.png'; a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  function saveBolao(newBolao: Record<string, string>) {
    setBolao(newBolao)
    if (userId) {
      try { localStorage.setItem(`bolao_${userId}`, JSON.stringify(newBolao)) } catch (_) {}
    }
  }

  function openBolao() {
    const complete = BOLAO_CATEGORIES.every(c => bolao[c.cat])
    if (complete) {
      setBolaoResultsOpen(true)
    } else {
      const firstUnanswered = BOLAO_CATEGORIES.findIndex(c => !bolao[c.cat])
      setBolaoStep(firstUnanswered >= 0 ? firstUnanswered : 0)
      setBolaoOpen(true)
    }
  }

  function pickFilm(optionKey: string) {
    const cat = BOLAO_CATEGORIES[bolaoStep].cat
    const newBolao = { ...bolao, [cat]: optionKey }
    saveBolao(newBolao)
    const allDone = BOLAO_CATEGORIES.every(c => newBolao[c.cat])
    if (allDone) {
      setBolaoOpen(false)
      setTimeout(() => setBolaoResultsOpen(true), 420)
    } else if (bolaoStep < BOLAO_CATEGORIES.length - 1) {
      setTimeout(() => setBolaoStep(s => s + 1), 160)
    }
  }

  const glass = {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
  }

  const accentColor = goalComplete ? '#FF453A' : '#a78bfa'
  const bgGradient = goalComplete
    ? 'linear-gradient(160deg, #3a0c0a 0%, #1e0908 55%, #0a0a0f 100%)'
    : 'linear-gradient(160deg, #1e1b4b 0%, #0f0c29 55%, #0a0a0f 100%)'

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  return (
    <>
      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(360deg); }
        }
      `}</style>

      <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

        {/* Avatar color light */}
        <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{
          height: '220px', zIndex: 0,
          background: `linear-gradient(to bottom,
            ${AVATAR_COLORS[profile.avatar_index]?.[0]}4D 0%,
            ${AVATAR_COLORS[profile.avatar_index]?.[1]}26 55%,
            transparent 100%)`,
          transition: 'background 0.6s ease',
        }}/>

        {/* Confetti */}
        {showConfetti && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {Array.from({ length: 60 }, (_, i) => (
              <div key={i} className="absolute" style={{
                left: `${Math.random() * 100}%`, top: '-10%', width: 8, height: 8,
                borderRadius: Math.random() > 0.5 ? '50%' : 2,
                background: ['#FF453A','#CC3228','#ffffff','#a78bfa','#60a5fa'][i % 5],
                animation: `fall ${1 + Math.random() * 2}s ${Math.random() * 2}s linear forwards`,
              }}/>
            ))}
          </div>
        )}

        <EasterEgg egg={activeEgg as EggType} />


        {/* Botões agrupados: Bolão + Configurações */}
        <div ref={toolbarRef} className="lg-btn fixed z-[100] flex items-center pointer-events-auto"
          style={{ ...lgStyle, top: 'max(env(safe-area-inset-top), 45px)', right: '15px',
                   height: '44px', borderRadius: '22px', padding: '0 6px', gap: '4px', position: 'fixed' }}>
          {/* HIG Toolbar: glare diagonal */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
          {/* Bolão */}
          <button onClick={openBolao}
            className="flex items-center justify-center flex-shrink-0 relative"
            style={{ width: 43, height: 43, background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1.5" stroke="white" strokeWidth="1.8"/>
              <path d="M9 12h6M9 16h4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {BOLAO_CATEGORIES.every(c => bolao[c.cat]) && (
              <div style={{ position: 'absolute', top: 9, right: 9, width: 6, height: 6,
                borderRadius: '50%', background: '#FF453A',
                boxShadow: '0 0 6px rgba(255,69,58,0.8)' }}/>
            )}
          </button>
          {/* Notificações */}
          {typeof window !== 'undefined' && 'PushManager' in window && notifStatus !== 'denied' && (
            <button
              onClick={notifStatus === 'subscribed' ? undefined : subscribeToNotifications}
              disabled={notifLoading}
              className="flex items-center justify-center flex-shrink-0 relative"
              style={{ width: 43, height: 43, background: 'none', border: 'none', cursor: notifStatus === 'subscribed' ? 'default' : 'pointer', opacity: notifLoading ? 0.5 : 1 }}
            >
              {notifStatus === 'subscribed' ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="6" r="3.5" fill="#34C759" stroke="#0a0a0f" strokeWidth="1.5"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}
          {/* Admin (só visível para admins) */}
          {profile.is_admin && (
            <button onClick={() => router.push('/admin')}
              className="flex items-center justify-center flex-shrink-0 relative"
              style={{ width: 43, height: 43, background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {/* Config */}
          <button onClick={() => { setTempAvatarIndex(profile.avatar_index); setConfigOpen(true) }}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 43, height: 43, background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="white" strokeWidth="1.8"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="white" strokeWidth="1.8"/>
            </svg>
          </button>
        </div>

        {/* Perfil */}
        <div ref={profileRef} className="flex flex-col items-center relative z-10" style={{ marginTop: '100px', marginBottom: '33px' }}>
          <div className="relative rounded-full flex items-center justify-center mb-4 shadow-2xl pointer-events-none"
            style={{
              width: '125px', height: '125px',
              background: `linear-gradient(135deg, ${AVATAR_COLORS[profile.avatar_index]?.[0] || '#333'}, ${AVATAR_COLORS[profile.avatar_index]?.[1] || '#111'})`,
              border: '3px solid rgba(255,255,255,0.6)'
            }}>
            <span style={{ fontSize: '65px' }}>{AVATARS[profile.avatar_index]}</span>
          </div>
          <p className="font-bold" style={{ fontSize: '28px', color: 'white', lineHeight: '1.2' }}>
            {profile.display_name || 'Cinéfilo'}
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
            @{profile.username || 'usuario'}
          </p>
        </div>

        <div className="px-4 flex flex-col gap-5">

          {/* Meta */}
          <div ref={metaRef} style={{ position: 'relative', zIndex: 10 }}>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle className={goalComplete ? 'text-[#FF453A]' : ''}>
                {goalComplete ? '🏆 Meta concluída!' : 'Minha meta'}
              </SectionTitle>
              <div className="flex items-center gap-2">

                {/* Dropdown Meta */}
                <div style={{ position: 'relative' }}>
                  <button ref={goalBtnRef} onClick={() => {
                      const r = goalBtnRef.current?.getBoundingClientRect()
                      if (r) setGoalBtnAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right })
                      setGoalDropdownOpen(!goalDropdownOpen)
                    }}
                    className="lg-btn flex items-center gap-2 px-4 rounded-full text-sm font-semibold"
                    style={{ position: 'relative', ...lgStyle, height: 43, color: 'rgba(255,255,255,0.9)',
                      paddingRight: 12 }}>
                    <span>{goalLabel}</span>
                    {/* HIG pop-up button indicator: chevron up+down empilhados */}
                    <svg width="11" height="16" viewBox="0 0 11 16" fill="none"
                      style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                      <path d="M1 6L5.5 1.5L10 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 10L5.5 14.5L10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {goalDropdownOpen && goalBtnAnchor && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 98 }} onClick={() => setGoalDropdownOpen(false)}/>
                      <div className="fixed rounded-2xl dropdown-glass"
                        style={{ zIndex: 99, top: goalBtnAnchor.top, right: goalBtnAnchor.right, minWidth: 200, width: 'max-content',
                          backdropFilter: 'blur(48px) saturate(200%)', WebkitBackdropFilter: 'blur(48px) saturate(200%)' }}>
                        {GOAL_OPTIONS.filter(g => g.category !== 'custom').map(g => (
                          <button key={g.category} onClick={() => updateGoal(g.category)}
                            className="dd-item"
                            style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {/* Placeholder à esquerda — padrão iOS: checkmark reserva espaço fixo */}
                            <span style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {g.category === profile.goal_category && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M5 12L10 17L19 7" stroke="#FF453A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                            <span>{g.label}</span>
                          </button>
                        ))}
                        {/* Separador antes da opção personalizada */}
                        <div className="dd-separator"/>
                        {GOAL_OPTIONS.filter(g => g.category === 'custom').map(g => (
                          <div key={g.category}>
                            <button onClick={() => updateGoal(g.category)}
                              className="dd-item"
                              style={{ color: 'rgba(255,255,255,0.85)' }}>
                              <span style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {g.category === profile.goal_category && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12L10 17L19 7" stroke="#FF453A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </span>
                              <span>{g.label}</span>
                            </button>
                            {/* Input numérico inline para meta personalizada */}
                            {g.category === 'custom' && profile.goal_category === 'custom' && (
                              <div className="px-4 pb-3 flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1} max={999}
                                  value={customGoalInput}
                                  onChange={e => {
                                    setCustomGoalInput(e.target.value)
                                    const n = parseInt(e.target.value)
                                    if (!isNaN(n) && n > 0) setCustomGoalCount(n)
                                  }}
                                  className="rounded-lg px-3 py-1.5 text-sm text-right"
                                  style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'white', outline: 'none', width: 72
                                  }}
                                />
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>filmes</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Compartilhar meta */}
                <button onClick={() => setMetaOpen(true)}
                  className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ ...lgStyle, width: 43, height: 43, color: 'white' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '-2px' }}>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Box da Meta */}
            <div className="rounded-3xl p-5" style={{
              ...glass,
              background: goalComplete ? 'rgba(255,69,58,0.1)' : 'rgba(255,255,255,0.06)',
              border: goalComplete ? '1px solid rgba(255,69,58,0.25)' : '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold tabular-nums" style={{ color: goalComplete ? '#FF453A' : 'white' }}>{watchedGoal}</span>
                <span className="text-xl mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>/ {customTarget}</span>
                <span className="text-[10px] uppercase tracking-wider mb-1.5 ml-1 font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>assistidos</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress * 100}%`, background: goalComplete ? 'linear-gradient(90deg, #CC3228, #FF453A, #FF6961)' : 'linear-gradient(90deg, #CC3228, #FF453A)' }}/>
              </div>
              <p className="text-[11px] mt-3 font-medium" style={{ color: goalComplete ? 'rgba(255,69,58,0.7)' : 'rgba(255,255,255,0.3)' }}>
                {goalComplete
                  ? 'Você assistiu tudo! Incrível 🌟'
                  : `${customTarget - watchedGoal} ${customTarget - watchedGoal === 1 ? 'falta' : 'faltam'} pra cravar a meta 🎯`}
              </p>
            </div>
          </div>

          {/* Grid filmes assistidos */}
          {watchedFilms.length > 0 ? (
            <div>
              <SectionTitle className="mb-3">O que você assistiu</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {watchedFilms.map(film => {
                  const uf = userFilms.find(u => u.film_id === film.id)
                  return (
                    <Link key={film.id} href={`/filmes/${film.id}`} className="poster-press relative rounded-2xl overflow-hidden" style={{ aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.14)' }}>
                      <div className="absolute inset-0">
                        {posters[film.title]
                          ? <Image src={posters[film.title]!} alt={film.title} fill className="object-cover" />
                          : <div className="w-full h-full flex items-end p-3" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                              <p className="text-white text-xs font-semibold leading-tight">{ptTitles[film.title] || film.title}</p>
                            </div>
                        }
                      </div>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}/>
                      {uf?.rating && <p className="absolute bottom-2 left-3 text-xs z-10" style={{ color: '#FF453A' }}>{'★'.repeat(uf.rating)}</p>}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,69,58,0.9)' }}>
                        <span className="text-[10px] font-bold text-black">✓</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 gap-4">
              <span className="text-6xl">🍿</span>
              <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Sua estante está vazia</p>
              <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Que tal explorar os indicados?</p>
              <Link href="/filmes" className="lg-btn mt-2 px-5 py-3 rounded-full text-sm font-semibold"
                style={{ background: 'rgba(255,69,58,0.15)', border: '1px solid rgba(255,69,58,0.3)', color: '#FF453A' }}>
                Ver indicados a Melhor Filme
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* ── Sheet Configurações ──────────────────────────────────── */}
      <BottomSheet open={configOpen} onClose={() => setConfigOpen(false)} title="Configurações"
        onAction={saveConfig} actionLabel={savingConfig ? '...' : 'Concluído'}>
        <div className="flex flex-col gap-6 px-5 pt-2">
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Avatar</p>
            <div className="flex flex-wrap gap-3 justify-start">
              {AVATARS.map((emoji, i) => (
                <button key={i} onClick={() => setTempAvatarIndex(i)}
                  className={`lg-btn w-[50px] h-[50px] rounded-full text-2xl flex items-center justify-center transition-all ${
                    tempAvatarIndex === i ? 'scale-110 ring-2 ring-white z-10 shadow-lg' : 'opacity-60 scale-95 hover:opacity-100'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${AVATAR_COLORS[i][0]}, ${AVATAR_COLORS[i][1]})` }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
          <div className="form-rows">
            {[
              { label: 'Nome', value: editDisplayName, onChange: setEditDisplayName, placeholder: 'Como quer ser chamado', type: 'text' },
              { label: 'Usuário', value: editUsername, onChange: setEditUsername, placeholder: '@usuario', type: 'text' },
              { label: 'Email', value: editEmail, onChange: setEditEmail, placeholder: 'email@exemplo.com', type: 'email' },
              { label: 'Senha', value: editPassword, onChange: setEditPassword, placeholder: '••••••••', type: 'password' },
            ].map(field => (
              <div key={field.label} className="form-row">
                <span className="form-row-label">{field.label}</span>
                <input type={field.type} value={field.value} onChange={e => field.onChange(e.target.value)}
                  placeholder={field.placeholder} className="form-row-input"/>
              </div>
            ))}
          </div>
          {configMsg && (
            <p className="text-xs text-center font-medium" style={{ color: 'rgba(255,69,58,0.8)' }}>{configMsg}</p>
          )}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
          <button onClick={async () => { const sb = createClient(); if (sb) await sb.auth.signOut(); router.push('/') }}
            className="lg-btn w-full py-3.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid transparent', color: 'rgba(255,99,88,0.9)' }}>
            Sair da conta
          </button>
        </div>

        {/* Rodapé do app */}
        <div className="px-5 pt-6" style={{ background: 'rgba(80,80,88,0.35)', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '20px', paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 20px), 44px)', marginBottom: 'calc(-1 * max(env(safe-area-inset-bottom), 32px))' }}>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.28)' }}>
            O <span style={{ color: 'rgba(255,255,255,0.5)' }}>Goes To...</span> é um app desenvolvido por{' '}
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Marcelo Monteiro</span> com auxílio da{' '}
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Claude</span>.
          </p>
          <div className="flex gap-4">
            {[
              { href: 'https://x.com/mrclmonteiro', label: 'X', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { href: 'https://www.instagram.com/mrclmonteiro/', label: 'Instagram', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
              { href: 'https://letterboxd.com/mrclmonteiro/', label: 'Letterboxd', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.7 3C3 3 0 6 0 9.7v4.6C0 18 3 21 6.7 21h10.6c3.7 0 6.7-3 6.7-6.7V9.7C24 6 21 3 17.3 3H6.7zm5.3 3.3a5.7 5.7 0 110 11.4 5.7 5.7 0 010-11.4zm-4 1.9a5.7 5.7 0 100 7.6 7 7 0 010-7.6zm8 0a7 7 0 010 7.6 5.7 5.7 0 100-7.6z"/></svg> },
              { href: 'https://github.com/mrclmonteiro/goes-to', label: 'GitHub', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg> },
            ].map(({ href, label, svg }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center"
                style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 0 }}>
                {svg}
              </a>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* ── Sheet Meta + Share ───────────────────────────────────── */}
      <BottomSheet open={metaOpen} onClose={() => setMetaOpen(false)} title="Minha Meta">
        <div className="px-5 py-4 flex flex-col gap-5">

          {/* ── Card Story 9:16 ── */}
          {/* Wrapper visual: cantos arredondados só na UI */}
          <div style={{ borderRadius: 24, overflow: 'hidden', width: '100%', aspectRatio: '9/16' }}>
          <div ref={shareRef}
            style={{
              width: '100%', height: '100%',
              background: bgGradient,
              borderRadius: 0,
              display: 'flex', flexDirection: 'column',
              padding: '36px 28px',
              position: 'relative',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>

            {/* Orbes decorativos */}
            <div style={{
              position: 'absolute', top: '-8%', right: '-12%',
              width: '65%', height: '40%', borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
              filter: 'blur(40px)', pointerEvents: 'none',
            }}/>
            <div style={{
              position: 'absolute', bottom: '10%', left: '-15%',
              width: '55%', height: '30%', borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
              filter: 'blur(32px)', pointerEvents: 'none',
            }}/>

            {/* Topo: ícone do app */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)', flexShrink: 0,
              }}>
                {iconDataUrl
                  ? <img src={iconDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }}/>
                }
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Goes To...</p>
            </div>

            {/* Perfil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 99,
                background: `${accentColor}22`,
                border: `2px solid ${accentColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>
                {AVATARS[profile.avatar_index]}
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                  {profile.display_name ?? 'Cinéfilo'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Conteúdo central */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

              {goalComplete ? (
                /* ── CELEBRAÇÃO ────────────────────────────────── */
                <>
                  <p style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))', lineHeight: 1 }}>
                    🏆✨
                  </p>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: `${accentColor}99`, marginBottom: 12,
                  }}>
                    Meta concluída!
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: 8 }}>
                    Assisti todos os <span style={{ color: accentColor }}>{customTarget}</span> filmes da minha meta
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 28 }}>
                    {goalLabel} · Oscar 2026
                  </p>

                  {/* Barra cheia dourada */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Progresso</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: accentColor }}>100%</p>
                    </div>
                    <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, width: '100%',
                        background: 'linear-gradient(90deg, #CC3228, #FF453A, #FF6961)',
                        boxShadow: '0 0 12px rgba(255,69,58,0.5)',
                      }}/>
                    </div>
                  </div>

                  <p style={{ fontSize: 28, letterSpacing: 6, textAlign: 'center' }}>🌟🎬🌟🎬🌟</p>
                </>
              ) : (
                /* ── PROGRESSO ─────────────────────────────────── */
                <>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: `${accentColor}99`, marginBottom: 14,
                  }}>
                    Minha meta · Oscar 2026
                  </p>

                  <p style={{ fontSize: 21, fontWeight: 800, color: 'white', lineHeight: 1.35, marginBottom: 28 }}>
                    Já bati{' '}
                    <span style={{ color: accentColor }}>{watchedGoal}/{customTarget}</span>
                    {' '}da minha meta de{' '}
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{goalLabel}</span>
                    {' '}dos indicados ao Oscar 2026
                  </p>

                  {/* Barra de progresso */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Progresso</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: accentColor }}>{Math.round(progress * 100)}%</p>
                    </div>
                    {/* Track */}
                    <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${progress * 100}%`,
                        background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
                      }}/>
                    </div>
                    {/* Tick marks */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      {[0, 25, 50, 75, 100].map(pct => (
                        <p key={pct} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{pct}%</p>
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {customTarget - watchedGoal} {customTarget - watchedGoal === 1 ? 'falta' : 'faltam'} pra cravar 🎯
                  </p>
                </>
              )}
            </div>

            {/* Rodapé */}
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 24, letterSpacing: '0.05em' }}>
              goes-to.vercel.app
            </p>
          </div>
          </div>{/* end visual wrapper */}

          <button onClick={shareGoal}
            className="primary-btn flex items-center justify-center gap-2"
            style={{ fontSize: 15 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Compartilhar nos Stories
          </button>
        </div>
      </BottomSheet>

      {/* ── Sheet Bolão Quiz ────────────────────────────────────── */}
      <BottomSheet open={bolaoOpen} onClose={() => setBolaoOpen(false)}>
        {(() => {
          const step = BOLAO_CATEGORIES[bolaoStep]
          // Gerar opções: se há nominee, uma opção por indicado; senão, uma opção por filme
          const catFilmsForStep = films.filter(f =>
            nominations.some(n => n.film_id === f.id && n.category === step.cat)
          )
          const hasNominees = nominations.some(n => n.category === step.cat && n.nominee)
          const nomineeOptions = hasNominees
            ? nominations
                .filter(n => n.category === step.cat && n.nominee && n.film_id)
                .flatMap(n => n.nominee
                  ? n.nominee.split(/,| e /).map(s => s.trim()).filter(Boolean).map(name => ({
                      filmId: n.film_id,
                      filmTitle: ptTitles[films.find(f => f.id === n.film_id)?.title || ''] || films.find(f => f.id === n.film_id)?.title || '',
                      poster: posters[films.find(f => f.id === n.film_id)?.title || ''],
                      nominee: name
                    }))
                  : []
                )
            : catFilmsForStep.map(f => ({
                filmId: f.id,
                filmTitle: ptTitles[f.title] || f.title,
                poster: posters[f.title],
                nominee: ''
              }))
          const answered = BOLAO_CATEGORIES.filter(c => bolao[c.cat]).length
          return (
            <div className="px-5 flex flex-col" style={{ paddingBottom: 8 }}>
              {/* Step progress */}
              <div className="flex gap-1 mb-6">
                {BOLAO_CATEGORIES.map((_, i) => (
                  <button key={i} onClick={() => setBolaoStep(i)}
                    style={{
                      flex: 1, height: 3, borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: i === bolaoStep
                        ? '#FF453A'
                        : bolao[BOLAO_CATEGORIES[i].cat]
                          ? 'rgba(255,69,58,0.35)'
                          : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s',
                    }}/>
                ))}
              </div>

              {/* Category header */}
              <div className="mb-1">
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'rgba(255,69,58,0.6)', marginBottom: 4 }}>
                  {answered}/{BOLAO_CATEGORIES.length} respondidas
                </p>
                <p style={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
                  {step.label}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                  Quem você acha que vai ganhar?
                </p>
              </div>

              {/* Film list */}
              <div className="flex flex-col mt-4" style={{ gap: 2 }}>
                {nomineeOptions.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', padding: 24 }}>
                    Nenhum indicado disponível para esta categoria.
                  </div>
                ) : (
                  nomineeOptions.map((opt, idx) => {
                    const optionKey = opt.nominee ? `${opt.filmId}-${opt.nominee}` : opt.filmId
                    const isSelected = bolao[step.cat] === optionKey
                    return (
                      <button key={optionKey} onClick={() => pickFilm(optionKey)}
                        className="lg-btn flex items-center gap-3 rounded-2xl text-left transition-all"
                        style={{
                          padding: '10px 12px',
                          background: isSelected ? 'rgba(255,69,58,0.12)' : 'rgba(255,255,255,0.04)',
                          border: isSelected ? '1px solid rgba(255,69,58,0.4)' : '1px solid transparent',
                          cursor: 'pointer',
                        }}>
                        {/* Poster */}
                        <div style={{ width: 40, height: 60, borderRadius: 8, overflow: 'hidden',
                          flexShrink: 0, background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)' }}>
                          {opt.poster
                            ? <img src={opt.poster!} alt={opt.filmTitle}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                            : <div style={{ width: '100%', height: '100%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 16 }}>🎬</span>
                              </div>
                          }
                        </div>
                        {/* Title + nominee */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600,
                            color: isSelected ? '#FF453A' : 'rgba(255,255,255,0.85)',
                            lineHeight: 1.3, marginBottom: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opt.filmTitle}
                          </p>
                          {opt.nominee && (
                          <div style={{ fontSize: 11, color: '#FF453A', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opt.nominee}
                          </div>
                          )}
                        </div>
                        {/* Check */}
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? '#FF453A' : 'rgba(255,255,255,0.08)',
                          border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12L10 17L19 7" stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Nav: anterior / próximo */}
              <div className="flex items-center justify-between mt-6">
                <div>
                  {bolaoStep > 0 && (
                    <button onClick={() => setBolaoStep(s => s - 1)}
                      className="lg-btn flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ ...lgStyle, position: 'relative', width: 43, height: 43 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div>
                  {bolaoStep < BOLAO_CATEGORIES.length - 1 && bolao[step.cat] && (
                    <button onClick={() => setBolaoStep(s => s + 1)}
                      className="lg-btn flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ ...lgStyle, position: 'relative', width: 43, height: 43 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  {bolaoStep === BOLAO_CATEGORIES.length - 1 && bolao[step.cat] && (
                    <button onClick={() => { setBolaoOpen(false); setTimeout(() => setBolaoResultsOpen(true), 420) }}
                      className="lg-btn flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ position: 'relative', width: 43, height: 43, background: '#FF453A', border: '1px solid rgba(255,255,255,0.25)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,69,58,0.4), inset 1px 1px 0px rgba(255,255,255,0.35), inset -1px -1px 0px rgba(0,0,0,0.15)' }}>
                      <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 3 }}>
                        <path d="M5 12L10 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </BottomSheet>

      {/* ── Sheet Bolão Resultados + Share ───────────────────────── */}
      <BottomSheet open={bolaoResultsOpen} onClose={() => setBolaoResultsOpen(false)} title="Meu Bolão">
        <div className="px-5 pb-4 flex flex-col gap-4">

          {/* Card 9:16 para compartilhar */}
          <div style={{ borderRadius: 24, overflow: 'hidden', width: '100%', aspectRatio: '9/16' }}>
            <div ref={bolaoShareRef}
              style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(160deg, #1a0533 0%, #0f0c29 50%, #0a0a0f 100%)',
                display: 'flex', flexDirection: 'column',
                padding: '36px 26px 28px',
                position: 'relative',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
              {/* Orbe */}
              <div style={{ position: 'absolute', top: '-5%', right: '-10%',
                width: '60%', height: '35%', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,69,58,0.2) 0%, transparent 70%)',
                filter: 'blur(40px)', pointerEvents: 'none' }}/>
              <div style={{ position: 'absolute', bottom: '8%', left: '-15%',
                width: '55%', height: '28%', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
                filter: 'blur(32px)', pointerEvents: 'none' }}/>

              {/* Header: logo esquerda, avatar direita */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.18)', flexShrink: 0 }}>
                    {iconDataUrl
                      ? <img src={iconDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }}/>
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Goes To...</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                      {profile.display_name ?? 'Cinéfilo'}
                    </p>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>@{profile.username}</p>
                  </div>
                  <div style={{ width: 34, height: 34, borderRadius: 99,
                    background: `linear-gradient(135deg, ${AVATAR_COLORS[profile.avatar_index]?.[0]}, ${AVATAR_COLORS[profile.avatar_index]?.[1]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.3)' }}>
                    {AVATARS[profile.avatar_index]}
                  </div>
                </div>
              </div>

              {/* Melhor Filme + grid centralizados verticalmente */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>

              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3, marginBottom: 14 }}>
                Estes são meus palpites para o Oscar 2026
              </p>

              {/* Melhor Filme — destaque */}
              {(() => {
                const bpCat = BOLAO_CATEGORIES.find(c => c.cat === 'Best Picture')!
                const bpRaw = bolao[bpCat.cat] || ''
                const bpFilm = films.find(f => bpRaw === f.id || bpRaw.startsWith(f.id + '-'))
                const bpFilmId = bpFilm?.id
                const bpPt = bpFilm ? (ptTitles[bpFilm.title] || bpFilm.title) : '—'
                return (
                  <div style={{
                    background: 'rgba(255,69,58,0.1)',
                    border: '1px solid rgba(255,69,58,0.3)',
                    borderRadius: 12, padding: '10px 12px', marginBottom: 12,
                  }}>
                    <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: 'rgba(255,69,58,0.6)', marginBottom: 2 }}>
                      🏆 Melhor Filme
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#FF453A',
                      lineHeight: 1.2, overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as any }}>
                      {bpPt}
                    </p>
                  </div>
                )
              })()}

              {/* Other 9 categories — compact 2-col grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 2 }}>
                {BOLAO_CATEGORIES.filter(c => c.cat !== 'Best Picture').map(c => {
                  const raw = bolao[c.cat] || ''
                  const film = films.find(f => raw === f.id || raw.startsWith(f.id + '-'))
                  const pt = film ? (ptTitles[film.title] || film.title) : '—'
                  const selectedNomineeFromKey = film && raw.startsWith(film.id + '-')
                    ? raw.slice(film.id.length + 1)
                    : ''
                  const selectedNomineeFromTable = !selectedNomineeFromKey && film
                    ? nominations
                        .filter(n => n.film_id === film.id && n.category === c.cat && n.nominee)
                        .flatMap(n => n.nominee ? n.nominee.split(/,| e /).map(s => s.trim()).filter(Boolean) : [])
                        .join(', ')
                    : ''
                  const selectedNominee = selectedNomineeFromKey || selectedNomineeFromTable
                  return (
                    <div key={c.cat} style={{ minWidth: 0, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: 7, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {c.label}
                      </p>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                        lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {selectedNominee || pt}
                      </p>
                      {selectedNominee && (
                        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', lineHeight: 1.2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pt}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              </div>{/* end centralized content */}

              {/* Footer */}
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)',
                textAlign: 'center', marginTop: 8, letterSpacing: '0.05em' }}>
                goes-to.vercel.app
              </p>
            </div>
          </div>

          {/* Edit + Share buttons */}
          <div className="flex gap-3">
            <button onClick={() => { setBolaoResultsOpen(false); setTimeout(() => { setBolaoStep(0); setBolaoOpen(true) }, 420) }}
              className="lg-btn flex-1 py-3.5 rounded-full text-sm font-semibold"
              style={{ ...lgStyle, position: 'relative', color: 'rgba(255,255,255,0.7)' }}>
              Editar palpites
            </button>
            <button onClick={async () => {
              if (!isPWA) { setBolaoResultsOpen(false); setTimeout(() => setShowInstallGate(true), 420); return }
              if (!bolaoShareRef.current) return
              const { default: html2canvas } = await import('html2canvas')
              const el = bolaoShareRef.current
              const canvas = await html2canvas(el, {
                backgroundColor: '#0a0a0f', scale: 3, useCORS: false, allowTaint: false, logging: false,
                scrollX: 0, scrollY: 0,
              })
              canvas.toBlob(async blob => {
                if (!blob) return
                const file = new File([blob], 'goes-to-bolao2026.png', { type: 'image/png' })
                if (navigator.share && navigator.canShare?.({ files: [file] })) {
                  await navigator.share({ files: [file], title: 'Meu Bolão · Oscar 2026' })
                } else {
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url
                  a.download = 'goes-to-bolao2026.png'; a.click()
                  URL.revokeObjectURL(url)
                }
              }, 'image/png')
            }}
              className="accent-btn flex-1"
              style={{ background: '#FF453A', border: '1px solid rgba(255,255,255,0.25)',
                color: 'white', fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 20px rgba(255,69,58,0.35), inset 1px 1px 0px rgba(255,255,255,0.3), inset -1px -1px 0px rgba(0,0,0,0.12)' }}>
              Compartilhar
            </button>
          </div>
        </div>
      </BottomSheet>

      {tourStep >= 0 && (
        <EstanteTour
          step={tourStep}
          onAdvance={() => tourStep < TOUR_STEPS.length - 1 ? setTourStep(s => s + 1) : setTourStep(-1)}
          toolbarRef={toolbarRef}
          profileRef={profileRef}
          metaRef={metaRef}
        />
      )}
      {showInstallGate && <InstallGate onClose={() => setShowInstallGate(false)} />}
    </>
  )
}