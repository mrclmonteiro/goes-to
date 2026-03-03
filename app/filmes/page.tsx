'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchPersonPhoto } from '@/lib/tmdb'
import Link from 'next/link'


const OSCAR_DATE = new Date('2026-03-15T23:00:00Z')

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

const FILM_CATEGORIES = ['Best Picture','Best Animated Feature','Best International Feature','Best Adapted Screenplay','Best Original Screenplay','Best Cinematography','Best Film Editing','Best Original Score','Best Original Song','Best Costume Design','Best Production Design','Best Makeup and Hairstyling','Best Sound','Best Visual Effects','Best Casting','Best Documentary Feature']
const PERSON_CATEGORIES = ['Best Director', 'Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress']
const ALL_CATEGORIES = [...FILM_CATEGORIES, ...PERSON_CATEGORIES]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Nomination = { film_id: string; category: string; nominee: string | null }
type MovieData = { poster: string | null; backdrop: string | null; overview: string | null }

function useCountdown() {
  const [diff, setDiff] = useState(OSCAR_DATE.getTime() - Date.now())
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
      style={{ aspectRatio: '2/3' }}>
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

function PersonCard({ name, film, photo }: { name: string; film: Film; photo: string | null }) {
  return (
    <Link href={`/filmes/${film.id}`} className="flex flex-col items-start gap-2">
      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
        style={{ border: '2px solid rgba(255,255,255,0.12)' }}>
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
              {name.charAt(0)}
            </div>
        }
      </div>
      <div>
        <p className="text-xs font-semibold leading-tight" style={{ color: 'white' }}>{name}</p>
        <p className="text-xs mt-0.5 leading-tight line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{film.title}</p>
      </div>
    </Link>
  )
}

export default function FilmesPage() {
  const countdown = useCountdown()
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [allUserFilms, setAllUserFilms] = useState<{film_id: string; rating: number | null}[]>([])
  const [catRatings, setCatRatings] = useState<{film_id: string; category: string; rating: number}[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [personPhotos, setPersonPhotos] = useState<Record<string, string | null>>({})
  const [heroCategory, setHeroCategory] = useState('Best Picture')
  const [listCategory, setListCategory] = useState('Best Picture')
  const [heroDropdownOpen, setHeroDropdownOpen] = useState(false)
  const [listDropdownOpen, setListDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

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
      setCatRatings(catRatingsData ?? [])
      setLoading(false)
      // Busca pôsteres e backdrops
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data)
      // Busca fotos de pessoas
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

  const heroFilms = filmsByCategory(heroCategory)
  const heroTop = swingRatings(heroCategory)[0]
  const heroBackdrop = heroTop
    ? movieData[heroTop.title]?.backdrop
    : heroFilms[0] ? movieData[heroFilms[0].title]?.backdrop : null

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

  const glass = {
    background: 'rgba(120,120,128,0.18)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.25)',
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
    </main>
  )

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* HERO */}
      <div className="relative w-full" style={{ height: '88vh', minHeight: 520 }}>
        <div className="absolute inset-0">
          {heroBackdrop
            ? <img src={heroBackdrop} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a0533, #0a0a0f)'}}/>
          }
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 40%, rgba(10,10,15,0.85) 75%, #0a0a0f 100%)'
          }}/>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 text-center">
          <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Segundo nossos usuários
          </p>
          <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>o Oscar de</p>
          <div className="relative inline-block mb-3">
            <button onClick={() => setHeroDropdownOpen(!heroDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mx-auto"
              style={{ ...glass, color: 'white' }}>
              {CATEGORY_LABELS[heroCategory] ?? heroCategory}
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>▾</span>
            </button>
            {heroDropdownOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 rounded-2xl py-2 z-50 w-56"
                style={{ ...glass, background: 'rgba(20,20,30,0.92)' }}>
                {FILM_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { setHeroCategory(cat); setHeroDropdownOpen(false) }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5"
                    style={{ color: cat === heroCategory ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-2xl font-light mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Goes To…</p>
          <p className="text-4xl font-bold leading-tight">{heroTop?.title ?? heroFilms[0]?.title ?? '—'}</p>
        </div>
      </div>

      {/* SWINGOMETER */}
      <div className="mx-4 mt-4 rounded-3xl p-6" style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <GaugeChart ratings={swingRatings(heroCategory)}/>
      </div>

      <div className="mx-4 my-6" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>

      {/* LISTA */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Indicados a</p>
          <div className="relative">
            <button onClick={() => setListDropdownOpen(!listDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ ...glass, color: 'white' }}>
              {CATEGORY_LABELS[listCategory] ?? listCategory}
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>▾</span>
            </button>
            {listDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 rounded-2xl py-2 z-50 w-60"
                style={{ ...glass, background: 'rgba(20,20,30,0.92)' }}>
                {ALL_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { setListCategory(cat); setListDropdownOpen(false) }}
                    className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5"
                    style={{ color: cat === listCategory ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid filmes ou pessoas */}
        {isPersonCategory ? (
  <div className="grid grid-cols-3 gap-3">
    {nomineesByCategory(listCategory).map(({ name, film }) => (
      <Link key={name} href={`/filmes/${film.id}`}
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{ aspectRatio: '2/3' }}>
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

      {/* COUNTDOWN */}
      <div className="mx-4 rounded-3xl p-5 flex items-center gap-4" style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="rounded-2xl overflow-hidden flex-shrink-0 w-14 h-14 flex flex-col"
          style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="flex items-center justify-center text-[10px] font-bold tracking-widest uppercase py-0.5"
            style={{ background: '#e53e3e', color: 'white' }}>MAR</div>
          <div className="flex-1 flex items-center justify-center font-bold text-2xl"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>15</div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Oscar 2026 começa em</p>
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
        <a href="data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:20260315T230000Z%0ADTEND:20260316T030000Z%0ASUMMARY:Oscar%202026%0ADESCRIPTION:Cerim%C3%B4nia%20do%20Oscar%202026%0AEND:VEVENT%0AEND:VCALENDAR"
          download="oscar2026.ics"
          className="rounded-2xl px-3 py-2 text-xs font-semibold flex-shrink-0"
          style={{ ...glass, color: 'rgba(255,255,255,0.8)' }}>
          + Agenda
        </a>
      </div>

    </main>
  )
}
