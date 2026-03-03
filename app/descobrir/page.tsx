'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchSimilarMovies } from '@/lib/tmdb'
import Link from 'next/link'


const ALL_CATEGORIES = [
  'Best Picture', 'Best Director', 'Best Actor', 'Best Actress',
  'Best Supporting Actor', 'Best Supporting Actress',
  'Best Animated Feature', 'Best International Feature',
]

const FACTS = [
  { emoji: '🏆', title: 'Recorde histórico', text: 'Com 16 indicações, Sinners bate o recorde anterior de 14, compartilhado por A Malvada (1950), Titanic (1997) e La La Land (2016).' },
  { emoji: '🌍', title: '4 línguas no páreo', text: 'Recorde: quatro atuações em língua não-inglesa indicadas no mesmo ano — Lilleaas, Moura, Reinsve e Skarsgård.' },
  { emoji: '👩', title: '76 mulheres indicadas', text: 'Novo recorde: 76 mulheres indicadas nesta edição. O anterior era de 71, em 2023.' },
  { emoji: '🎬', title: 'Spielberg faz história', text: 'Com Hamnet, Steven Spielberg acumula 14 indicações de Melhor Filme como produtor — recorde absoluto desde 1951.' },
  { emoji: '🎵', title: 'Diane Warren, 17ª vez', text: 'Diane Warren recebe sua 17ª indicação em Canção Original — 9º ano consecutivo. Ela recebeu o Oscar honorário em 2022.' },
  { emoji: '🇧🇷', title: 'Brasil na disputa', text: 'The Secret Agent é a 6ª indicação do Brasil. O último foi I\'m Still Here (2024), que venceu a categoria.' },
  { emoji: '🗳️', title: 'Oscar em números', text: '317 filmes elegíveis, 10.136 votantes e mais de 200 países transmitindo a cerimônia em 15 de março.' },
  { emoji: '🗿', title: 'O Oscar', text: '13½ polegadas de altura, 8½ libras. Desde 1929, mais de 3.491 estatuetas entregues. O design: um cavaleiro com espada sobre um rolo de filme.' },
  { emoji: '⏱️', title: 'Maior e menor cerimônia', text: 'A mais longa foi em 2002: 4h23min. A mais curta em 1959: 1h40min. A transmissão pela ABC começou em 1976.' },
  { emoji: '👶', title: 'Nova categoria', text: 'Achievement in Casting é a primeira nova categoria desde Melhor Filme de Animação, criada em 2001.' },
]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Nomination = { film_id: string; category: string }
type MovieData = { poster: string | null; backdrop: string | null }

function GaugeChart({ ratings }: { ratings: { title: string; rating: number }[] }) {
  if (ratings.length === 0) return (
    <div className="flex flex-col items-center py-6">
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Sem votos ainda nessa categoria</p>
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
          return (
            <path key={i}
              d={`M ${arcX(sa)} ${arcY(sa)} A ${r} ${r} 0 0 1 ${arcX(ea)} ${arcY(ea)}`}
              stroke={i / segments < pct ? `hsl(${30 + (i / segments) * 40},90%,60%)` : 'rgba(128,128,128,0.15)'}
              strokeWidth="8" strokeLinecap="butt" fill="none"/>
          )
        })}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="white" strokeWidth="2" strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(.34,1.56,.64,1)' }}/>
        <circle cx={cx} cy={cy} r="3.5" fill="white"/>
        <text x={cx} y={cy - 16} fill="white" fontSize="22" fontWeight="700" textAnchor="middle">{top.rating}</text>
        <text x={cx} y={cy - 3} fill="rgba(255,255,255,0.35)" fontSize="7" textAnchor="middle">estrelas</text>
      </svg>
      <p className="font-semibold text-sm mt-1 text-center" style={{ color: 'white' }}>{top.title}</p>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>favorito dos usuários</p>
    </div>
  )
}

