'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchSimilarMovies, fetchPersonPhoto } from '@/lib/tmdb'
import Link from 'next/link'

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
  { emoji: '🏆', title: 'Recorde histórico', text: 'Com 16 indicações, Sinners bate o recorde anterior de 14, compartilhado por A Malvada (1950), Titanic (1997) e La La Land (2016).', grad: ['#78350f','#92400e'] },
  { emoji: '🌍', title: '4 línguas no páreo', text: 'Recorde: quatro atuações em língua não-inglesa indicadas no mesmo ano — Lilleaas, Moura, Reinsve e Skarsgård.', grad: ['#1e3a5f','#1e40af'] },
  { emoji: '👩', title: '76 mulheres indicadas', text: 'Novo recorde: 76 mulheres indicadas nesta edição. O anterior era de 71, em 2023.', grad: ['#4a1d96','#6d28d9'] },
  { emoji: '🎬', title: 'Spielberg faz história', text: 'Com Hamnet, Steven Spielberg acumula 14 indicações de Melhor Filme como produtor — recorde absoluto desde 1951.', grad: ['#064e3b','#065f46'] },
  { emoji: '🎵', title: 'Diane Warren, 17ª vez', text: 'Diane Warren recebe sua 17ª indicação em Canção Original — 9º ano consecutivo. Ela recebeu o Oscar honorário em 2022.', grad: ['#831843','#9d174d'] },
  { emoji: '🇧🇷', title: 'Brasil na disputa', text: "The Secret Agent é a 6ª indicação do Brasil. O último foi I'm Still Here (2024), que venceu a categoria.", grad: ['#14532d','#166534'] },
  { emoji: '🗳️', title: 'Oscar em números', text: '317 filmes elegíveis, 10.136 votantes e mais de 200 países transmitindo a cerimônia em 15 de março.', grad: ['#1c1917','#44403c'] },
  { emoji: '🗿', title: 'O Oscar', text: '13½ polegadas, 8½ libras. Desde 1929, mais de 3.491 estatuetas entregues. Um cavaleiro com espada sobre um rolo de filme.', grad: ['#312e81','#3730a3'] },
  { emoji: '⏱️', title: 'Maior e menor cerimônia', text: 'A mais longa foi em 2002: 4h23min. A mais curta em 1959: 1h40min. A transmissão pela ABC começou em 1976.', grad: ['#7c2d12','#9a3412'] },
  { emoji: '🆕', title: 'Nova categoria', text: 'Achievement in Casting é a primeira nova categoria desde Melhor Filme de Animação, criada em 2001.', grad: ['#0c4a6e','#075985'] },
]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; rating: number | null }
type Nomination = { film_id: string; category: string; nominee: string | null }
type MovieData = { poster: string | null }

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
                <div className="h-full rounded-full" style={{ width: `${(f.rating/5)*100}%`, background: i===0 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'rgba(255,255,255,0.15)' }}/>
              </div>
              <p className="text-xs w-24 truncate text-right" style={{ color: i===0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>{f.title}</p>
              <p className="text-xs" style={{ color: '#fbbf24', width: 28, textAlign: 'right' }}>{f.rating}★</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Horizontal scroll row with edge gradients
function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pl-4 pr-4"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {children}
        {/* spacer so last card isn't flush */}
        <div style={{ minWidth: 4, flexShrink: 0 }}/>
      </div>
      {/* right fade */}
      <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, #0a0a0f)' }}/>
    </div>
  )
}

