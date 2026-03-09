'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchPersonPhoto } from '@/lib/tmdb'
import Link from 'next/link'
import Spinner from '../components/Spinner'
import { categoryCardBg, categorySlug } from '@/lib/categories'

const OSCAR_DATE = new Date('2026-03-15T23:00:00Z')
const HERO_DURATION = 6000

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

type HeroSlide = { type: 'category'; cat: string } | { type: 'promo'; id: 'bolao' } | { type: 'worst' }
const HERO_SLIDES: HeroSlide[] = [
  { type: 'category', cat: 'Best Picture' },
  { type: 'promo', id: 'bolao' },
  { type: 'category', cat: 'Best Actress' },
  { type: 'category', cat: 'Best International Feature' },
  { type: 'worst' },
  { type: 'category', cat: 'Best Actor' },
]
const HERO_N = HERO_SLIDES.length
const FILM_CATEGORIES = ['Best Picture','Best Animated Feature','Best International Feature','Best Adapted Screenplay','Best Original Screenplay','Best Cinematography','Best Film Editing','Best Original Score','Best Original Song','Best Costume Design','Best Production Design','Best Makeup and Hairstyling','Best Sound','Best Visual Effects','Best Casting','Best Documentary Feature']
const PERSON_CATEGORIES = ['Best Director', 'Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress']
const ALL_CATEGORIES = [...FILM_CATEGORIES, ...PERSON_CATEGORIES]
const FEATURED_CATEGORIES = ['Best Director', 'Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress']

type Film = { id: string; title: string }
type FeedEntry = { user_id: string; film_id: string; category: string; rating: number; created_at: string | null; display_name: string | null; username: string | null; avatar_index: number }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Nomination = { film_id: string; category: string; nominee: string | null }
type MovieData = { ptTitle: string | null; poster: string | null; backdrop: string | null; backdrops: string[]; overview: string | null }

// Liquid glass — tudo inline igual ao BottomNav (Tailwind v4 interfere via CSS)
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

