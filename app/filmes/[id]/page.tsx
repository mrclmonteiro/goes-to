'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { fetchMovieDetails, fetchAllMovieData } from '@/lib/tmdb'
import Link from 'next/link'
import Spinner from '../../components/Spinner'

// ── Helpers ──────────────────────────────────────────────────────────

function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-5 overflow-x-auto pl-4 pr-4 py-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {children}
        <div style={{ minWidth: 4, flexShrink: 0 }}/>
      </div>
      <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, #0a0a0f)' }}/>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-lg font-semibold" style={{ color: 'white' }}>{children}</p>
}

// ── Design tokens inline (Tailwind v4 override pattern) ──────────────
const lgStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid transparent',
  boxShadow: 'var(--lg-shadow)',
}

// ── PWA gate ─────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
      style={{
        backdropFilter: visible ? 'blur(18px) saturate(160%)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(18px) saturate(160%)' : 'blur(0px)',
        background: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        transition: 'backdrop-filter 0.3s ease, background 0.3s ease',
      }}
      onClick={dismiss}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(12,12,18,0.72)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)',
          borderRadius: 28, padding: '28px 24px 24px',
          width: '100%', maxWidth: 360,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
          position: 'relative',
        }}>
        <button onClick={dismiss}
          className="lg-btn rounded-full flex items-center justify-center"
          style={{ position: 'absolute', top: 16, right: 16, width: 43, height: 43, ...lgStyle }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 16 }}>
          <span style={{ fontSize: 52, lineHeight: 1, display: 'block' }}>👮</span>
          <span style={{ fontSize: 26, position: 'absolute', bottom: 0, right: -4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>🔦</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.2 }}>Pego pelo lanterninha!</p>
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