export default function DescobrirPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [allUserFilms, setAllUserFilms] = useState<UserFilm[]>([])
  const [catRatings, setCatRatings] = useState<{film_id: string; category: string; rating: number}[]>([])
  const [myUserFilms, setMyUserFilms] = useState<UserFilm[]>([])
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [personPhotos, setPersonPhotos] = useState<Record<string, string | null>>({})
  const [similar, setSimilar] = useState<{ title: string; poster: string | null; tmdbId: number }[]>([])
  const [selectedCat, setSelectedCat] = useState('Best Picture')
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [factSheet, setFactSheet] = useState<typeof FACTS[0] | null>(null)
  const [sheetY, setSheetY] = useState(100)
  const [sheetDragging, setSheetDragging] = useState(false)
  const dragStart = useRef<number | null>(null)
  const dragCurrent = useRef(0)
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
      const [{ data: filmsData }, { data: nomsData }, { data: allUF }, { data: catRatingsData }, { data: myUF }] = await Promise.all([
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
      setCatRatings(catRatingsData ?? [])
      setMyUserFilms(myUF ?? [])
      setLoading(false)

      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data as any)

      // Fotos de pessoas
      const nominees = noms
        .filter((n: Nomination) => n.nominee && PERSON_CATEGORIES.includes(n.category))
        .map((n: Nomination) => n.nominee as string)
      const unique = [...new Set(nominees)] as string[]
      const photoPairs = await Promise.all(unique.map(async name => [name, await fetchPersonPhoto(name)] as const))
      setPersonPhotos(Object.fromEntries(photoPairs))

      // Similares
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
    load()
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

  useEffect(() => {
    if (factSheet) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => setSheetY(0))
    } else {
      setSheetY(100)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [factSheet])

  function closeSheet() {
    setSheetY(100)
    setTimeout(() => setFactSheet(null), 400)
  }

  const glass = {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
    </main>
  )

  return (
    <>
      <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

        {/* Header */}
        <div className="relative px-4 pt-16 pb-6 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}/>
          <div className="absolute top-8 right-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(32px)' }}/>
          <div className="relative">
            <h1 className="text-3xl font-bold leading-tight">Descobrir</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Termômetro, indicados e curiosidades</p>
          </div>
        </div>

        <div className="flex flex-col gap-7">

          {/* Swingometer */}
          <div className="mx-4 rounded-3xl p-5" style={glass}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Termômetro</p>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
                  {CATEGORY_LABELS[selectedCat]} <span style={{ color: 'rgba(255,255,255,0.4)' }}>▾</span>
                </button>
                {catDropdownOpen && (
                  <>
                    <div className="fixed inset-0" style={{ zIndex: 98 }} onClick={() => setCatDropdownOpen(false)}/>
                    <div className="absolute top-full right-0 mt-2 rounded-2xl py-2 w-56"
                      style={{ ...glass, background: 'rgba(14,14,20,0.98)', zIndex: 99, maxHeight: 320, overflowY: 'auto' }}>
                      {Object.keys(CATEGORY_LABELS).map(cat => (
                        <button key={cat} onClick={() => { setSelectedCat(cat); setCatDropdownOpen(false) }}
                          className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5"
                          style={{ color: cat === selectedCat ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
                          {CATEGORY_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <GaugeChart ratings={swingRatings(selectedCat)}/>
          </div>

          {/* Curiosidade do dia */}
          <div className="px-4">
            <button onClick={() => setFactSheet(dailyFact)} className="w-full rounded-3xl p-5 text-left relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${dailyFact.grad[0]}, ${dailyFact.grad[1]})`, border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', transform: 'translate(20%,-20%)' }}/>
              <span className="text-4xl mb-3 block">{dailyFact.emoji}</span>
              <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Curiosidade do dia</p>
              <p className="text-lg font-bold leading-tight">{dailyFact.title}</p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Toque para saber mais →</p>
            </button>
          </div>

          {/* Todos os indicados por categoria */}
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-5 px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Todos os indicados
            </p>
            <div className="flex flex-col gap-4 px-4">
              {Object.keys(CATEGORY_LABELS).map(cat => {
                const noms = nomineesByCategory(cat)
                if (!noms.length) return null
                const isPerson = isPersonCat(cat)
                const sr = swingRatings(cat)
                return (
                  <div key={cat} className="rounded-3xl overflow-hidden" style={glass}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(251,191,36,0.7)' }}>
                        {CATEGORY_LABELS[cat]}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      {noms.map(({ film, nominee }, i) => {
                        const poster = (movieData[film.title] as any)?.poster
                        const personPhoto = nominee ? personPhotos[nominee] : null
                        const filmRating = sr.find(r => r.title === film.title)
                        const showPerson = isPerson && nominee
                        return (
                          <Link key={`${film.id}-${nominee}-${i}`} href={`/filmes/${film.id}`}>
                            <div className="flex items-center gap-3 px-4 py-3"
                              style={{ borderBottom: i < noms.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                              {/* Poster + foto sobreposta */}
                              <div className="relative flex-shrink-0" style={{ width: 36, height: 52 }}>
                                <div className="w-full h-full rounded-lg overflow-hidden"
                                  style={{ background: 'linear-gradient(135deg,#2d1b69,#0a0a0f)' }}>
                                  {poster && <img src={poster} alt={film.title} className="w-full h-full object-cover"/>}
                                </div>
                                {showPerson && (
                                  <div className="absolute rounded-full overflow-hidden"
                                    style={{
                                      width: 24, height: 24,
                                      bottom: -4, right: -8,
                                      border: '2px solid #0e0e14',
                                      background: 'rgba(255,255,255,0.1)',
                                    }}>
                                    {personPhoto
                                      ? <img src={personPhoto} alt={nominee} className="w-full h-full object-cover"/>
                                      : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold"
                                          style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                          {nominee.charAt(0)}
                                        </div>
                                    }
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0" style={{ marginLeft: showPerson ? 10 : 0 }}>
                                <p className="text-sm font-medium leading-tight truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                  {nominee ?? film.title}
                                </p>
                                {nominee && (
                                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{film.title}</p>
                                )}
                              </div>

                              {filmRating && (
                                <p className="text-xs flex-shrink-0" style={{ color: '#fbbf24' }}>{filmRating.rating}★</p>
                              )}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M9 18L15 12L9 6" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Você ainda não viu */}
          {unwatched.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest font-medium mb-4 px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Você ainda não viu
              </p>
              <HScrollRow>
                {unwatched.slice(0, 12).map(film => (
                  <Link key={film.id} href={`/filmes/${film.id}`}
                    className="flex-shrink-0 relative rounded-2xl overflow-hidden" style={{ width: 110, aspectRatio: '2/3' }}>
                    <div className="absolute inset-0">
                      {(movieData[film.title] as any)?.poster
                        ? <img src={(movieData[film.title] as any).poster} alt={film.title} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg,#2d1b69,#0a0a0f)' }}>
                            <p className="text-white text-[10px] font-semibold leading-tight">{film.title}</p>
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

          {/* Recomendados */}
          {similar.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest font-medium mb-1 px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Você pode gostar</p>
              <p className="text-xs mb-4 px-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Baseado nos filmes que você mais curtiu</p>
              <HScrollRow>
                {similar.map(film => (
  <Link key={film.title}
    href={`/filme-externo?id=${film.tmdbId}&title=${encodeURIComponent(film.title)}`}
    className="flex-shrink-0 relative rounded-2xl overflow-hidden"
    style={{ width: 110, aspectRatio: '2/3' }}>
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
          )}

          {/* Mais curiosidades */}
          <div className="px-4">
            <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Mais curiosidades</p>
            <div className="grid grid-cols-2 gap-3">
              {FACTS.map((fact, i) => (
                <button key={i} onClick={() => setFactSheet(fact)}
                  className="rounded-3xl p-4 text-left relative overflow-hidden"
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
              style={{ background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.6)', border: '1px solid rgba(251,191,36,0.15)' }}>
              Em breve
            </span>
          </div>

        </div>
      </main>

      {/* Fact Bottom Sheet animado com drag */}
      {(factSheet || sheetY < 100) && (
        <div className="fixed inset-0 z-[999] flex flex-col justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeSheet}/>
          <div className="relative w-full rounded-t-[32px] flex flex-col"
            style={{
              background: '#0e0e14',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
              maxHeight: '92vh',
              transform: `translateY(${sheetY}%)`,
              transition: sheetDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
            }}
            onTouchStart={e => { dragStart.current = e.touches[0].clientY; setSheetDragging(true) }}
            onTouchMove={e => {
              if (dragStart.current === null) return
              const d = e.touches[0].clientY - dragStart.current
              if (d < 0) return
              dragCurrent.current = d
              setSheetY((d / window.innerHeight) * 100)
            }}
            onTouchEnd={() => {
              setSheetDragging(false)
              if (dragCurrent.current > 120) closeSheet()
              else setSheetY(0)
              dragStart.current = null
              dragCurrent.current = 0
            }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
            </div>
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <div className="w-9"/>
              <p className="text-sm font-semibold" style={{ color: 'white' }}>Curiosidade</p>
              <button onClick={closeSheet}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
            <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
              {factSheet && (
                <>
                  <div className="mx-4 mt-4 mb-5 rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${factSheet.grad[0]}, ${factSheet.grad[1]})` }}>
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', transform: 'translate(20%,-20%)' }}/>
                    <span className="text-5xl block mb-3">{factSheet.emoji}</span>
                    <p className="text-lg font-bold leading-tight">{factSheet.title}</p>
                  </div>
                  <div className="px-5">
                    <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{factSheet.text}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}