function GaugeChart({ ratings }: { ratings: { title: string; subtitle?: string; rating: number }[] }) {
  const targetPct = ratings.length > 0 ? ratings[0].rating / 5 : 0
  const [animPct, setAnimPct] = useState(targetPct)
  const animRef = useRef<number | null>(null)
  const fromRef = useRef(animPct)

  useEffect(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    const from = fromRef.current
    const to = targetPct
    const duration = 700
    const start = performance.now()
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const v = from + (to - from) * easeInOut(t)
      fromRef.current = v
      setAnimPct(v)
      if (t < 1) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPct])

  const isEmpty = ratings.length === 0
  const top = ratings[0]
  const displayRating = top ? Math.round(animPct * 5 * 10) / 10 : 0
  const r = 72, cx = 100, cy = 92
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const needleAngle = 180 + animPct * 180
  const needleX = cx + (r - 14) * Math.cos(toRad(needleAngle))
  const needleY = cy + (r - 14) * Math.sin(toRad(needleAngle))
  const segments = 24

  if (isEmpty) return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm" style={{ color: 'rgba(128,128,128,0.5)' }}>Ainda sem votos nessa categoria</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(128,128,128,0.3)' }}>Avalie os filmes para ver o favorito</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-64">
        {Array.from({ length: segments }, (_, i) => {
          const sa = 180 + (i / segments) * 180
          const ea = 180 + ((i + 1) / segments) * 180
          const lit = i / segments < animPct
          return (
            <path key={i}
              d={`M ${arcX(sa)} ${arcY(sa)} A ${r} ${r} 0 0 1 ${arcX(ea)} ${arcY(ea)}`}
              stroke={lit ? `hsl(${30 + (i / segments) * 40},90%,60%)` : 'rgba(128,128,128,0.15)'}
              strokeWidth="9" strokeLinecap="butt" fill="none"/>
          )
        })}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="4" fill="white"/>
        <text x="28" y="106" fill="rgba(128,128,128,0.4)" fontSize="9" textAnchor="middle">0</text>
        <text x="172" y="106" fill="rgba(128,128,128,0.4)" fontSize="9" textAnchor="middle">5★</text>
        <text x={cx} y={cy - 18} fill="white" fontSize="26" fontWeight="700" textAnchor="middle">{displayRating}</text>
        <text x={cx} y={cy - 4} fill="rgba(255,255,255,0.35)" fontSize="8" textAnchor="middle">estrelas</text>
      </svg>
      <p className="font-semibold text-base mt-1" style={{ color: 'white' }}>{top.title}</p>
      {top.subtitle && <p className="text-xs font-medium mt-0.5" style={{ color: '#FF453A' }}>{top.subtitle}</p>}
      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>favorito dos usuários</p>
      {ratings.length > 1 && (
        <div className="flex gap-2 mt-4 w-full max-w-xs">
          {ratings.slice(1, 3).map((f, i) => (
            <div key={f.title} className="flex-1 rounded-2xl p-3 text-center" style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>#{i + 2}</p>
              <p className="text-xs font-medium mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.title}</p>
              {f.subtitle && <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.subtitle}</p>}
              <p className="text-xs mt-1" style={{ color: '#FF453A' }}>{'★'.repeat(f.rating)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PosterCard({ film, userFilm, onToggle, poster, ptTitle }: {
  film: Film; userFilm?: UserFilm; onToggle: () => void; poster: string | null; ptTitle?: string | null
}) {
  return (
    <Link href={`/filmes/${film.id}`}
      className="poster-press relative flex flex-col rounded-2xl overflow-hidden"
      style={{ aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.14)' }}>
      <div className="absolute inset-0">
        {poster
          ? <img src={poster} alt={film.title} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-end p-3" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
              <p className="text-white text-xs font-semibold leading-tight">{ptTitle || film.title}</p>
            </div>
        }
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)' }}/>
      <button onClick={e => { e.preventDefault(); onToggle() }}
        className="lg-btn absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10"
        style={{
          background: userFilm?.watched ? 'rgba(255,69,58,0.95)' : 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid transparent',
        }}>
        <span className="text-xs font-bold" style={{ color: userFilm?.watched ? '#000' : 'rgba(255,255,255,0.4)' }}>
          {userFilm?.watched ? '✓' : '○'}
        </span>
      </button>
      {userFilm?.rating && (
        <p className="absolute bottom-2 left-3 text-xs z-10" style={{ color: '#FF453A' }}>{'\u2605'.repeat(userFilm.rating)}</p>
      )}
    </Link>
  )
}

function BolaoPromoSlide() {
  const emojis = ['✍️', '✅', '📲']
  const [emojiIdx, setEmojiIdx] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  useEffect(() => {
    const t = setInterval(() => {
      setPhase('out')
      const swap = setTimeout(() => {
        setEmojiIdx(i => (i + 1) % emojis.length)
        setPhase('in')
      }, 420)
      return () => clearTimeout(swap)
    }, 1800)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
      <style>{`
        @keyframes bolaoFloat {
          0%   { transform: translateX(-50%) translateY(-50%) scale(1); }
          40%  { transform: translateX(-50%) translateY(calc(-50% - 14px)) scale(1.05); }
          70%  { transform: translateX(-50%) translateY(calc(-50% - 7px)) scale(1.02); }
          100% { transform: translateX(-50%) translateY(-50%) scale(1); }
        }
      `}</style>
      <div style={{
        position: 'absolute',
        top: '42%',
        left: '50%',
        fontSize: 80,
        lineHeight: 1,
        animation: 'bolaoFloat 2.8s ease-in-out infinite',
        opacity: phase === 'in' ? 1 : 0,
        transition: 'opacity 0.38s cubic-bezier(.4,0,.2,1)',
        filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.45))',
        userSelect: 'none',
      }}>
        {emojis[emojiIdx]}
      </div>
    </div>
  )
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`
  return `há ${Math.floor(diff / 604800)} sem`
}

function FeedStars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  return (
    <span className="inline-flex align-middle gap-px mx-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={i < full ? '#FF453A' : (i === full && hasHalf) ? 'rgba(255,69,58,0.45)' : 'none'}
            stroke={i < full || (i === full && hasHalf) ? 'none' : 'rgba(255,255,255,0.18)'}
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </span>
  )
}

function useCountdown() {
  const [diff, setDiff] = useState(() => OSCAR_DATE.getTime() - Date.now())
  useEffect(() => {
    const t = setInterval(() => setDiff(OSCAR_DATE.getTime() - Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (diff <= 0) return null
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2.5"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <circle cx="8" cy="15" r="1" fill="currentColor"/>
      <circle cx="12" cy="15" r="1" fill="currentColor"/>
      <circle cx="16" cy="15" r="1" fill="currentColor"/>
    </svg>
  )
}

function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pl-4 pr-4 py-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {children}
        <div style={{ minWidth: 4, flexShrink: 0 }}/>
      </div>
      <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, #0a0a0f)' }}/>
    </div>
  )
}

function WelcomeModal({ onConfigure }: { onConfigure: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (phase === 'in') {
      timer = setTimeout(() => setPhase('hold'), 600)
    } else if (phase === 'hold') {
      timer = setTimeout(() => setPhase('out'), 1600)
    } else {
      timer = setTimeout(() => {
        setActiveIdx(i => (i + 1) % AVATARS.length)
        setPhase('in')
      }, 400)
    }
    return () => clearTimeout(timer)
  }, [phase, activeIdx])

  const colors = AVATAR_COLORS[activeIdx] ?? AVATAR_COLORS[0]
  const emoji = AVATARS[activeIdx]
  const emojiScale = phase === 'in' ? 1 : phase === 'hold' ? 1.08 : 0.7
  const emojiOpacity = phase === 'in' ? 1 : phase === 'hold' ? 1 : 0
  const emojiY = phase === 'in' ? 0 : phase === 'hold' ? -6 : 10

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}/>
      <div className="relative w-full rounded-t-[32px] flex flex-col sheet"
        style={{ maxHeight: '92vh' }}>

        {/* Pílula drag */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>

        <div className="flex flex-col items-center px-6 pt-4 pb-10 gap-5"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 40px)' }}>

          {/* Avatar animado */}
          <div style={{ position: 'relative', width: 88, height: 88 }}>
            <div style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              background: `radial-gradient(circle, ${colors[0]}55 0%, transparent 70%)`,
              filter: 'blur(14px)', transition: 'background 0.4s ease',
            }}/>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
              transition: 'background 0.4s ease',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }}/>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42,
              transform: `translateY(${emojiY}px) scale(${emojiScale})`,
              opacity: emojiOpacity,
              transition: phase === 'in'
                ? 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease'
                : 'transform 0.35s ease, opacity 0.35s ease',
            }}>
              {emoji}
            </div>
          </div>

          {/* Título */}
          <h2 className="text-[22px] font-bold text-center" style={{ color: 'white', margin: 0 }}>
            Seja bem-vindo ao Goes To...
          </h2>

          {/* Corpo */}
          <p className="text-[15px] text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Agora que seu cadastro está confirmado, que tal personalizar o seu perfil?
            {' '}Você pode colocar seu nome e escolher entre diversos avatares com referências ao cinema.
            {' '}Isso permite que você compartilhe suas avaliações e que elas apareçam no feed de Novidades.
          </p>

          {/* Card de privacidade */}
          <div className="w-full flex gap-3 items-start rounded-2xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔒</span>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Seu email nunca aparece para outros usuários. Só o nome e o avatar que você escolher são visíveis no feed.
            </p>
          </div>

          {/* CTA */}
          <Link href="/estante" onClick={() => { try { localStorage.setItem('estante_tour', '1') } catch(_){} onConfigure() }} className="primary-btn">
            Configure seu perfil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FilmesPage() {
  const countdown = useCountdown()
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [allUserFilms, setAllUserFilms] = useState<{ film_id: string; rating: number | null }[]>([])
  const [catRatings, setCatRatings] = useState<{ film_id: string; category: string; rating: number }[]>([])
  const [feedItems, setFeedItems] = useState<FeedEntry[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarIdx, setAvatarIdx] = useState(0)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [personPhotos, setPersonPhotos] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)

  const [heroIdx, setHeroIdx] = useState(0)
  const [heroProgress, setHeroProgress] = useState(0)
  const [textVisible, setTextVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef<number | null>(null)
  const [titleOpacity, setTitleOpacity] = useState(1)

  const heroSlide = HERO_SLIDES[heroIdx]
  // for gauge: use nearest preceding category slide (or first category)
  const gaugeCategory = heroSlide.type === 'category'
    ? heroSlide.cat
    : ([...HERO_SLIDES].slice(0, heroIdx).reverse().find(s => s.type === 'category') as { type: 'category'; cat: string } | undefined)?.cat
      ?? (HERO_SLIDES.find(s => s.type === 'category') as { type: 'category'; cat: string }).cat
  const heroCategory = gaugeCategory

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: prof } = await supabase.from('user_profiles').select('avatar_index, username').eq('id', user.id).maybeSingle()
        if (prof?.avatar_index != null) setAvatarIdx(prof.avatar_index)
        if (!prof) {
          const emailPrefix = (user.email ?? '').split('@')[0] || user.id.slice(0, 8)
          await supabase.from('user_profiles').insert({
            id: user.id,
            username: emailPrefix,
            display_name: emailPrefix,
            avatar_index: 0,
          }).select().maybeSingle()
          setShowWelcomeModal(true)
        }
      }
      const { data: filmsData } = await supabase.from('films').select('*')
      const { data: nominationsData } = await supabase.from('nominations').select('*')
      const { data: userFilmsData } = await supabase.from('user_films').select('*').eq('user_id', user?.id ?? '')
      const { data: allFilmsData } = await supabase.from('user_films').select('film_id, rating')
      const { data: catRatingsData } = await supabase.from('user_category_ratings').select('film_id, category, rating')
      const loaded = filmsData ?? []
      setFilms(loaded)
      setNominations(nominationsData ?? [])
      setUserFilms(userFilmsData ?? [])
      setAllUserFilms(allFilmsData ?? [])
      setCatRatings(catRatingsData ?? [])
      // Feed: últimas avaliações de user_category_ratings (user_id existe para novas inserções)
      // Fallback: user_films para avaliações antigas sem categoria
      let feedRaw: { user_id: string; film_id: string; rating: number | null; category: string; created_at?: string | null }[] = []
      const { data: fwdCat, error: fwdCatErr } = await supabase
        .from('user_category_ratings')
        .select('user_id, film_id, rating, category, created_at')
        .not('user_id', 'is', null)
        .gt('rating', 0)
        .order('created_at', { ascending: false })
        .limit(50)
      if (!fwdCatErr && fwdCat && fwdCat.length > 0) {
        feedRaw = fwdCat
      } else {
        // Fallback: user_films sem categoria
        const { data: fnd, error: fndErr } = await supabase
          .from('user_films')
          .select('user_id, film_id, rating, updated_at')
          .not('user_id', 'is', null)
          .not('rating', 'is', null)
          .gt('rating', 0)
          .order('updated_at', { ascending: false })
          .limit(30)
        if (!fndErr && fnd) {
          feedRaw = fnd.map((r: { user_id: string; film_id: string; rating: number | null; updated_at?: string | null }) => ({ ...r, category: '', created_at: r.updated_at ?? null }))
        } else {
          const { data: fnd2 } = await supabase
            .from('user_films')
            .select('user_id, film_id, rating')
            .not('user_id', 'is', null)
            .not('rating', 'is', null)
            .gt('rating', 0)
            .limit(30)
          feedRaw = (fnd2 ?? []).map((r: { user_id: string; film_id: string; rating: number | null }) => ({ ...r, category: '', created_at: null }))
        }
      }
      const feedFilms = feedRaw.filter(r => r.user_id && (r.rating ?? 0) > 0)
      if (feedFilms.length > 0) {
        const uids = [...new Set(feedFilms.map(r => r.user_id))]
        const { data: profData } = await supabase.from('user_profiles').select('id, display_name, username, avatar_index').in('id', uids)
        const profMap = Object.fromEntries((profData ?? []).map((p: { id: string; display_name: string | null; username: string | null; avatar_index: number }) => [p.id, p]))
        setFeedItems(feedFilms.map(r => ({
          user_id: r.user_id,
          film_id: r.film_id,
          category: r.category ?? '',
          rating: r.rating ?? 0,
          created_at: r.created_at ?? null,
          display_name: profMap[r.user_id]?.display_name ?? null,
          username: profMap[r.user_id]?.username ?? null,
          avatar_index: profMap[r.user_id]?.avatar_index ?? 0,
        })))
      }
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data)
      setLoading(false)
      const noms = nominationsData ?? []
      const nominees = noms
        .filter((n: Nomination) => n.nominee && PERSON_CATEGORIES.includes(n.category))
        .flatMap((n: Nomination) => (n.nominee as string).split(/,| e /).map(s => s.trim()).filter(Boolean))
      const unique = [...new Set(nominees)] as string[]
      const photoPairs = await Promise.all(unique.map(async name => [name, await fetchPersonPhoto(name)] as const))
      setPersonPhotos(Object.fromEntries(photoPairs))
    }
    load().catch(e => console.error('[filmes] load error:', e))
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => setHeroProgress(0))
    requestAnimationFrame(() => setTextVisible(false))
    const fadeIn = setTimeout(() => setTextVisible(true), 180)
    const start = Date.now()
    const tick = setInterval(() => {
      if (isDraggingRef.current) return
      const pct = Math.min(((Date.now() - start) / HERO_DURATION) * 100, 100)
      setHeroProgress(pct)
      if (pct >= 100) {
        clearInterval(tick)
        setHeroIdx(i => (i + 1) % HERO_N)
      }
    }, 50)
    return () => { clearInterval(tick); clearTimeout(fadeIn) }
  }, [heroIdx])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setTitleOpacity(Math.max(0, 1 - y / 80))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onHeroDragStart = (x: number) => { isDraggingRef.current = true; setIsDragging(true); dragStartXRef.current = x }
  const onHeroDragMove = (x: number) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) return
    setDragX(x - dragStartXRef.current)
  }
  const onHeroDragEnd = () => {
    if (!isDraggingRef.current) return
    const dx = dragX
    isDraggingRef.current = false; setIsDragging(false); dragStartXRef.current = null; setDragX(0)
    if (Math.abs(dx) > 60) {
      if (dx < 0) setHeroIdx(i => (i + 1) % HERO_N)
      else         setHeroIdx(i => (i - 1 + HERO_N) % HERO_N)
    }
  }

  const getUF = (id: string) => userFilms.find(u => u.film_id === id)
  const isHeroPersonCategory = PERSON_CATEGORIES.includes(heroCategory)

  const topPersonForHeroCategory = (cat: string) => {
    const topRated = swingRatings(cat)[0]
    const title = topRated?.title ?? filmsByCategory(cat)[0]?.title
    if (!title) return null
    const film = films.find(f => f.title === title)
    if (!film) return null
    const nom = nominations.find(n => n.category === cat && n.film_id === film.id && n.nominee)
    if (!nom?.nominee) return null
    const name = (nom.nominee as string).split(/,| e /)[0].trim()
    return { name, photo: personPhotos[name] ?? null }
  }

  const filmsByCategory = (cat: string) => {
    const ids = nominations.filter(n => n.category === cat).map(n => n.film_id)
    return films.filter(f => ids.includes(f.id))
  }
  const nomineesByCategory = (cat: string) =>
    nominations
      .filter(n => n.category === cat && n.nominee)
      .flatMap(n =>
        (n.nominee as string).split(/,| e /).map(s => s.trim()).filter(Boolean)
          .map(name => ({ name, film: films.find(f => f.id === n.film_id) }))
      )
      .filter(n => n.film) as { name: string; film: Film }[]

  const swingRatings = (cat: string) =>
    filmsByCategory(cat)
      .map(f => {
        const rats = allUserFilms.filter(u => u.film_id === f.id && u.rating)
        if (rats.length === 0) return { title: f.title, rating: 0 }
        const avg = rats.reduce((s, u) => s + (u.rating ?? 0), 0) / rats.length
        return { title: f.title, rating: Math.round(avg * 10) / 10 }
      })
      .filter(f => f.rating > 0)
      .sort((a, b) => b.rating - a.rating)

  // worst-rated film: film whose single lowest rating given is the smallest across all films
  const worstFilm = (() => {
    const byFilm = films.map(f => {
      const rats = allUserFilms.filter(u => u.film_id === f.id && u.rating != null && u.rating > 0)
      if (rats.length === 0) return null
      const min = Math.min(...rats.map(u => u.rating ?? 5))
      return { title: f.title, min }
    }).filter(Boolean) as { title: string; min: number }[]
    if (!byFilm.length) return null
    return byFilm.sort((a, b) => a.min - b.min)[0]
  })()

  const heroSlideBackdrops = (() => {
    const usedCount: Record<string, number> = {}
    return HERO_SLIDES.map((slide) => {
      if (slide.type === 'promo') return null
      const title = slide.type === 'worst'
        ? worstFilm?.title ?? null
        : (swingRatings(slide.cat)[0]?.title ?? filmsByCategory(slide.cat)[0]?.title ?? null)
      if (!title) return null
      const data = movieData[title]
      if (!data) return null
      const pool = data.backdrops?.length ? data.backdrops : (data.backdrop ? [data.backdrop] : [])
      if (!pool.length) return null
      const idx = usedCount[title] ?? 0
      usedCount[title] = idx + 1
      return pool[idx % pool.length]
    })
  })()

  async function toggleWatched(filmId: string) {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return
    const ex = getUF(filmId)
    if (ex) {
      await supabase.from('user_films').update({ watched: !ex.watched }).eq('user_id', userId).eq('film_id', filmId)
    } else {
      await supabase.from('user_films').insert({ user_id: userId, film_id: filmId, watched: true })
    }
    const { data } = await supabase.from('user_films').select('*').eq('user_id', userId)
    setUserFilms(data ?? [])
  }

  const textOpacity = isDragging
    ? Math.max(0, 1 - Math.abs(dragX) / 120)
    : textVisible ? 1 : 0

  // suppress unused warning
  void catRatings

  const top10Films = (() => {
    const counts: Record<string, number> = {}
    allUserFilms.forEach(u => { counts[u.film_id] = (counts[u.film_id] ?? 0) + 1 })
    return films
      .map(f => ({ film: f, count: counts[f.id] ?? 0 }))
      .filter(f => f.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  })()

  const bestPictureFilms = films.filter(f =>
    nominations.some(n => n.film_id === f.id && n.category === 'Best Picture')
  )

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* ── WELCOME MODAL ────────────────────────────────────────── */}
      {showWelcomeModal && <WelcomeModal onConfigure={() => setShowWelcomeModal(false)} />}

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '72vh', minHeight: 480, cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={e => onHeroDragStart(e.clientX)}
        onMouseMove={e => onHeroDragMove(e.clientX)}
        onMouseUp={onHeroDragEnd}
        onMouseLeave={onHeroDragEnd}
        onTouchStart={e => onHeroDragStart(e.touches[0].clientX)}
        onTouchMove={e => { e.preventDefault(); onHeroDragMove(e.touches[0].clientX) }}
        onTouchEnd={onHeroDragEnd}
      >

        {/* Page title — Início */}
        <div className="fixed left-4 z-20 pointer-events-none"
          style={{ top: 'max(env(safe-area-inset-top), 52px)', opacity: titleOpacity, transition: 'opacity 0.2s ease' }}>
          <h1 className="text-3xl font-bold leading-tight">Início</h1>
        </div>
        <div
          className="absolute inset-y-0 left-0 flex"
          style={{
            width: `${HERO_N * 100}%`,
            transform: `translateX(calc(-${heroIdx * (100 / HERO_N)}% + ${dragX}px))`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(.4,0,.2,1)',
            willChange: 'transform',
          }}
        >
          {HERO_SLIDES.map((slide, i) => {
            const backdrop = heroSlideBackdrops[i]
            if (slide.type === 'promo') {
              const c0 = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length][0]
              const c1 = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length][1]
              return (
                <div key={i} style={{ width: `${100 / HERO_N}%`, height: '100%', flexShrink: 0, position: 'relative',
                  background: `linear-gradient(145deg, ${c0}33 0%, ${c1}22 40%, #0a0a0f 100%)` }}>
                  <BolaoPromoSlide/>
                </div>
              )
            }
            return (
              <div key={i} style={{ width: `${100 / HERO_N}%`, height: '100%', flexShrink: 0, position: 'relative' }}>
                {backdrop
                  ? <img src={backdrop} alt="" className="w-full h-full object-cover" draggable={false} style={{ userSelect: 'none' }}/>
                  : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a0533, #0a0a0f)'}}/>
                }
              </div>
            )
          })}
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: heroSlide.type === 'promo'
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 50%, rgba(10,10,15,0.55) 80%, #0a0a0f 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.12) 38%, rgba(10,10,15,0.82) 72%, #0a0a0f 100%)'
        }}/>

        {/* Texto promo — fora do strip, acima do gradiente */}
        {heroSlide.type === 'promo' && (() => {
          const c0 = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length][0]
          return (
            <div
              className="absolute bottom-0 left-0 right-0 px-8 pb-8 text-center pointer-events-none"
              style={{ opacity: textOpacity, transition: isDragging ? 'opacity 0.05s linear' : 'opacity 0.3s ease', zIndex: 2 }}
            >
              {/* Novidade pill */}
              <div style={{
                background: 'rgba(10,10,15,0.65)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: `1px solid ${c0}66`,
                borderRadius: 999,
                padding: '3px 12px',
                marginBottom: 8,
                display: 'inline-block',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: c0, textTransform: 'uppercase', margin: 0 }}>Novidade</p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>Faça o seu bolão</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 6 }}>
                Escolha seus palpites e compartilhe com os amigos
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>
                Visite seu perfil e faça o seu
              </p>
            </div>
          )
        })()}

        {/* Texto categorias */}
        <div
          className="absolute bottom-0 left-0 right-0 px-6 pb-8 text-center pointer-events-none"
          style={{ opacity: (heroSlide.type === 'promo') ? 0 : textOpacity, transition: isDragging ? 'opacity 0.05s linear' : 'opacity 0.3s ease' }}
        >
          {heroSlide.type === 'worst' ? (
            <>
              <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 6, maxWidth: 280, margin: '0 auto 6px' }}>
                Segundo nossos usuários, o{' '}
                <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '1.05em' }}>pior entre os melhores</span>
                {' '}<span style={{ color: '#c9a84c', fontWeight: 600 }}>filmes é</span>
              </p>
              <p className="text-3xl font-bold leading-tight">
                {worstFilm ? (movieData[worstFilm.title]?.ptTitle || worstFilm.title) : '—'}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 6, maxWidth: 280, margin: '0 auto 6px' }}>
                Segundo nossos usuários, o Oscar de{' '}
                <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '1.05em' }}>{CATEGORY_LABELS[heroCategory] ?? heroCategory}</span>
                {' '}<span style={{ color: '#c9a84c', fontWeight: 600 }}>Goes To…</span>
              </p>
              {isHeroPersonCategory ? (() => {
                const person = topPersonForHeroCategory(heroCategory)
                const filmTitle = (() => { const t = swingRatings(heroCategory)[0]?.title ?? filmsByCategory(heroCategory)[0]?.title; return t ? (movieData[t]?.ptTitle || t) : null })()
                return (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                      style={{ border: '2px solid rgba(255,255,255,0.45)', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                      {person?.photo
                        ? <img src={person.photo} alt={person.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-base font-bold"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{person?.name.charAt(0) ?? '?'}</div>
                      }
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold leading-tight">{person?.name ?? '—'}</p>
                      {filmTitle && <p className="text-sm font-medium leading-snug mt-0.5" style={{ color: '#FF453A' }}>{filmTitle}</p>}
                    </div>
                  </div>
                )
              })() : (
                <p className="text-3xl font-bold leading-tight">
                  {(() => { const t = swingRatings(heroCategory)[0]?.title ?? filmsByCategory(heroCategory)[0]?.title; return t ? (movieData[t]?.ptTitle || t) : '—' })()}
                </p>
              )}
            </>
          )}
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 pointer-events-auto">
          {HERO_SLIDES.map((slide, i) => (
            <button key={i} onClick={() => setHeroIdx(i)}
              style={{
                height: 5, width: i === heroIdx ? 36 : 5, borderRadius: 3,
                background: 'rgba(255,255,255,0.28)', overflow: 'hidden',
                transition: 'width 0.3s cubic-bezier(.4,0,.2,1)',
                border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
              }}>
              {i === heroIdx && (
                <div style={{ height: '100%', width: `${heroProgress}%`, background: 'white', transition: 'width 0.05s linear' }}/>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── SWINGOMETER ───────────────────────────────────────────── */}
      <div className="mx-4 mt-4 rounded-3xl p-6" style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <GaugeChart ratings={
          heroSlide.type === 'worst' && worstFilm
            ? (() => {
                const rats = allUserFilms.filter(u => u.film_id === films.find(f => f.title === worstFilm.title)?.id && u.rating)
                if (!rats.length) return []
                const avg = Math.round((rats.reduce((s, u) => s + (u.rating ?? 0), 0) / rats.length) * 10) / 10
                return [{ title: movieData[worstFilm.title]?.ptTitle || worstFilm.title, rating: avg }]
              })()
            : PERSON_CATEGORIES.includes(gaugeCategory)
              ? swingRatings(gaugeCategory).map(r => {
                  const film = films.find(f => f.title === r.title)
                  const nom = film ? nominations.find(n => n.category === gaugeCategory && n.film_id === film.id && n.nominee) : null
                  const name = nom?.nominee ? (nom.nominee as string).split(/,| e /)[0].trim() : null
                  const ptTitle = movieData[r.title]?.ptTitle || r.title
                  return { ...r, title: name ?? ptTitle, subtitle: name ? ptTitle : undefined }
                })
              : swingRatings(gaugeCategory).map(r => ({ ...r, title: movieData[r.title]?.ptTitle || r.title }))
        }/>
      </div>


      {/* ── TOP 10 ─────────────────────────────────────────────────── */}
      {top10Films.length > 0 && (
        <div className="mt-6 pb-4">
          <p className="text-lg font-semibold px-4 mb-[5px]" style={{ color: 'white' }}>Top 10 mais assistidos</p>
          <HScrollRow>
            {top10Films.map(({ film }, i) => (
              <Link key={film.id} href={`/filmes/${film.id}`}
                className="poster-press flex-shrink-0 relative rounded-2xl overflow-hidden"
                style={{ width: 110, aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.14)' }}>
                <div className="absolute inset-0">
                  {movieData[film.title]?.poster
                    ? <img src={movieData[film.title].poster!} alt={film.title} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg,#2d1b69,#0a0a0f)' }}>
                        <p className="text-white text-xs font-semibold leading-tight">{movieData[film.title]?.ptTitle || film.title}</p>
                      </div>
                  }
                </div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%, rgba(0,0,0,0.25) 100%)' }}/>
                <p className="absolute top-2 left-2.5 z-10 font-black"
                  style={{
                    fontSize: 30, lineHeight: 1,
                    background: 'linear-gradient(160deg, rgba(255,255,255,1) 0%, rgba(180,200,255,0.75) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {i + 1}
                </p>
              </Link>
            ))}
          </HScrollRow>
        </div>
      )}

      {/* ── CATEGORIAS ───────────────────────────────────────────── */}
      <div className="mt-6">
        <Link href="/descobrir" className="flex items-center gap-1 px-4 mb-[5px]"
          style={{ color: 'white', display: 'flex' }}>
          <p className="text-lg font-semibold" style={{ color: 'white' }}>Categorias</p>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18L15 12L9 6"/>
          </svg>
        </Link>
        <HScrollRow>
          {FEATURED_CATEGORIES.map(cat => (
            <Link key={cat} href={`/categorias/${categorySlug(cat)}`}
              className="lg-btn flex-shrink-0 relative rounded-2xl overflow-hidden flex items-center justify-center p-3 text-center"
              style={{ width: 130, height: 130, background: categoryCardBg(cat) }}>
              <p className="relative z-10 font-bold text-base leading-tight" style={{ color: 'white', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}>
                {CATEGORY_LABELS[cat]}
              </p>
            </Link>
          ))}
          <Link href="/descobrir"
            className="lg-btn flex-shrink-0 flex flex-col items-start justify-end rounded-2xl gap-1 p-3"
            style={{
              width: 130, height: 130,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="rgba(255,255,255,0.6)"/>
              <rect x="13" y="3" width="8" height="8" rx="2" fill="rgba(255,255,255,0.6)"/>
              <rect x="3" y="13" width="8" height="8" rx="2" fill="rgba(255,255,255,0.6)"/>
              <rect x="13" y="13" width="8" height="8" rx="2" fill="rgba(255,255,255,0.6)"/>
            </svg>
            <p className="text-xs font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>Ver todas as categorias</p>
          </Link>
        </HScrollRow>
      </div>

      {/* ── OS GRANDES INDICADOS ────────────────────────────── */}
      {bestPictureFilms.length > 0 && (
        <div className="mt-6 px-4">
          <style>{`
            @keyframes bpScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          `}</style>
          <p className="text-lg font-semibold mb-[5px]" style={{ color: 'white' }}>Os grandes indicados</p>
          <Link href="/categorias/best-picture"
            className="block relative rounded-3xl overflow-hidden transition-transform duration-150 active:scale-[0.97]"
            style={{
              height: 320,
              background: categoryCardBg('Best Picture'),
              border: '1px solid rgba(255,255,255,0.28)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35), 0 8px 32px rgba(0,0,0,0.35)',
            }}>
            {/* Scrolling poster strip — anchored to top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '62%',
              display: 'flex', alignItems: 'center', paddingLeft: 12,
              animation: `bpScroll ${bestPictureFilms.length * 2.5}s linear infinite`,
              willChange: 'transform',
            }}>
              {[...bestPictureFilms, ...bestPictureFilms].map((film, i) => {
                const sizes = [148, 90, 128, 86, 140, 82, 122, 94, 136, 84]
                const offsets = [-12, 26, -22, 20, -16, 32, -8, 24, -20, 28]
                const h = sizes[i % sizes.length]
                const w = Math.round(h * 2 / 3)
                const dy = offsets[i % offsets.length]
                return (
                  <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden"
                    style={{
                      width: w, height: h, marginRight: 12,
                      transform: `translateY(${dy}px)`,
                      border: '1.5px solid rgba(255,255,255,0.22)',
                      boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
                    }}>
                    {movieData[film.title]?.poster
                      ? <img src={movieData[film.title].poster!} alt={film.title} className="w-full h-full object-cover" draggable={false}/>
                      : <div className="w-full h-full" style={{ background: 'rgba(0,0,0,0.3)' }}/>
                    }
                  </div>
                )
              })}
            </div>
            {/* Left edge fade */}
            <div className="absolute inset-y-0 left-0 w-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)', zIndex: 2 }}/>
            {/* Bottom overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 15%, rgba(0,0,0,0.88) 100%)' }}/>
            {/* Text */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <p className="text-xl font-bold leading-tight" style={{ color: 'white', textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}>
                Conheça os {bestPictureFilms.length} concorrentes a Melhor Filme
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
                Filmes que emocionaram, dividiram opiniões e dominaram a conversa. Estes são os concorrentes ao prêmio mais cobiçado da noite.
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* ── NOVIDADES ─────────────────────────────────────────────── */}
      <div className="mt-6 mb-2">
        <p className="text-lg font-semibold mb-1 px-4" style={{ color: 'white' }}>Novidades dos usuários</p>
        {feedItems.length === 0 ? (
          <div className="mx-4 mt-3 rounded-2xl flex flex-col items-center py-10 gap-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 36 }}>🍿</span>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma novidade ainda</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {feedItems.map((item, i) => {
              const film = films.find(f => f.id === item.film_id)
              const poster = film ? (movieData[film.title]?.poster ?? null) : null
              const ptTitle = film ? (movieData[film.title]?.ptTitle ?? film.title) : '?'
              const catLabel = CATEGORY_LABELS[item.category] ?? item.category
              const colors = AVATAR_COLORS[item.avatar_index] ?? AVATAR_COLORS[0]
              const emoji = AVATARS[item.avatar_index] ?? '🎬'
              const href = item.username ? `/perfil/${encodeURIComponent(item.username)}` : `/perfil/${encodeURIComponent(item.user_id)}`
              return (
                <Link key={i} href={href}
                  className="flex gap-3 px-4 py-4 active:bg-white/5 transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  {/* Avatar pequeno */}
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    {/* Linha 1: avatar pequeno + @username + timestamp */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ width: 20, height: 20, background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, border: '1px solid rgba(255,255,255,0.2)', fontSize: 11 }}>
                        {emoji}
                      </div>
                      <span className="text-[12px] font-medium leading-none" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        @{item.username ?? item.user_id.slice(0, 8)}
                      </span>
                      {item.created_at && (
                        <span className="text-[11px] leading-none ml-auto flex-shrink-0" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          {timeAgo(item.created_at)}
                        </span>
                      )}
                    </div>
                    {/* Linha 2: texto da avaliação */}
                    <p className="text-[15px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      <span style={{ color: 'white', fontWeight: 600 }}>{item.display_name ?? item.username ?? 'Usuário'}</span>
                      {' deu '}
                      <FeedStars rating={item.rating} />
                      {' para '}
                      <span style={{ color: 'white', fontWeight: 700 }}>{ptTitle}</span>
                      {item.category && (
                        <>{' em '}<span style={{ color: 'rgba(255,255,255,0.45)' }}>{catLabel}</span></>
                      )}
                    </p>
                  </div>
                  {/* Pôster */}
                  {poster && (
                    <img src={poster} alt={ptTitle}
                      className="rounded-xl flex-shrink-0 object-cover"
                      style={{ width: 44, height: 64 }} />
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── COUNTDOWN ─────────────────────────────────────────────── */}
      <div className="px-4 mt-6 mb-4">
        <p className="text-lg font-semibold mb-[5px]" style={{ color: 'white' }}>Oscar 2026 começa em</p>
        <div className="rounded-3xl p-5 flex items-center gap-4" style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Calendar tile */}
          <div className="rounded-2xl overflow-hidden flex-shrink-0 w-14 h-14 flex flex-col"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center justify-center text-[10px] font-bold tracking-widest uppercase py-0.5"
              style={{ background: '#e53e3e', color: 'white' }}>MAR</div>
            <div className="flex-1 flex items-center justify-center font-bold text-2xl"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>15</div>
          </div>

          {/* Countdown numbers */}
          <div className="flex-1">
            {countdown ? (
              <div className="flex gap-3">
                {[{ v: countdown.d, l: 'dias' }, { v: countdown.h, l: 'horas' }, { v: countdown.m, l: 'min' }, { v: countdown.s, l: 'seg' }].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <p className="text-xl font-bold tabular-nums">{String(v).padStart(2, '0')}</p>
                    <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold" style={{ color: '#FF453A' }}>É hoje! 🎦</p>
            )}
          </div>

          {/* Botão adicionar ao calendário */}
          <a
            href="data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:20260315T230000Z%0ADTEND:20260316T030000Z%0ASUMMARY:Oscar%202026%0ADESCRIPTION:Cerim%C3%B4nia%20do%20Oscar%202026%0AEND:VEVENT%0AEND:VCALENDAR"
            download="oscar2026.ics"
            title="Adicionar ao calendário"
            className="lg-btn w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ ...lgStyle, position: 'relative', color: 'rgba(255,255,255,0.85)' }}
          >
            <CalendarIcon/>
          </a>
        </div>
      </div>

    </main>
  )
}