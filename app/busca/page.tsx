'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-lg font-semibold" style={{ color: 'white' }}>{children}</p>
}

export default function BuscaPage() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [loading, setLoading] = useState(true)

  const glass = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.1)',
  }

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
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const filmCategories = (filmId: string) =>
    nominations.filter(n => n.film_id === filmId).map(n => n.category)

  const filmNominees = (filmId: string) =>
    nominations.filter(n => n.film_id === filmId && n.nominee).map(n => n.nominee as string)

  const q = query.toLowerCase().trim()
  const results = q.length < 2 ? [] : films.filter(f => {
    const inTitle = f.title.toLowerCase().includes(q)
    const inNominee = filmNominees(f.id).some(n => n.toLowerCase().includes(q))
    const inCategory = filmCategories(f.id).some(c =>
      c.toLowerCase().includes(q) || (CATEGORY_LABELS[c] ?? '').toLowerCase().includes(q)
    )
    return inTitle || inNominee || inCategory
  })

  const quickFilters = Object.entries(CATEGORY_LABELS)
  const watchedFilms = films.filter(f => userFilms.find(u => u.film_id === f.id && u.watched))

  return (
    <main className="min-h-screen pb-36 relative overflow-x-hidden" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Background lights */}
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}/>
      <div className="absolute top-8 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(32px)' }}/>

      {/* Header */}
      <div className="relative px-4 pt-16 pb-6">
        <h1 className="text-3xl font-bold leading-tight">Buscar</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Filmes, diretores, atores e categorias</p>
      </div>

      <div className="flex flex-col gap-7">

        {/* Estado inicial */}
        {q.length < 2 && (
          <>
            {/* Navegar por categoria */}
            <div className="px-4">
              <div className="mb-3">
                <SectionTitle>Navegar por categoria</SectionTitle>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickFilters.map(([cat, label]) => {
                  const catFilms = films.filter(f => nominations.find(n => n.film_id === f.id && n.category === cat))
                  return (
                    <button key={cat} onClick={() => setQuery(label)}
                      className="rounded-2xl p-4 text-left transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'white' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {catFilms.length} {catFilms.length === 1 ? 'indicado' : 'indicados'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Assistidos recentemente */}
            {watchedFilms.length > 0 && (
              <div>
                <div className="mb-3 px-4">
                  <SectionTitle>Assistidos recentemente</SectionTitle>
                </div>
                <div className="relative">
                  <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-1"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                  {watchedFilms.slice(0, 8).map(film => (
                    <Link key={film.id} href={`/filmes/${film.id}`}
                      className="flex-shrink-0 relative rounded-2xl overflow-hidden"
                      style={{ width: 110, aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="absolute inset-0">
                        {(movieData[film.title] as any)?.poster
                          ? <img src={(movieData[film.title] as any).poster} alt={film.title} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                              <p className="text-white text-[10px] font-semibold leading-tight">{film.title}</p>
                            </div>
                        }
                      </div>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}/>
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(251,191,36,0.9)' }}>
                        <span className="text-[8px] font-bold text-black">✓</span>
                      </div>
                      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium leading-tight z-10"
                        style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {film.title}
                      </p>
                    </Link>
                  ))}
                    <div style={{ minWidth: 4, flexShrink: 0 }}/>
                  </div>
                  <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
                    style={{ background: 'linear-gradient(to right, transparent, #0a0a0f)' }}/>
                </div>
              </div>
            )}
          </>
        )}

        {/* Resultados */}
        {q.length >= 2 && (
          <div className="px-4">
            <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {results.length === 0 ? 'Nenhum resultado' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
            </p>

            {results.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-5xl">🍿</span>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Nada encontrado para &quot;{query}&quot;
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
                      <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                        {poster
                          ? <img src={poster} alt={film.title} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
                        }
                      </div>

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