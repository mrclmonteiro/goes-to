'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchSimilarMovies, fetchPersonPhoto } from '@/lib/tmdb'
import Link from 'next/link'
import Spinner from '../components/Spinner'
import { ORDERED_CATEGORIES, categoryCardBg, categorySlug } from '@/lib/categories'

const CATEGORY_LABELS: Record<string, string> = {
  'Best Picture': 'Melhor Filme',
  'Best Director': 'Melhor Direção',
  'Best Actor': 'Melhor Ator',
  'Best Actress': 'Melhor Atriz',
  'Best Supporting Actor': 'Melhor Ator Coadjuvante',
  'Best Supporting Actress': 'Melhor Atriz Coadjuvante',
  'Best Animated Feature': 'Melhor Animação',
  'Best International Feature': 'Melhor Filme Internacional',
  'Best Adapted Screenplay': 'Roteiro Adaptado',
  'Best Original Screenplay': 'Roteiro Original',
  'Best Cinematography': 'Fotografia',
  'Best Film Editing': 'Montagem',
  'Best Original Score': 'Trilha Sonora Original',
  'Best Original Song': 'Canção Original',
  'Best Costume Design': 'Figurino',
  'Best Production Design': 'Direção de Arte',
  'Best Makeup and Hairstyling': 'Maquiagem e Cabelo',
  'Best Sound': 'Som',
  'Best Visual Effects': 'Efeitos Visuais',
  'Best Casting': 'Elenco',
  'Best Documentary Feature': 'Documentário',
}

const PERSON_CATEGORIES = [
  'Best Director', 'Best Actor', 'Best Actress',
  'Best Supporting Actor', 'Best Supporting Actress',
  'Best Cinematography', 'Best Original Score',
]

const FACTS = [
  { emoji: '🏆', title: 'Recorde histórico', text: 'No Oscar 2026, Sinners lidera com 16 indicações — batendo o recorde anterior de 14, que pertencia a A Malvada (1950), Titanic (1997) e La La Land (2016).', grad: ['#78350f','#92400e'] },
  { emoji: '🌍', title: '4 línguas no páreo', text: 'O Oscar 2026 marca um recorde inédito: quatro atuações em língua não-inglesa indicadas no mesmo ano — Lilleaas, Moura, Reinsve e Skarsgård disputam as categorias de interpretação.', grad: ['#1e3a5f','#1e40af'] },
  { emoji: '👩', title: '76 mulheres indicadas', text: 'O Oscar 2026 estabelece um novo recorde de representatividade: 76 mulheres indicadas nesta edição, superando o anterior de 71, registrado em 2023.', grad: ['#4a1d96','#6d28d9'] },
  { emoji: '🎬', title: 'Spielberg faz história', text: 'Com Hamnet, Steven Spielberg chega a 14 indicações de Melhor Filme como produtor no Oscar — um recorde absoluto desde 1951, quando o sistema de votação foi reformado.', grad: ['#064e3b','#065f46'] },
  { emoji: '🎵', title: 'Diane Warren, 17ª vez', text: 'Diane Warren recebe sua 17ª indicação ao Oscar na categoria Canção Original — o 9º ano consecutivo. Apesar dos recordes, ela ainda não levou a estatueta, tendo recebido o Oscar honorário em 2022.', grad: ['#831843','#9d174d'] },
  { emoji: '🇧🇷', title: 'Brasil na disputa', text: 'The Secret Agent representa o Brasil no Oscar 2026 — a 6ª vez que o país chega à fase final da categoria de Melhor Filme Internacional. O último a disputar foi Ainda Estou Aqui (2024), que venceu a categoria.', grad: ['#14532d','#166534'] },
  { emoji: '🗳️', title: 'Oscar em números', text: 'No Oscar 2026: 317 filmes elegíveis, 10.136 votantes da Academia e mais de 200 países acompanhando a cerimônia, que acontece em 15 de março.', grad: ['#1c1917','#44403c'] },
  { emoji: '🗿', title: 'A estatueta', text: 'O troféu do Oscar mede 34 cm, pesa 3,8 kg e representa um cavaleiro com espada sobre um rolo de filme. Desde a primeira cerimônia, em 1929, já foram entregues mais de 3.491 estatuetas.', grad: ['#312e81','#3730a3'] },
  { emoji: '⏱️', title: 'Maior e menor cerimônia', text: 'A cerimônia do Oscar mais longa da história durou 4h23min, em 2002. A mais curta foi em 1959, com apenas 1h40min. A transmissão pela ABC, nos EUA, começou em 1976.', grad: ['#7c2d12','#9a3412'] },
  { emoji: '🆕', title: 'Nova categoria', text: 'O Oscar 2026 estreia a categoria Melhor Elenco (Achievement in Casting) — a primeira novidade desde a criação de Melhor Filme de Animação, em 2001.', grad: ['#0c4a6e','#075985'] },
]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; rating: number | null }
type Nomination = { film_id: string; category: string; nominee: string | null }
type MovieData = { ptTitle?: string | null; poster: string | null }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-lg font-semibold" style={{ color: 'white' }}>{children}</p>
}