// ── Bottom Sheet (padrão do app) ─────────────────────────────────────
function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
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

        {/* Handle */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 z-30 pointer-events-none">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-6 z-30">
          <button onClick={onClose}
            className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
            style={{ position: 'relative', ...lgStyle, width: 43, height: 43 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <p className="text-base font-semibold absolute left-0 right-0 text-center pointer-events-none"
            style={{ color: 'white', top: 'calc(1.5rem + 10px)' }}>
            {title}
          </p>
          <div style={{ width: 43 }}/>
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

// ── Data ─────────────────────────────────────────────────────────────
const QUALITY: Record<number, string> = {
  0.5: 'Horrível', 1: 'Fraco', 1.5: 'Fraco+', 2: 'Regular',
  2.5: 'Regular+', 3: 'Bom', 3.5: 'Bom+', 4: 'Ótimo',
  4.5: 'Ótimo+', 5: 'Imperdível',
}

const CATEGORY_LABELS: Record<string, string> = {
  'Best Picture': 'Melhor Filme',
  'Best Director': 'Melhor Direção',
  'Best Actor': 'Melhor Ator',
  'Best Actress': 'Melhor Atriz',
  'Best Supporting Actor': 'Melhor Ator Coadj.',
  'Best Supporting Actress': 'Melhor Atriz Coadj.',
  'Best Animated Feature': 'Melhor Animação',
  'Best International Feature': 'Filme Internacional',
  'Best Adapted Screenplay': 'Roteiro Adaptado',
  'Best Original Screenplay': 'Roteiro Original',
  'Best Cinematography': 'Fotografia',
  'Best Film Editing': 'Montagem',
  'Best Original Score': 'Trilha Sonora',
  'Best Original Song': 'Canção Original',
  'Best Costume Design': 'Figurino',
  'Best Production Design': 'Direção de Arte',
  'Best Makeup and Hairstyling': 'Maquiagem',
  'Best Sound': 'Som',
  'Best Visual Effects': 'Efeitos Visuais',
  'Best Casting': 'Elenco',
  'Best Documentary Feature': 'Documentário',
  'Best Documentary Short Film': 'Curta Documentário',
  'Best Animated Short Film': 'Curta Animação',
  'Best Live Action Short Film': 'Curta Ficção',
}

// Abbreviated labels for the share card (max ~14 chars)
const CAT_SHORT: Record<string, string> = {
  'Melhor Filme': 'Melhor Filme',
  'Melhor Direção': 'Direção',
  'Melhor Ator': 'Ator',
  'Melhor Atriz': 'Atriz',
  'Melhor Ator Coadj.': 'Ator Coadj.',
  'Melhor Atriz Coadj.': 'Atriz Coadj.',
  'Melhor Animação': 'Animação',
  'Filme Internacional': 'Internacional',
  'Roteiro Adaptado': 'Rot. Adaptado',
  'Roteiro Original': 'Rot. Original',
  'Fotografia': 'Fotografia',
  'Montagem': 'Montagem',
  'Trilha Sonora': 'Trilha Sonora',
  'Canção Original': 'Canção',
  'Figurino': 'Figurino',
  'Direção de Arte': 'Dir. de Arte',
  'Maquiagem': 'Maquiagem',
  'Som': 'Som',
  'Efeitos Visuais': 'Ef. Visuais',
  'Elenco': 'Elenco',
  'Documentário': 'Documentário',
}

type Nomination = { film_id: string; category: string; nominee: string | null; winner: boolean }
type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Profile = { display_name: string | null; username: string | null; avatar_index: number }

const AVATARS = [
  '🎬','🍿','🎭','🏆','🎞️','⭐','🎪','🎨',
  '🦁','🎈','🤵','🦇','🗼','☕️','🛳','💰',
  '🐶','👵','🐔','👩‍🦱','💀','🛸','🏊‍♀️','🤡',
  '🦈'
]

export default function FilmePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isPWA = useIsPWA()
  const shareRef = useRef<HTMLDivElement>(null)

  const [film, setFilm] = useState<Film | null>(null)
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilm, setUserFilm] = useState<UserFilm | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({ display_name: null, username: null, avatar_index: 0 })
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>({})

  // share
  const [shareOpen, setShareOpen] = useState(false)
  const [showInstallGate, setShowInstallGate] = useState(false)
  const [iconDataUrl, setIconDataUrl] = useState<string>('')
  const [posterDataUrl, setPosterDataUrl] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // synopsis sheet
  const [synopsisOpen, setSynopsisOpen] = useState(false)

  // category winners (for non-winner nominations)
  const [categoryWinners, setCategoryWinners] = useState<Record<string, { id: string; title: string; ptTitle: string | null }>>({}) 

  // Pre-load app icon
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

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profileData } = await supabase.from('user_profiles').select('display_name, username, avatar_index').eq('id', user.id).maybeSingle()
        if (profileData) setProfile(profileData)
      }
      const { data: filmData } = await supabase.from('films').select('*').eq('id', id).single()
      const { data: nomsData } = await supabase.from('nominations').select('*').eq('film_id', id)
      const { data: ufData } = await supabase.from('user_films').select('*').eq('film_id', id).eq('user_id', user?.id ?? '').maybeSingle()
      setFilm(filmData)
      setNominations(nomsData ?? [])
      setUserFilm(ufData ?? null)

      // Buscar vencedor de cada categoria (para filmes não-vencedores)
      const categories = (nomsData ?? []).map((n: Nomination) => n.category)
      if (categories.length > 0) {
        const { data: winnerNoms } = await supabase
          .from('nominations')
          .select('film_id, category')
          .in('category', categories)
          .eq('winner', true)
          .neq('film_id', id)
        if (winnerNoms && winnerNoms.length > 0) {
          const winnerFilmIds = [...new Set(winnerNoms.map((n: any) => n.film_id))]
          const { data: winnerFilms } = await supabase
            .from('films')
            .select('id, title')
            .in('id', winnerFilmIds)
          const filmMap: Record<string, { id: string; title: string }> = {}
          winnerFilms?.forEach((f: any) => { filmMap[f.id] = f })
          const winnerTitles = winnerFilms?.map((f: any) => f.title) ?? []
          const ptData = winnerTitles.length > 0 ? await fetchAllMovieData(winnerTitles) : {}
          const winners: Record<string, { id: string; title: string; ptTitle: string | null }> = {}
          winnerNoms.forEach((n: any) => {
            if (filmMap[n.film_id]) {
              const f = filmMap[n.film_id]
              winners[n.category] = { ...f, ptTitle: (ptData as any)[f.title]?.ptTitle ?? null }
            }
          })
          setCategoryWinners(winners)
        }
      }
      if (ufData?.rating) {
        const cats = nomsData?.map((n: Nomination) => CATEGORY_LABELS[n.category] ?? n.category) ?? []
        const initial: Record<string, number> = {}
        cats.forEach((c: string) => { initial[c] = ufData.rating ?? 0 })
        setRatings(initial)
      }
      if (filmData) {
        const { fetchMovieData } = await import('@/lib/tmdb')
        const basic = await fetchMovieData(filmData.title)
        if (basic?.id) {
          const det = await fetchMovieDetails(basic.id)
          setDetails(det)

          // Busca logo separadamente — usa o mesmo Bearer token da lib
          // Logo selecionado por pickLogo() em tmdb.ts — sempre inglês (nunca pt)
          if (det?.logo) setLogoUrl(det.logo)
          // Pre-load poster as base64 for html2canvas
          if (det?.poster) {
            fetch(det.poster)
              .then(r => r.blob())
              .then(blob => new Promise<string>(resolve => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(blob)
              }))
              .then(setPosterDataUrl)
              .catch(() => {})
          }
        }
      }
      setLoading(false)
    }
    load().catch(e => console.error('[filme] load error:', e))
  }, [id])

  async function toggleWatched() {
    if (!userId || !film) return
    const supabase = createClient()
    if (!supabase) return
    if (userFilm) {
      await supabase.from('user_films').update({ watched: !userFilm.watched }).eq('user_id', userId).eq('film_id', id)
      setUserFilm({ ...userFilm, watched: !userFilm.watched })
    } else {
      await supabase.from('user_films').insert({ user_id: userId, film_id: id, watched: true })
      setUserFilm({ film_id: id, watched: true, rating: null })
    }
  }

  async function saveRating(cat: string, value: number, engCat?: string) {
    if (!userId || !film) return
    const supabase = createClient()
    if (!supabase) return
    const newRatings = { ...ratings, [cat]: value }
    setRatings(newRatings)
    const vals = Object.values(newRatings)
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
    if (userFilm) {
      await supabase.from('user_films').update({ rating: avg, watched: true }).eq('user_id', userId).eq('film_id', id)
      setUserFilm({ ...userFilm, rating: avg, watched: true })
    } else {
      await supabase.from('user_films').insert({ user_id: userId, film_id: id, watched: true, rating: avg })
      setUserFilm({ film_id: id, watched: true, rating: avg })
    }
    if (engCat) {
      await supabase.from('user_category_ratings').delete().eq('user_id', userId).eq('film_id', id).eq('category', engCat)
      if (value > 0) {
        await supabase.from('user_category_ratings').insert({ user_id: userId, film_id: id, category: engCat, rating: value })
      }
    }
  }

  async function shareRatings() {
    if (!isPWA) { setShowInstallGate(true); return }
    if (!shareRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(shareRef.current, {
      backgroundColor: '#0a0a0f', scale: 3, useCORS: false, allowTaint: false, logging: false,
      onclone: (doc: Document) => { doc.documentElement.style.fontFeatureSettings = 'normal' },
    })
    canvas.toBlob(async blob => {
      if (!blob) return
      const fname = `goes-to-${film?.title.toLowerCase().replace(/\s+/g, '-') ?? 'notas'}.png`
      const file = new File([blob], fname, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Goes To... · ${film?.title}` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = fname; a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  const glass: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
  }

  const ratedCategories = Object.entries(ratings).filter(([, v]) => v > 0)
  const hasRatings = ratedCategories.length > 0
  const avgRating = hasRatings
    ? Math.round(ratedCategories.reduce((s, [, v]) => s + v, 0) / ratedCategories.length * 10) / 10
    : 0

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )
  if (!film) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Filme não encontrado</p>
    </main>
  )

  const backdrop = details?.backdrop
  const genres = details?.genres ?? []
  const filmNominations = nominations.map(n => ({ category: n.category, nominee: n.nominee ?? null, winner: n.winner }))

  return (
    <>
      <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

        {/* ── Back button ─────────────────────────────────────── */}
        <button onClick={() => router.back()}
          className="lg-btn fixed z-[100] flex items-center justify-center rounded-full"
          style={{ ...lgStyle, position: 'fixed', top: 'max(env(safe-area-inset-top), 45px)', left: '15px', width: '44px', height: '44px', overflow: 'hidden' }}>
          {/* HIG Toolbar: glare diagonal — mesma luz do BottomNav */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-[2px]" style={{ position: 'relative', zIndex: 3 }}>
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* ── Share button (só aparece quando tem avaliações) ── */}
        {hasRatings && (
          <button onClick={() => setShareOpen(true)}
            className="lg-btn fixed z-[100] flex items-center justify-center rounded-full"
            style={{ ...lgStyle, position: 'fixed', top: 'max(env(safe-area-inset-top), 45px)', right: '15px', width: '44px', height: '44px', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 3 }}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        )}

        {/* ── Hero ────────────────────────────────────────────── */}
        <div className="relative w-full" style={{ height: '62vh', minHeight: 460 }}>
          <div className="absolute inset-0">
            {backdrop
              ? <img src={backdrop} alt={film.title} className="w-full h-full object-cover"/>
              : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a0533, #0a0a0f)'}}/>
            }
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 30%, rgba(10,10,15,0.7) 65%, #0a0a0f 100%)'
            }}/>
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-3 flex flex-col items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={film.title}
                style={{
                  maxWidth: 260,
                  maxHeight: 100,
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  marginBottom: 10,
                  filter: 'brightness(0) invert(1)',
                  WebkitFilter: 'brightness(0) invert(1)',
                }}
              />
            ) : (
              <h1 className="text-3xl font-bold leading-tight mb-2 text-center">{details?.ptTitle || film.title}</h1>
            )}
            {genres.length > 0 && (
              <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>{genres.join(' · ')}</p>
            )}
            {details?.runtime > 0 && (
              <p className="text-xs mt-1 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {Math.floor(details.runtime / 60)}h {details.runtime % 60}min
                {details?.releaseDate ? ` · ${new Date(details.releaseDate).getFullYear()}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="mt-1 flex flex-col gap-8">

          {/* ── Ações ─────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-3 px-4">

            {/* Botão Avaliar / Avaliado — fundo branco sólido, sempre */}
            <button onClick={() => setRatingSheetOpen(true)}
              className="lg-btn rounded-full flex items-center gap-2 px-6"
              style={{
                position: 'relative',
                height: 48,
                fontSize: 15,
                fontWeight: 600,
                background: 'white',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,1)',
                color: '#0a0a0f',
              }}>
              {userFilm?.rating ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0f" style={{ flexShrink: 0 }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>Avaliado</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>Avaliar</span>
                </>
              )}
            </button>

            {/* Botão Assistido — ícone lg-btn */}
            <button onClick={toggleWatched}
              className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                position: 'relative',
                ...lgStyle,
                width: 48,
                height: 48,
                ...(userFilm?.watched ? {
                  background: 'rgba(255,69,58,0.18)',
                  border: '1px solid rgba(255,69,58,0.35)',
                } : {}),
              }}>
              {userFilm?.watched ? (
                /* Olho preenchido — "já vi" */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="rgba(255,69,58,0.9)" stroke="rgba(255,69,58,0.9)" strokeWidth="0.5"/>
                  <circle cx="12" cy="12" r="3" fill="#0a0a0f"/>
                </svg>
              ) : (
                /* Olho com linha — "não vi" */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>

          {/* Tagline */}
          {details?.tagline && (
            <p className="px-4 text-center text-xl font-semibold leading-snug"
              style={{ color: 'rgba(255,255,255,0.9)' }}>
              {details.tagline}
            </p>
          )}

          {/* Concorrendo a */}
          {filmNominations.length > 0 && (
            <div className="px-4">
              <SectionTitle>Concorrendo a</SectionTitle>
              <div className="mt-4 flex flex-col">
                {filmNominations.map((nom, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 py-3.5">
                      <img src="/laurel.svg" width="32" height="32" alt="" style={{ flexShrink: 0, opacity: nom.winner ? 1 : 0.35 }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {CATEGORY_LABELS[nom.category] ?? nom.category}
                        </p>
                        {nom.nominee && nom.nominee.split(/,| e /).map(s => s.trim()).filter(Boolean).map((name, ni) => (
                          <p key={ni} className="text-xs mt-0.5" style={{ color: 'rgba(255,69,58,0.6)' }}>{name}</p>
                        ))}
                        {!nom.winner && categoryWinners[nom.category] && (
                          <Link href={`/filmes/${categoryWinners[nom.category].id}`}
                            className="inline-flex items-center gap-1 mt-1.5"
                            style={{ color: 'rgba(255,200,60,0.75)', fontSize: 11 }}>
                            <span>🏆</span>
                            <span>Venceu: {categoryWinners[nom.category].ptTitle || categoryWinners[nom.category].title}</span>
                          </Link>
                        )}
                      </div>
                      {nom.winner && (
                        <span className="text-sm flex-shrink-0">🏆</span>
                      )}
                      {ratings[CATEGORY_LABELS[nom.category] ?? nom.category] > 0 && (
                        <span className="ml-auto text-xs font-bold flex-shrink-0"
                          style={{ color: '#FF453A' }}>
                          {'★'.repeat(ratings[CATEGORY_LABELS[nom.category] ?? nom.category])}
                        </span>
                      )}
                    </div>
                    {i < filmNominations.length - 1 && (
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sinopse */}
          {details?.overview && (
            <div className="px-4">
              <SectionTitle>Sinopse</SectionTitle>
              <div className="mt-3 rounded-3xl px-5 py-5 relative" style={glass}>
                {/* Container com altura fixa = 2 linhas de texto */}
                <div style={{ position: 'relative', maxHeight: '2.8em', overflow: 'hidden', lineHeight: '1.4em' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', margin: 0 }}>
                    {details.overview}
                  </p>
                  {/* Gradiente horizontal da esquerda p/ direita, cobre só o final da linha */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    height: '1.4em',
                    width: '55%',
                    background: 'linear-gradient(to right, transparent, rgba(22,22,30,0.98) 60%)',
                    pointerEvents: 'none',
                  }}/>
                  <button
                    onClick={() => setSynopsisOpen(true)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: 'rgba(255,255,255,0.72)',
                      cursor: 'pointer',
                      lineHeight: '1.4em',
                    }}>
                    MAIS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ficha técnica */}
          {(details?.director || details?.writers?.length > 0 || details?.budget > 0) && (
            <div className="px-4">
              <SectionTitle>Ficha técnica</SectionTitle>
              <div className="mt-4 flex flex-col gap-5">
                {details?.director && (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
                      style={{ border: '1.5px solid rgba(255,255,255,0.15)' }}>
                      {details.director.photo
                        ? <img src={details.director.photo} alt={details.director.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                            {details.director.name.charAt(0)}
                          </div>
                      }
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Direção</p>
                      <p className="text-sm font-medium">{details.director.name}</p>
                    </div>
                  </div>
                )}
                {details?.writers?.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Roteiro</p>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {details.writers.map((w: any) => w.name).join(', ')}
                      </p>
                    </div>
                  </>
                )}
                {(details?.budget > 0 || details?.productionCompanies?.length > 0) && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                    <div className="grid grid-cols-2 gap-4">
                      {details?.budget > 0 && (
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Orçamento</p>
                          <p className="text-sm font-medium">${(details.budget / 1000000).toFixed(0)}M</p>
                        </div>
                      )}
                      {details?.productionCompanies?.length > 0 && (
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Estúdio</p>
                          <p className="text-sm font-medium leading-tight">{details.productionCompanies[0]}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Elenco */}
          {details?.cast?.length > 0 && (
            <div>
              <p className="px-4 text-lg font-semibold mb-4" style={{ color: 'white' }}>Elenco</p>
              <HScrollRow>
                {details.cast.map((actor: any) => (
                  <div key={actor.name} className="flex flex-col items-center flex-shrink-0 w-20">
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2"
                      style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}>
                      {actor.photo
                        ? <img src={actor.photo} alt={actor.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-lg"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                            {actor.name.charAt(0)}
                          </div>
                      }
                    </div>
                    <p className="text-[11px] font-medium text-center leading-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {actor.name}
                    </p>
                    <p className="text-[10px] text-center leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {actor.character?.split('/')[0]?.trim()}
                    </p>
                  </div>
                ))}
              </HScrollRow>
            </div>
          )}

          {/* Onde assistir */}
          {details?.streaming?.length > 0 && (
            <div className="px-4">
              <SectionTitle>Onde assistir</SectionTitle>
              <div className="mt-4 flex gap-4 flex-wrap">
                {details.streaming.map((s: any) => (
                  <div key={s.name} className="flex flex-col items-center gap-1.5">
                    {s.logo
                      ? <img src={s.logo} alt={s.name} className="w-12 h-12 rounded-2xl object-cover"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}/>
                      : <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                          {s.name.charAt(0)}
                        </div>
                    }
                    <p className="text-[9px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {s.name.split(' ')[0]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Rating Sheet ─────────────────────────────────────────── */}
      <div className="fixed inset-0 flex flex-col justify-end pointer-events-none"
        style={{ zIndex: 999, pointerEvents: ratingSheetOpen ? 'auto' : 'none' }}>
        <div className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            opacity: ratingSheetOpen ? 1 : 0, pointerEvents: ratingSheetOpen ? 'auto' : 'none'
          }}
          onClick={() => setRatingSheetOpen(false)}/>

        <div className="relative w-full rounded-t-[32px] flex flex-col overflow-hidden sheet"
          style={{
            transform: ratingSheetOpen ? 'translateY(0%)' : 'translateY(100%)',
            transition: 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
            maxHeight: '92vh',
          }}>

          {/* Handle */}
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 z-30 pointer-events-none">
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
          </div>

          {/* Header: fechar + título + confirmar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-6 z-30">
            <button onClick={() => setRatingSheetOpen(false)}
              className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
              style={{ position: 'relative', ...lgStyle, width: 43, height: 43 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Título + contagem de progresso — HIG: feedback contínuo */}
            <div className="absolute left-0 right-0 flex flex-col items-center pointer-events-none"
              style={{ top: 'calc(1.5rem + 8px)' }}>
              <p className="text-base font-semibold" style={{ color: 'white' }}>Avaliação</p>
              {ratedCategories.length > 0 && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {ratedCategories.length}/{filmNominations.length}
                </p>
              )}
            </div>
            <button onClick={() => setRatingSheetOpen(false)}
              className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
              style={{ position: 'relative', width: 43, height: 43, background: '#FF453A', border: '1px solid rgba(255,255,255,0.25)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(255,69,58,0.4), inset 1px 1px 0px rgba(255,255,255,0.35), inset -1px -1px 0px rgba(0,0,0,0.15)' }}>
              <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 3 }}>
                <path d="M5 12L10 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="sheet-content-fade"/>
          <div className="overflow-y-auto flex-1 z-10 w-full"
            style={{ paddingTop: '90px', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
            <div className="px-5 flex flex-col gap-1">
              {filmNominations.map((nom, i) => {
                const cat = CATEGORY_LABELS[nom.category] ?? nom.category
                const stars = ratings[cat] ?? 0
                return (
                  <div key={i}>
                    <div className="py-3.5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{cat}</p>
                          {nom.nominee && nom.nominee.split(/,| e /).map(s => s.trim()).filter(Boolean).map((name, ni) => (
                            <p key={ni} className="text-xs mt-0.5" style={{ color: 'rgba(255,69,58,0.6)' }}>{name}</p>
                          ))}
                        </div>
                        {stars > 0 && (
                          <div className="flex items-center gap-1.5">
                            {QUALITY[stars] && (
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{QUALITY[stars]}</span>
                            )}
                            <span className="text-xs font-bold" style={{ color: '#FF453A' }}>{stars}/5</span>
                          </div>
                        )}
                      </div>
                      {/* Estrelas: 44pt touch target (HIG), meia estrela, toggle para limpar */}
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => {
                          const full = stars >= n
                          const half = !full && stars >= n - 0.5 && stars > n - 1
                          return (
                            <button key={n}
                              className="lg-press"
                              style={{ position: 'relative', background: 'none', border: 'none', boxShadow: 'none', padding: 0, width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={e => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const x = e.clientX - rect.left
                                const val = x < rect.width / 2 ? n - 0.5 : n
                                // toggle: toca o mesmo valor → limpa (HIG: reversível)
                                navigator.vibrate?.(6)
                                saveRating(cat, val === stars ? 0 : val, nom.category)
                              }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" style={{ pointerEvents: 'none', display: 'block' }}>
                                <defs>
                                  <clipPath id={`half-${i}-${cat.replace(/\s/g,'-')}-${n}`}>
                                    <rect x="0" y="0" width="12" height="24"/>
                                  </clipPath>
                                </defs>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                                  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinejoin="round"/>
                                {half && (
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                                    fill="#FF453A" stroke="none"
                                    clipPath={`url(#half-${i}-${cat.replace(/\s/g,'-')}-${n})`}/>
                                )}
                                {full && (
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                                    fill="#FF453A" stroke="none"/>
                                )}
                              </svg>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {i < filmNominations.length - 1 && (
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sinopse Sheet ─────────────────────────────────────────── */}
      <BottomSheet open={synopsisOpen} onClose={() => setSynopsisOpen(false)}
        title={details?.ptTitle || film.title}>
        <div className="px-5 py-2">
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {details?.overview}
          </p>
        </div>
      </BottomSheet>

      {/* ── Share Ratings Sheet ───────────────────────────────────── */}
      <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Minhas notas">
        <div className="px-5 py-4 flex flex-col gap-5">


          <div style={{ borderRadius: 24, overflow: 'hidden', width: '100%', aspectRatio: '9/16' }}>
        <div ref={shareRef}
        style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(160deg, #0f0c29 0%, #1a0533 45%, #0a0a0f 100%)',
            borderRadius: 0,
            display: 'flex', flexDirection: 'column',
            padding: '32px 26px 28px',
            position: 'relative',
            fontFamily: 'Inter, system-ui, sans-serif',
            overflow: 'hidden',
        }}>

            <div style={{
              position: 'absolute', top: '-5%', right: '-15%',
              width: '70%', height: '35%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)',
              filter: 'blur(40px)', pointerEvents: 'none',
            }}/>
            <div style={{
              position: 'absolute', bottom: '5%', left: '-20%',
              width: '60%', height: '25%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,69,58,0.12) 0%, transparent 70%)',
              filter: 'blur(32px)', pointerEvents: 'none',
            }}/>

            {/* Topo: app + user */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 6, }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0,
                }}>
                  {iconDataUrl
                    ? <img src={iconDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }}/>
                  }
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Goes To...</p>
              </div>
              {/* Avatar + nome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 99,
                  background: 'rgba(167,139,250,0.2)',
                  border: '1.5px solid rgba(167,139,250,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {AVATARS[profile.avatar_index]}
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                  {profile.display_name ?? 'Cinéfilo'}
                </p>
              </div>
            </div>

            {/* Filme: poster + título + média */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 78, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}>
                {posterDataUrl
                  ? <img src={posterDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.08)' }}/>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', marginBottom: 4,
                }}>
                  Oscar 2026
                </p>
                <p style={{
                  fontSize: 18, fontWeight: 800, color: 'white',
                  lineHeight: 1.6, marginBottom: 6,
                  maxHeight: '2.4em',
                  overflow: 'hidden',
                  paddingBottom: 5,
                }}>
                  {details?.ptTitle || film.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#FF453A' }}>{avgRating}</span>
                  <span style={{ fontSize: 11, color: '#FF453A' }}>★</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>/ 5 · média</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }}/>

            {/* Título da seção */}
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12,
            }}>
              Minhas avaliações por categoria
            </p>

            {/* Grid de categorias — 2 colunas, compacto para suportar até 16 */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 12px',
              alignContent: 'start',
            }}>
              {ratedCategories.map(([cat, stars]) => (
                <div key={cat} style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  padding: '6px 8px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{
                    fontSize: 9, color: 'rgba(255,255,255,0.45)',
                    fontWeight: 600, lineHeight: 1.6, paddingBottom: 5,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {CAT_SHORT[cat] ?? cat}
                  </p>
                  {/* Mini star bar */}
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{
                        flex: 1, height: 3, borderRadius: 99,
                        background: n <= stars ? '#FF453A' : 'rgba(255,255,255,0.1)',
                      }}/>
                    ))}
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#FF453A', marginLeft: 3, flexShrink: 0 }}>
                      {stars}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé */}
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16, letterSpacing: '0.05em' }}>
              goes-to.vercel.app
            </p>
          </div>
          </div>{/* end visual wrapper */}

          <button onClick={shareRatings}
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
      </BottomSheet>

      {/* ── Install Gate ─────────────────────────────────────────── */}
      {showInstallGate && <InstallGate onClose={() => setShowInstallGate(false)} />}
    </>
  )
}
