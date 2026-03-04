'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchPersonPhoto } from '@/lib/tmdb'
import Link from 'next/link'

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

const HERO_CATEGORIES = [
  'Best Picture',
  'Best International Feature',
  'Best Animated Feature',
  'Best Documentary Feature',
]
const FILM_CATEGORIES = ['Best Picture','Best Animated Feature','Best International Feature','Best Adapted Screenplay','Best Original Screenplay','Best Cinematography','Best Film Editing','Best Original Score','Best Original Song','Best Costume Design','Best Production Design','Best Makeup and Hairstyling','Best Sound','Best Visual Effects','Best Casting','Best Documentary Feature']
const PERSON_CATEGORIES = ['Best Director', 'Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress']
const ALL_CATEGORIES = [...FILM_CATEGORIES, ...PERSON_CATEGORIES]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Nomination = { film_id: string; category: string; nominee: string | null }
type MovieData = { poster: string | null; backdrop: string | null; overview: string | null }

// Liquid glass — tudo inline igual ao BottomNav (Tailwind v4 interfere via CSS)
const lgStyle: React.CSSProperties = {
  background: 'rgba(120,120,128,0.18)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.25)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
}
const ddStyle: React.CSSProperties = {
  background: 'rgba(20,20,25,0.65)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
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

function GaugeChart({ ratings }: { ratings: { title: string; rating: number }[] }) {
  if (ratings.length === 0) return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm" style={{ color: 'rgba(128,128,128,0.5)' }}>Ainda sem votos nessa categoria</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(128,128,128,0.3)' }}>Avalie os filmes para ver o favorito</p>
    </div>
  )
  const top = ratings[0]
  const pct = top.rating / 5
  const r = 72, cx = 100, cy = 92
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const needleAngle = 180 + pct * 180
  const needleX = cx + (r - 14) * Math.cos(toRad(needleAngle))
  const needleY = cy + (r - 14) * Math.sin(toRad(needleAngle))
  const segments = 24
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-64">
        {Array.from({ length: segments }, (_, i) => {
          const sa = 180 + (i / segments) * 180
          const ea = 180 + ((i + 1) / segments) * 180
          return (
            <path key={i}
              d={`M ${arcX(sa)} ${arcY(sa)} A ${r} ${r} 0 0 1 ${arcX(ea)} ${arcY(ea)}`}
              stroke={i / segments < pct ? `hsl(${30 + (i / segments) * 40},90%,60%)` : 'rgba(128,128,128,0.15)'}
              strokeWidth="9" strokeLinecap="butt" fill="none"/>
          )
        })}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(.34,1.56,.64,1)' }}/>
        <circle cx={cx} cy={cy} r="4" fill="white"/>
        <text x="28" y="106" fill="rgba(128,128,128,0.4)" fontSize="9" textAnchor="middle">0</text>
        <text x="172" y="106" fill="rgba(128,128,128,0.4)" fontSize="9" textAnchor="middle">5★</text>
        <text x={cx} y={cy - 18} fill="white" fontSize="26" fontWeight="700" textAnchor="middle">{top.rating}</text>
        <text x={cx} y={cy - 4} fill="rgba(255,255,255,0.35)" fontSize="8" textAnchor="middle">estrelas</text>
      </svg>
      <p className="font-semibold text-base mt-1" style={{ color: 'white' }}>{top.title}</p>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>favorito dos usuários</p>
      {ratings.length > 1 && (
        <div className="flex gap-2 mt-4 w-full max-w-xs">
          {ratings.slice(1, 3).map((f, i) => (
            <div key={f.title} className="flex-1 rounded-2xl p-3 text-center" style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>#{i + 2}</p>
              <p className="text-xs font-medium mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.title}</p>
              <p className="text-xs mt-1" style={{ color: '#fbbf24' }}>{'★'.repeat(f.rating)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PosterCard({ film, userFilm, onToggle, poster }: {
  film: Film; userFilm?: UserFilm; onToggle: () => void; poster: string | null
}) {
  return (
    <Link href={`/filmes/${film.id}`}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{ aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="absolute inset-0">
        {poster
          ? <img src={poster} alt={film.title} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-end p-3" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
              <p className="text-white text-xs font-semibold leading-tight">{film.title}</p>
            </div>
        }
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)' }}/>
      <button onClick={e => { e.preventDefault(); onToggle() }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10"
        style={{
          background: userFilm?.watched ? 'rgba(251,191,36,0.95)' : 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
        <span className="text-xs font-bold" style={{ color: userFilm?.watched ? '#000' : 'rgba(255,255,255,0.4)' }}>
          {userFilm?.watched ? '✓' : '○'}
        </span>
      </button>
      {userFilm?.rating && (
        <p className="absolute bottom-2 left-3 text-xs z-10" style={{ color: '#fbbf24' }}>{'★'.repeat(userFilm.rating)}</p>
      )}
    </Link>
  )
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

export default function FilmesPage() {
  const countdown = useCountdown()
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [allUserFilms, setAllUserFilms] = useState<{ film_id: string; rating: number | null }[]>([])
  const [catRatings, setCatRatings] = useState<{ film_id: string; category: string; rating: number }[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [personPhotos, setPersonPhotos] = useState<Record<string, string | null>>({})
  const [listCategory, setListCategory] = useState('Best Picture')
  const [listDropdownOpen, setListDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [heroIdx, setHeroIdx] = useState(0)
  const [heroProgress, setHeroProgress] = useState(0)
  const [textVisible, setTextVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef<number | null>(null)

  const heroCategory = HERO_CATEGORIES[heroIdx]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
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
      setLoading(false)
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data)
      const noms = nominationsData ?? []
      const nominees = noms
        .filter((n: Nomination) => n.nominee && PERSON_CATEGORIES.includes(n.category))
        .map((n: Nomination) => n.nominee as string)
      const unique = [...new Set(nominees)] as string[]
      const photoPairs = await Promise.all(unique.map(async name => [name, await fetchPersonPhoto(name)] as const))
      setPersonPhotos(Object.fromEntries(photoPairs))
    }
    load()
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
        setHeroIdx(i => (i + 1) % HERO_CATEGORIES.length)
      }
    }, 50)
    return () => { clearInterval(tick); clearTimeout(fadeIn) }
  }, [heroIdx])

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
      if (dx < 0) setHeroIdx(i => (i + 1) % HERO_CATEGORIES.length)
      else         setHeroIdx(i => (i - 1 + HERO_CATEGORIES.length) % HERO_CATEGORIES.length)
    }
  }

  const getUF = (id: string) => userFilms.find(u => u.film_id === id)
  const isPersonCategory = PERSON_CATEGORIES.includes(listCategory)

  const filmsByCategory = (cat: string) => {
    const ids = nominations.filter(n => n.category === cat).map(n => n.film_id)
    return films.filter(f => ids.includes(f.id))
  }
  const nomineesByCategory = (cat: string) =>
    nominations
      .filter(n => n.category === cat && n.nominee)
      .map(n => ({ name: n.nominee as string, film: films.find(f => f.id === n.film_id) }))
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

  const heroBackdrops = HERO_CATEGORIES.map(cat => {
    const top = swingRatings(cat)[0]
    const catFilms = filmsByCategory(cat)
    const title = top?.title ?? catFilms[0]?.title
    return title ? (movieData[title]?.backdrop ?? null) : null
  })

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

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
    </main>
  )

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

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

        {/* App icon — top left, mesmo nível do título "Descobrir" */}
        <div className="absolute left-4 z-20 pointer-events-none"
          style={{ top: 'max(env(safe-area-inset-top), 52px)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Goes To" className="w-10 h-10 rounded-xl"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}/>
        </div>
        <div
          className="absolute inset-y-0 left-0 flex"
          style={{
            width: `${HERO_CATEGORIES.length * 100}%`,
            transform: `translateX(calc(-${heroIdx * (100 / HERO_CATEGORIES.length)}% + ${dragX}px))`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(.4,0,.2,1)',
            willChange: 'transform',
          }}
        >
          {heroBackdrops.map((backdrop, i) => (
            <div key={i} style={{ width: `${100 / HERO_CATEGORIES.length}%`, height: '100%', flexShrink: 0, position: 'relative' }}>
              {backdrop
                ? <img src={backdrop} alt="" className="w-full h-full object-cover" draggable={false} style={{ userSelect: 'none' }}/>
                : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a0533, #0a0a0f)'}}/>
              }
            </div>
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.12) 38%, rgba(10,10,15,0.82) 72%, #0a0a0f 100%)'
        }}/>

        <div
          className="absolute bottom-0 left-0 right-0 px-6 pb-12 text-center pointer-events-none"
          style={{ opacity: textOpacity, transition: isDragging ? 'opacity 0.05s linear' : 'opacity 0.3s ease' }}
        >
          <p className="text-sm mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Segundo nossos usuários, o Oscar de</p>
          <p className="text-xl font-bold mb-1" style={{ color: 'rgba(255,255,255,0.88)' }}>{CATEGORY_LABELS[heroCategory] ?? heroCategory}</p>
          <p className="text-2xl font-light mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Goes To…</p>
          <p className="text-4xl font-bold leading-tight">
            {swingRatings(heroCategory)[0]?.title ?? filmsByCategory(heroCategory)[0]?.title ?? '—'}
          </p>
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 pointer-events-auto">
          {HERO_CATEGORIES.map((cat, i) => (
            <button key={cat} onClick={() => setHeroIdx(i)}
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
        <GaugeChart ratings={swingRatings(heroCategory)}/>
      </div>

      <div className="mx-4 my-6" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>

      {/* ── LISTA ─────────────────────────────────────────────────── */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <p className="text-lg font-semibold tracking-tight" style={{ color: 'white' }}>Indicados a</p>

          {/* Dropdown — liquid glass */}
          <div className="relative">
            <button
              onClick={() => setListDropdownOpen(!listDropdownOpen)}
              className="lg-btn flex items-center gap-2 px-4 rounded-full text-sm font-semibold"
              style={{ ...lgStyle, position: 'relative', height: 43, color: 'white' }}
            >
              {CATEGORY_LABELS[listCategory] ?? listCategory}
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>▾</span>
            </button>

            {listDropdownOpen && (
              <>
                <div className="fixed inset-0" style={{ zIndex: 48 }} onClick={() => setListDropdownOpen(false)}/>
                <div
                  className="absolute top-full mt-2 left-0 rounded-xl py-1.5 w-52 overflow-y-auto"
                  style={{ ...ddStyle, zIndex: 49, maxHeight: '40vh' }}
                >
                  {ALL_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => { setListCategory(cat); setListDropdownOpen(false) }}
                      className="w-full px-4 py-1.5 text-sm text-left hover:bg-white/10 transition-colors"
                      style={{ color: cat === listCategory ? '#fbbf24' : 'rgba(255,255,255,0.85)' }}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grid */}
        {isPersonCategory ? (
          <div className="grid grid-cols-3 gap-3">
            {nomineesByCategory(listCategory).map(({ name, film }) => (
              <Link key={name} href={`/filmes/${film.id}`}
                className="relative flex flex-col rounded-2xl overflow-hidden"
                style={{ aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="absolute inset-0">
                  {movieData[film.title]?.poster
                    ? <img src={movieData[film.title].poster!} alt={film.title} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)'}}/>
                  }
                </div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }}/>
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}>
                    {personPhotos[name]
                      ? <img src={personPhotos[name]!} alt={name} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{name.charAt(0)}</div>
                    }
                  </div>
                  <p className="text-xs font-semibold leading-tight"
                    style={{ color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{name}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filmsByCategory(listCategory).map(film => (
              <PosterCard key={film.id} film={film} userFilm={getUF(film.id)}
                onToggle={() => toggleWatched(film.id)}
                poster={movieData[film.title]?.poster ?? null}/>
            ))}
          </div>
        )}
      </div>

      <div className="mx-4 my-6" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>

      {/* ── COUNTDOWN ─────────────────────────────────────────────── */}
      <div className="px-4">
        <p className="text-lg font-semibold mb-3 px-1" style={{ color: 'white' }}>Oscar 2026 começa em</p>
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
              <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>É hoje! 🎬</p>
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