function GaugeChart({ ratings }: { ratings: { title: string; rating: number }[] }) {
  if (ratings.length === 0) return (
    <div className="flex flex-col items-center py-4">
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Sem votos ainda nessa categoria</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Avalie os filmes para ver o favorito</p>
    </div>
  )
  const top = ratings[0]
  const pct = top.rating / 5
  const r = 64, cx = 88, cy = 80
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const needleAngle = 180 + pct * 180
  const needleX = cx + (r - 12) * Math.cos(toRad(needleAngle))
  const needleY = cy + (r - 12) * Math.sin(toRad(needleAngle))
  const segments = 24
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 176 96" className="w-56">
        {Array.from({ length: segments }, (_, i) => {
          const sa = 180 + (i / segments) * 180
          const ea = 180 + ((i + 1) / segments) * 180
          return <path key={i} d={`M ${arcX(sa)} ${arcY(sa)} A ${r} ${r} 0 0 1 ${arcX(ea)} ${arcY(ea)}`}
            stroke={i / segments < pct ? `hsl(${30 + (i/segments)*40},90%,60%)` : 'rgba(128,128,128,0.15)'}
            strokeWidth="8" strokeLinecap="butt" fill="none"/>
        })}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(.34,1.56,.64,1)' }}/>
        <circle cx={cx} cy={cy} r="3.5" fill="white"/>
        <text x={cx} y={cy-16} fill="white" fontSize="22" fontWeight="700" textAnchor="middle">{top.rating}</text>
        <text x={cx} y={cy-3} fill="rgba(255,255,255,0.35)" fontSize="7" textAnchor="middle">estrelas</text>
      </svg>
      <p className="font-semibold text-sm mt-1 text-center" style={{ color: 'white' }}>{top.title}</p>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>favorito dos usuários</p>
      {ratings.length > 1 && (
        <div className="mt-4 w-full flex flex-col gap-2">
          {ratings.slice(0, 5).map((f, i) => (
            <div key={f.title} className="flex items-center gap-3">
              <p className="text-xs w-4 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>#{i+1}</p>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${(f.rating/5)*100}%`, background: i===0 ? 'linear-gradient(90deg,#CC3228,#FF453A)' : 'rgba(255,255,255,0.15)' }}/>
              </div>
              <p className="text-xs w-24 truncate text-right" style={{ color: i===0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>{f.title}</p>
              <p className="text-xs" style={{ color: '#FF453A', width: 28, textAlign: 'right' }}>{f.rating}★</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pl-4 pr-4"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {children}
        <div style={{ minWidth: 4, flexShrink: 0 }}/>
      </div>
      <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, #0a0a0f)' }}/>
    </div>
  )
}



// Liquid glass — tudo inline igual ao BottomNav (Tailwind v4 interfere via CSS)
const lgStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid transparent',
  boxShadow: 'var(--lg-shadow)',
}

// Dropdown glass style – same as filmes page for consistent blur
const ddStyle: React.CSSProperties = {
  background: 'rgba(20,20,25,0.65)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
}
// ── PWA detection ──────────────────────────────────────────────────────
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

// ── Install Gate Popup ─────────────────────────────────────────────────
function InstallGate({ onClose }: { onClose: () => void }) {
  const os = detectOS()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const instructions =
    os === 'ios'
      ? 'No Safari, toque em  ⬡  (Compartilhar) → "Adicionar à Tela de Início" → "Adicionar".'
      : os === 'android'
      ? 'No Chrome, toque em  ⋮  (Menu) → "Adicionar à tela inicial" → "Instalar".'
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
        {/* X — liquid glass padrão 43×43 */}
        <button
          onClick={dismiss}
          className="lg-btn rounded-full flex items-center justify-center"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 43, height: 43,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(6px) saturate(280%)',
            WebkitBackdropFilter: 'blur(6px) saturate(280%)',
            border: '1px solid transparent',
            boxShadow: 'var(--lg-shadow)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Emojis empilhados */}
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 16 }}>
          <span style={{ fontSize: 52, lineHeight: 1, display: 'block' }}>👮</span>
          <span style={{
            fontSize: 26, position: 'absolute',
            bottom: 0, right: -4,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
          }}>🔦</span>
        </div>

        <p style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.2 }}>
          Pego pelo lanterninha!
        </p>

        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
          Para compartilhar nos Stories, você precisa adicionar o atalho do app no seu celular.
        </p>

        {/* Instrução OS */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '12px 14px',
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {os === 'ios' ? 'iPhone / iPad' : os === 'android' ? 'Android' : 'Como instalar'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
            {instructions}
          </p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button
            onClick={dismiss}
            className="primary-btn"
          >
            OK, entendi!
          </button>

          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.25)',
              fontSize: 13, cursor: 'pointer', padding: '8px', minHeight: 44,
            }}
          >
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bottom Sheet — mesmo estilo da Estante ─────────────────────────────
function BottomSheet({ open, onClose, title, onAction, children }: {
  open: boolean
  onClose: () => void
  title: string
  onAction?: () => void  // botão direito (compartilhar)
  children: React.ReactNode
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

  const hasAction = !!onAction

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
          dragStart.current = null
          currentY.current = 0
        }}>

        {/* Handle */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 z-30 pointer-events-none">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-6 z-30">
          {/* Fechar */}
          <button onClick={onClose}
            className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
            style={{ position: 'relative', ...lgStyle, width: 43, height: 43 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Título centralizado */}
          <p className="text-base font-semibold absolute left-0 right-0 text-center pointer-events-none"
            style={{ color: 'white', top: 'calc(1.5rem + 10px)' }}>
            {title}
          </p>

          {/* Compartilhar (quando disponível) */}
          {hasAction ? (
            <button onClick={onAction}
              className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
              style={{ position: 'relative', ...lgStyle, width: 43, height: 43 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
          ) : (
            <div style={{ width: 43 }}/>
          )}
        </div>

        {/* Fade mask — abaixo do header, mascara o conteúdo ao rolar */}
        <div className="sheet-content-fade"/>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 z-10 w-full"
          style={{ paddingTop: '90px', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function DescobrirPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [allUserFilms, setAllUserFilms] = useState<UserFilm[]>([])
  const [myUserFilms, setMyUserFilms] = useState<UserFilm[]>([])
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [personPhotos, setPersonPhotos] = useState<Record<string, string | null>>({})
  const [similar, setSimilar] = useState<{ title: string; poster: string | null; tmdbId: number }[]>([])
  const [selectedCat, setSelectedCat] = useState('Best Picture')
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const catBtnRef = useRef<HTMLButtonElement>(null)
  const [catBtnAnchor, setCatBtnAnchor] = useState<{top: number, right: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [titleOpacity, setTitleOpacity] = useState(1)

  const [factSheet, setFactSheet] = useState<typeof FACTS[0] | null>(null)
  const [isFactDaily, setIsFactDaily] = useState(false)
  const factShareRef = useRef<HTMLDivElement>(null)
  const [iconDataUrl, setIconDataUrl] = useState<string>('')
  const [showInstallGate, setShowInstallGate] = useState(false)
  const isPWA = useIsPWA()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setTitleOpacity(Math.max(0, 1 - y / 80))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  const [dailyFact] = useState(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
    return FACTS[dayOfYear % FACTS.length]
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: filmsData }, { data: nomsData }, { data: allUF }, , { data: myUF }] = await Promise.all([
        supabase.from('films').select('*'),
        supabase.from('nominations').select('*'),
        supabase.from('user_films').select('film_id, rating'),
        supabase.from('user_category_ratings').select('film_id, category, rating'),
        supabase.from('user_films').select('film_id, rating').eq('user_id', user?.id ?? ''),
      ])
      const loaded = filmsData ?? []
      const noms = nomsData ?? []
      setFilms(loaded)
      setNominations(noms)
      setAllUserFilms(allUF ?? [])
      setMyUserFilms(myUF ?? [])
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data as any)
      setLoading(false)
      const nominees = noms
        .filter((n: Nomination) => n.nominee && PERSON_CATEGORIES.includes(n.category))
        .map((n: Nomination) => n.nominee as string)
      const unique = [...new Set(nominees)] as string[]
      const photoPairs = await Promise.all(unique.map(async name => [name, await fetchPersonPhoto(name)] as const))
      setPersonPhotos(Object.fromEntries(photoPairs))
      const topRated = (myUF ?? []).filter((u: UserFilm) => (u.rating ?? 0) >= 4)
      if (topRated.length > 0) {
        const topFilm = loaded.find((f: Film) => f.id === topRated[0].film_id)
        if (topFilm) {
          const tmdbData = await fetchAllMovieData([topFilm.title])
          const tmdbId = (tmdbData[topFilm.title] as any)?.id
          if (tmdbId) setSimilar(await fetchSimilarMovies(tmdbId))
        }
      }
    }
    load().catch(e => console.error('[descobrir] load error:', e))
  }, [])

  const filmsByCategory = (cat: string) => {
    const ids = nominations.filter(n => n.category === cat).map(n => n.film_id)
    return films.filter(f => ids.includes(f.id))
  }
  const swingRatings = (cat: string) =>
    filmsByCategory(cat).map(f => {
      const rats = allUserFilms.filter(u => u.film_id === f.id && u.rating)
      if (!rats.length) return { title: f.title, rating: 0 }
      const avg = rats.reduce((s, u) => s + (u.rating ?? 0), 0) / rats.length
      return { title: f.title, rating: Math.round(avg * 10) / 10 }
    }).filter(f => f.rating > 0).sort((a, b) => b.rating - a.rating)

  const nomineesByCategory = (cat: string) =>
    nominations.filter(n => n.category === cat)
      .map(n => ({ film: films.find(f => f.id === n.film_id), nominee: n.nominee }))
      .filter(n => n.film) as { film: Film; nominee: string | null }[]

  const unwatched = films.filter(f => !myUserFilms.find(u => u.film_id === f.id))
  const isPersonCat = (cat: string) => PERSON_CATEGORIES.includes(cat)

  const glass = {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
  }

  async function shareFact() {
    if (!isPWA) { setShowInstallGate(true); return }
    if (!factShareRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(factShareRef.current, {
      backgroundColor: '#0a0a0f', scale: 3, useCORS: false, allowTaint: false, logging: false, onclone: (doc: Document) => { doc.documentElement.style.fontFeatureSettings = 'normal' },
    })
    canvas.toBlob(async blob => {
      if (!blob) return
      const file = new File([blob], 'goes-to-curiosidade.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Goes To... · Oscar 2026' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'goes-to-curiosidade.png'; a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  return (
    <>
      <main className="min-h-screen pb-36 relative overflow-x-hidden" style={{ background: '#0a0a0f', color: 'white' }}>

        {/* Background lights */}
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,69,58,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}/>
        <div className="absolute top-8 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(32px)' }}/>

        {/* Header */}
        <div className="relative px-4 pt-24 pb-6">
          <h1 className="text-3xl font-bold leading-tight"
            style={{ position: 'fixed', left: 16, top: 'max(env(safe-area-inset-top), 52px)', zIndex: 20, pointerEvents: 'none', opacity: titleOpacity, transition: 'opacity 0.2s ease' }}>
            Descobrir
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Termômetro, indicados e curiosidades</p>
        </div>

        <div className="flex flex-col gap-7">

          {/* ── Termômetro ─────────────────────────────────────────── */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Termômetro</SectionTitle>

              {/* Dropdown — liquid glass igual Estante */}
              <div style={{ position: 'relative' }}>
                <button ref={catBtnRef} onClick={() => {
                    const r = catBtnRef.current?.getBoundingClientRect()
                    if (r) setCatBtnAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right })
                    setCatDropdownOpen(!catDropdownOpen)
                  }}
                  className="lg-btn flex items-center gap-2 px-4 rounded-full text-sm font-semibold"
                  style={{ position: 'relative', ...lgStyle, height: 43, color: 'rgba(255,255,255,0.9)',
                    paddingRight: 12 }}>
                  <span>{CATEGORY_LABELS[selectedCat]}</span>
                  {/* HIG pop-up button indicator: chevron up+down empilhados */}
                  <svg width="11" height="16" viewBox="0 0 11 16" fill="none"
                    style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                    <path d="M1 6L5.5 1.5L10 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 10L5.5 14.5L10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {catDropdownOpen && catBtnAnchor && (
                  <>
                    <div className="fixed inset-0" style={{ zIndex: 98 }} onClick={() => setCatDropdownOpen(false)}/>
                    <div className="fixed rounded-2xl dropdown-glass"
                      style={{ zIndex: 99, top: catBtnAnchor.top, right: catBtnAnchor.right, minWidth: 210, width: 'max-content', maxHeight: 320, overflowY: 'auto',
                        backdropFilter: 'blur(48px) saturate(200%)', WebkitBackdropFilter: 'blur(48px) saturate(200%)' }}>
                      {Object.keys(CATEGORY_LABELS).map(cat => (
                        <button key={cat} onClick={() => { setSelectedCat(cat); setCatDropdownOpen(false) }}
                          className="dd-item"
                          style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {/* Placeholder à esquerda — padrão iOS */}
                          <span style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {cat === selectedCat && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12L10 17L19 7" stroke="#FF453A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          <span>{CATEGORY_LABELS[cat]}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-3xl p-5" style={glass}>
              <GaugeChart ratings={swingRatings(selectedCat).map(r => ({ ...r, title: (movieData[r.title] as any)?.ptTitle || r.title }))}/>
            </div>
          </div>

          {/* ── Curiosidade do dia ─────────────────────────────────── */}
          <div className="px-4">
            <button onClick={() => { setFactSheet(dailyFact); setIsFactDaily(true) }} className="lg-btn w-full rounded-3xl p-5 text-left relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${dailyFact.grad[0]}, ${dailyFact.grad[1]})`, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', transform: 'translate(20%,-20%)' }}/>
              <span className="text-4xl mb-3 block">{dailyFact.emoji}</span>
              <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Curiosidade do dia</p>
              <p className="text-lg font-bold leading-tight">{dailyFact.title}</p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Toque para saber mais →</p>
            </button>
          </div>

          {/* ── Todas as categorias ────────────────────────────────── */}
          <div className="px-4">
            <SectionTitle>Categorias</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {ORDERED_CATEGORIES.map(cat => (
                <Link key={cat} href={`/categorias/${categorySlug(cat)}`}
                  className="lg-btn relative rounded-2xl overflow-hidden flex items-center justify-center p-4 text-center"
                  style={{ aspectRatio: '1/1', background: categoryCardBg(cat) }}>
                  <p className="relative z-10 font-bold text-base leading-tight" style={{ color: 'white', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>
                    {CATEGORY_LABELS[cat]}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Você ainda não viu ─────────────────────────────────── */}
          {unwatched.length > 0 && (
            <div>
              <div className="px-4 mb-4">
                <SectionTitle>Você ainda não viu</SectionTitle>
              </div>
              <HScrollRow>
                {unwatched.slice(0, 12).map(film => (
                  <Link key={film.id} href={`/filmes/${film.id}`}
                    className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                    style={{ width: 110, aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="absolute inset-0">
                      {(movieData[film.title] as any)?.poster
                        ? <img src={(movieData[film.title] as any).poster} alt={film.title} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg,#2d1b69,#0a0a0f)' }}>
                            <p className="text-white text-[10px] font-semibold leading-tight">{(movieData[film.title] as any)?.ptTitle || film.title}</p>
                          </div>
                      }
                    </div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)' }}/>
                    <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium leading-tight z-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {film.title}
                    </p>
                  </Link>
                ))}
              </HScrollRow>
            </div>
          )}

          {/* ── Você pode gostar ───────────────────────────────────── */}
          {similar.length > 0 && (
            <div>
              <div className="px-4 mb-1">
                <SectionTitle>Você pode gostar</SectionTitle>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Baseado nos filmes que você mais curtiu</p>
              </div>
              <div className="mt-3">
                <HScrollRow>
                  {similar.map(film => (
                    <Link key={film.title}
                      href={`/filme-externo?id=${film.tmdbId}&title=${encodeURIComponent(film.title)}`}
                      className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                      style={{ width: 110, aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="absolute inset-0">
                        {film.poster
                          ? <img src={film.poster} alt={film.title} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#1a0533,#0a0a0f)' }}/>
                        }
                      </div>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 60%)' }}/>
                      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium leading-tight z-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {film.title}
                      </p>
                    </Link>
                  ))}
                </HScrollRow>
              </div>
            </div>
          )}

          {/* ── Mais curiosidades ──────────────────────────────────── */}
          <div className="px-4">
            <SectionTitle>Mais curiosidades</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {FACTS.map((fact, i) => (
                <button key={i} onClick={() => { setFactSheet(fact); setIsFactDaily(false) }}
                  className="lg-btn rounded-3xl p-4 text-left relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${fact.grad[0]}, ${fact.grad[1]})`, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', transform: 'translate(20%,-20%)' }}/>
                  <span className="text-2xl block mb-2">{fact.emoji}</span>
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>{fact.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Em breve */}
          <div className="mx-4 mb-4 rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <span className="text-3xl">✍️</span>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Conteúdos e análises</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>Textos, análises e bastidores do Oscar chegando em breve.</p>
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(255,69,58,0.1)', color: 'rgba(255,69,58,0.6)', border: '1px solid rgba(255,69,58,0.15)' }}>
              Em breve
            </span>
          </div>

        </div>
      </main>

      {/* ── Fact Bottom Sheet ──────────────────────────────────────── */}
      <BottomSheet
        open={!!factSheet}
        onClose={() => setFactSheet(null)}
        title={isFactDaily ? 'Curiosidade do dia' : 'Curiosidade'}
        onAction={shareFact}
      >
        {factSheet && (
          <div className="flex flex-col gap-5 px-4 pt-2 pb-2">

            {/* Card que será capturado e compartilhado */}
            {/* Wrapper visual: cantos arredondados só na UI */}
            <div style={{ borderRadius: 24, overflow: 'hidden', width: '100%', aspectRatio: '9/16' }}>
            <div ref={factShareRef}
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(145deg, ${factSheet.grad[0]}, ${factSheet.grad[1]} 60%, #0a0a0f)`,
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                padding: '36px 28px',
                position: 'relative',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>

              {/* Orbes decorativos */}
              <div style={{
                position: 'absolute', top: '-10%', right: '-10%',
                width: '60%', height: '40%', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                filter: 'blur(32px)', pointerEvents: 'none',
              }}/>
              <div style={{
                position: 'absolute', bottom: '15%', left: '-15%',
                width: '50%', height: '30%', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                filter: 'blur(24px)', pointerEvents: 'none',
              }}/>

              {/* Topo: ícone do app */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  flexShrink: 0,
                }}>
                  {iconDataUrl
                    ? <img src={iconDataUrl} alt="Goes To" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }}/>
                  }
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Goes To...</p>
              </div>

              {/* Conteúdo central */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 24 }}>
                <span style={{ fontSize: isFactDaily ? 72 : 56, display: 'block', marginBottom: 20, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>
                  {factSheet.emoji}
                </span>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: 10,
                }}>
                  {isFactDaily ? 'Curiosidade do dia' : 'Você sabia?'}
                </p>
                <p style={{
                  fontSize: isFactDaily ? 26 : 22,
                  fontWeight: 800, color: 'white',
                  lineHeight: 1.25, marginBottom: 20,
                }}>
                  {factSheet.title}
                </p>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 20 }}/>
                <p style={{
                  fontSize: 15, color: 'rgba(255,255,255,0.78)',
                  lineHeight: 1.65, fontWeight: 400,
                }}>
                  {factSheet.text}
                </p>
              </div>

              {/* Rodapé */}
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: '0.05em' }}>
                goes-to.vercel.app
              </p>
            </div>
            </div>{/* end visual wrapper */}

            {/* Botão compartilhar */}
            <button onClick={shareFact}
              className="lg-btn w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Compartilhar nos Stories
            </button>
          </div>
        )}
      </BottomSheet>

      {/* ── Install Gate */}
      {showInstallGate && <InstallGate onClose={() => setShowInstallGate(false)} />}

    </>
  )
}