export default function DescobrirPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [similar, setSimilar] = useState<{ title: string; poster: string | null }[]>([])
  const [selectedCat, setSelectedCat] = useState('Best Picture')
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedFact, setExpandedFact] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()
      const { data: filmsData } = await supabase.from('films').select('*')
      const { data: nomsData } = await supabase.from('nominations').select('*')
      const { data: ufData } = await supabase.from('user_films').select('*').eq('user_id', user?.id ?? '')
      const loaded = filmsData ?? []
      setFilms(loaded); setNominations(nomsData ?? []); setUserFilms(ufData ?? [])
      setLoading(false)
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data as any)

      // Filmes similares baseados nos mais bem avaliados
      const topRated = (ufData ?? []).filter((u: UserFilm) => (u.rating ?? 0) >= 4)
      if (topRated.length > 0 && user) {
        const topFilm = loaded.find((f: Film) => f.id === topRated[0].film_id)
        if (topFilm) {
          const tmdbData = await fetchAllMovieData([topFilm.title])
          const tmdbId = (tmdbData[topFilm.title] as any)?.id
          if (tmdbId) {
            const sims = await fetchSimilarMovies(tmdbId)
            setSimilar(sims)
          }
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
    filmsByCategory(cat)
      .map(f => ({ title: f.title, rating: userFilms.find(u => u.film_id === f.id)?.rating ?? 0 }))
      .filter(f => f.rating > 0)
      .sort((a, b) => b.rating - a.rating)

  const unwatchedFilms = films.filter(f => !userFilms.find(u => u.film_id === f.id && u.watched))

  const glass = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
    </main>
  )

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Header decorativo sem hero image */}
      <div className="relative px-4 pt-16 pb-8 overflow-hidden">
        {/* Orbs decorativos */}
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}/>
        <div className="absolute top-8 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(32px)' }}/>
        <div className="relative">
          <p className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            98ª edição · 15 de março
          </p>
          <h1 className="text-3xl font-bold leading-tight">Descobrir</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Termômetro, indicados e curiosidades do Oscar
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-6">

        {/* Swingometer com seletor de categoria */}
        <div className="rounded-3xl p-5" style={glass}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Termômetro
            </p>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
                {selectedCat} <span style={{ color: 'rgba(255,255,255,0.4)' }}>▾</span>
              </button>
              {catDropdownOpen && (
                <>
                  <div className="fixed inset-0" style={{ zIndex: 98 }} onClick={() => setCatDropdownOpen(false)}/>
                  <div className="absolute top-full right-0 mt-2 rounded-2xl py-2 w-56"
                    style={{ ...glass, background: 'rgba(14,14,20,0.98)', zIndex: 99 }}>
                    {ALL_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => { setSelectedCat(cat); setCatDropdownOpen(false) }}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5"
                        style={{ color: cat === selectedCat ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <GaugeChart ratings={swingRatings(selectedCat)}/>

          {/* Mini ranking */}
          {swingRatings(selectedCat).length > 1 && (
            <div className="mt-4 flex flex-col gap-2">
              {swingRatings(selectedCat).slice(0, 5).map((f, i) => (
                <div key={f.title} className="flex items-center gap-3">
                  <p className="text-xs w-4 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>#{i+1}</p>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${(f.rating / 5) * 100}%`,
                      background: i === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'rgba(255,255,255,0.15)',
                    }}/>
                  </div>
                  <p className="text-xs w-20 truncate text-right" style={{ color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>
                    {f.title}
                  </p>
                  <p className="text-xs" style={{ color: '#fbbf24', width: 20, textAlign: 'right' }}>{f.rating}★</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filmes que você ainda não viu */}
        {unwatchedFilms.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Você ainda não viu
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {unwatchedFilms.slice(0, 10).map(film => (
                <Link key={film.id} href={`/filmes/${film.id}`}
                  className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                  style={{ width: 110, aspectRatio: '2/3' }}>
                  <div className="absolute inset-0">
                    {(movieData[film.title] as any)?.poster
                      ? <img src={(movieData[film.title] as any).poster} alt={film.title} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                          <p className="text-white text-[10px] font-semibold leading-tight">{film.title}</p>
                        </div>
                    }
                  </div>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}/>
                  <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium leading-tight z-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {film.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recomendados para você */}
        {similar.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Você pode gostar
            </p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Baseado nos filmes que você mais curtiu
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {similar.map(film => (
                <div key={film.title} className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                  style={{ width: 110, aspectRatio: '2/3' }}>
                  <div className="absolute inset-0">
                    {film.poster
                      ? <img src={film.poster} alt={film.title} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg, #1a0533, #0a0a0f)' }}>
                          <p className="text-white text-[10px] leading-tight">{film.title}</p>
                        </div>
                    }
                  </div>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }}/>
                  <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium leading-tight z-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {film.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Curiosidades do Oscar */}
        <div>
          <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Curiosidades do Oscar
          </p>
          <div className="flex flex-col gap-3">
            {FACTS.map((fact, i) => (
              <button key={i} onClick={() => setExpandedFact(expandedFact === i ? null : i)}
                className="rounded-3xl p-4 text-left transition-all"
                style={{
                  ...glass,
                  ...(expandedFact === i ? { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)' } : {})
                }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{fact.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight" style={{ color: 'white' }}>{fact.title}</p>
                    {expandedFact === i && (
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{fact.text}</p>
                    )}
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)', transform: expandedFact === i ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Em breve — Blog */}
        <div className="rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderStyle: 'dashed' }}>
          <span className="text-3xl">✍️</span>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Conteúdos e análises</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Textos, análises e bastidores do Oscar estão chegando em breve.
          </p>
          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.6)', border: '1px solid rgba(251,191,36,0.15)' }}>
            Em breve
          </span>
        </div>

      </div>
    </main>
  )
}
