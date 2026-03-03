'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData } from '@/lib/tmdb'
import Link from 'next/link'

type Film = { id: string; title: string }
type Nomination = { film_id: string; category: string; nominee: string | null }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type MovieData = { poster: string | null }

const CATEGORY_LABELS: Record<string, string> = {
  'Best Picture': 'Melhor Filme',
  'Best Director': 'Direção',
  'Best Actor': 'Ator',
  'Best Actress': 'Atriz',
  'Best Supporting Actor': 'Ator Coadjuvante',
  'Best Supporting Actress': 'Atriz Coadjuvante',
  'Best Animated Feature': 'Animação',
  'Best International Feature': 'Internacional',
}

export default function BuscaPage() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [loading, setLoading] = useState(true)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()
      const { data: filmsData } = await supabase.from('films').select('*')
      const { data: nomsData } = await supabase.from('nominations').select('*')
      const { data: ufData } = await supabase.from('user_films').select('*').eq('user_id', user?.id ?? '')
      const loaded = filmsData ?? []
      setFilms(loaded)
      setNominations(nomsData ?? [])
      setUserFilms(ufData ?? [])
      setLoading(false)
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data as any)
    }
    load()
    // Foca automaticamente
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const filmCategories = (filmId: string) =>
    nominations.filter(n => n.film_id === filmId).map(n => n.category)

  const filmNominees = (filmId: string) =>
    nominations.filter(n => n.film_id === filmId && n.nominee).map(n => n.nominee as string)

  // Busca: filmes e nominees
  const q = query.toLowerCase().trim()
  const results = q.length < 2 ? [] : films.filter(f => {
    const inTitle = f.title.toLowerCase().includes(q)
    const inNominee = filmNominees(f.id).some(n => n.toLowerCase().includes(q))
    const inCategory = filmCategories(f.id).some(c =>
      c.toLowerCase().includes(q) || (CATEGORY_LABELS[c] ?? '').toLowerCase().includes(q)
    )
    return inTitle || inNominee || inCategory
  })

  // Sugestões rápidas (categorias)
  const quickFilters = Object.entries(CATEGORY_LABELS)

  const glass = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.1)',
  }

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Header com campo de busca */}
      <div className="sticky top-0 z-30 px-4 pt-14 pb-4"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-full"
          style={{
            ...glass,
            border: focused ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: focused ? '0 0 0 3px rgba(251,191,36,0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8"/>
            <path d="M17 17L21 21" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Buscar filmes, diretores, atores..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'white' }}/>
          {query.length > 0 && (
            <button onClick={() => setQuery('')} className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">

        {/* Estado inicial — filtros rápidos */}
        {q.length < 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Navegar por categoria
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickFilters.map(([cat, label]) => {
                const catFilms = films.filter(f => nominations.find(n => n.film_id === f.id && n.category === cat))
                return (
                  <button key={cat} onClick={() => setQuery(label)}
                    className="rounded-2xl p-4 text-left transition-all"
                    style={{ ...glass, boxShadow: 'none' }}>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'white' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {catFilms.length} {catFilms.length === 1 ? 'indicado' : 'indicados'}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Filmes recém-assistidos como atalho */}
            {userFilms.filter(u => u.watched).length > 0 && (
              <div className="mt-2">
                <p className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Assistidos recentemente
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {films
                    .filter(f => userFilms.find(u => u.film_id === f.id && u.watched))
                    .slice(0, 8)
                    .map(film => (
                      <Link key={film.id} href={`/filmes/${film.id}`}
                        className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                        style={{ width: 90, aspectRatio: '2/3' }}>
                        <div className="absolute inset-0">
                          {(movieData[film.title] as any)?.poster
                            ? <img src={(movieData[film.title] as any).poster} alt={film.title} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                                <p className="text-white text-[10px] font-semibold leading-tight">{film.title}</p>
                              </div>
                          }
                        </div>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}/>
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(251,191,36,0.9)' }}>
                          <span className="text-[8px] font-bold text-black">✓</span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultados */}
        {q.length >= 2 && (
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {results.length === 0 ? 'Nenhum resultado' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
            </p>

            {results.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-5xl">🍿</span>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Nada encontrado para "{query}"
                </p>
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Tente buscar pelo nome do filme, ator ou categoria
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map(film => {
                  const uf = userFilms.find(u => u.film_id === film.id)
                  const cats = filmCategories(film.id)
                  const nominees = filmNominees(film.id).filter(n => n.toLowerCase().includes(q))
                  const poster = (movieData[film.title] as any)?.poster

                  return (
                    <Link key={film.id} href={`/filmes/${film.id}`}
                      className="flex items-center gap-4 p-3 rounded-2xl transition-all"
                      style={glass}>
                      {/* Poster miniatura */}
                      <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                        {poster
                          ? <img src={poster} alt={film.title} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight" style={{ color: 'white' }}>{film.title}</p>
                          {uf?.watched && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(251,191,36,0.9)' }}>
                              <span className="text-[9px] font-bold text-black">✓</span>
                            </div>
                          )}
                        </div>

                        {/* Categorias */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cats.slice(0, 3).map(cat => (
                            <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
                              {CATEGORY_LABELS[cat] ?? cat}
                            </span>
                          ))}
                          {cats.length > 3 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>
                              +{cats.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Nominees encontrados na busca */}
                        {nominees.length > 0 && (
                          <p className="text-[11px] mt-1" style={{ color: 'rgba(251,191,36,0.6)' }}>
                            {nominees.slice(0, 2).join(', ')}
                          </p>
                        )}

                        {uf?.rating && (
                          <p className="text-xs mt-1" style={{ color: '#fbbf24' }}>{'★'.repeat(uf.rating)}</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
