'use client'
import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchPersonPhoto, fetchPersonMovieIds } from '@/lib/tmdb'
import Link from 'next/link'
import { ORDERED_CATEGORIES, CATEGORY_LABELS, categoryCardBg, categorySlug } from '@/lib/categories'
import Spinner from '../components/Spinner'

type Film = { id: string; title: string }
type Nomination = { film_id: string; category: string; nominee: string | null }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type MovieData = { ptTitle?: string | null; poster: string | null; tmdbId?: number | null }

// Tipo de item unificado na lista de resultados
type ResultItem =
  | { kind: 'film';   film: Film; subtitle: string; poster: string | null; watched: boolean }
  | { kind: 'person'; name: string; subtitle: string; photo: string | null; href: string }
  | { kind: 'category'; cat: string }

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M9 18L15 12L9 6" stroke="rgba(255,255,255,0.28)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function BuscaInner() {
  const searchParams = useSearchParams()
  const rawQuery = searchParams.get('q') ?? ''
  const q = rawQuery.toLowerCase().trim()

  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [loading, setLoading] = useState(true)
  const [titleOpacity, setTitleOpacity] = useState(1)
  const [personPhotos, setPersonPhotos] = useState<Record<string, string | null>>({})
  // Filmes relacionados: encontrados via TMDB credits de pessoa não indicada
  const [relatedFilms, setRelatedFilms] = useState<Film[]>([])

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
      setMovieData(data as Record<string, MovieData>)
    }
    load().catch(e => console.error('[busca] load error:', e))
  }, [])

  useEffect(() => {
    const onScroll = () => setTitleOpacity(Math.max(0, 1 - window.scrollY / 80))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch person photos + related films via TMDB when query changes
  useEffect(() => {
    setPersonPhotos({})
    setRelatedFilms([])
    if (q.length < 2 || nominations.length === 0) return
    let cancelled = false

    const nomineeNames = new Set<string>()
    for (const nom of nominations) {
      if (!nom.nominee) continue
      for (const name of nom.nominee.split(/,| e /).map(s => s.trim()).filter(Boolean)) {
        if (name.toLowerCase().includes(q)) nomineeNames.add(name)
      }
    }

    // Fetch photos for matched nominees
    if (nomineeNames.size > 0) {
      Promise.all([...nomineeNames].map(async name => [name, await fetchPersonPhoto(name)] as const))
        .then(res => { if (!cancelled) setPersonPhotos(Object.fromEntries(res)) })
    }

    // If no nominees matched, try TMDB person search for related films
    if (nomineeNames.size === 0) {
      fetchPersonMovieIds(rawQuery).then(credits => {
        if (cancelled || credits.length === 0) return
        // Match by title (primary — avoids TMDB ID mismatch for common titles like "Frankenstein")
        // or by tmdbId as fallback
        const creditTitles = new Set(credits.map(c => c.title.toLowerCase()))
        const creditIds = new Set(credits.map(c => c.id))
        const matched = films.filter(f => {
          if (creditTitles.has(f.title.toLowerCase())) return true
          const tid = (movieData[f.title] as MovieData)?.tmdbId
          return tid != null && creditIds.has(tid)
        })
        if (!cancelled) setRelatedFilms(matched)
      })
    }

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, nominations, rawQuery, movieData])

  // ── Resultados directos ────────────────────────────────────────────────
  const directResults = useMemo<ResultItem[]>(() => {
    if (q.length < 2) return []
    const items: ResultItem[] = []

    // Pessoas indicadas
    const personMap = new Map<string, { name: string; films: Film[]; categories: string[] }>()
    for (const nom of nominations) {
      if (!nom.nominee) continue
      for (const name of nom.nominee.split(/,| e /).map(s => s.trim()).filter(Boolean)) {
        if (!name.toLowerCase().includes(q)) continue
        const film = films.find(f => f.id === nom.film_id)
        if (!film) continue
        if (!personMap.has(name)) personMap.set(name, { name, films: [], categories: [] })
        const p = personMap.get(name)!
        if (!p.films.find(f => f.id === film.id)) p.films.push(film)
        if (!p.categories.includes(nom.category)) p.categories.push(nom.category)
      }
    }
    for (const p of personMap.values()) {
      const catLabels = p.categories.slice(0, 2).map(c => CATEGORY_LABELS[c] ?? c).join(' · ')
      items.push({
        kind: 'person',
        name: p.name,
        subtitle: `Profissional · ${catLabels}${p.categories.length > 2 ? ` +${p.categories.length - 2}` : ''}`,
        photo: personPhotos[p.name] ?? null,
        href: `/filmes/${p.films[0].id}`,
      })
    }

    // Filmes
    for (const f of films) {
      const pt = movieData[f.title]?.ptTitle ?? ''
      if (!f.title.toLowerCase().includes(q) && !pt.toLowerCase().includes(q)) continue
      const cats = nominations.filter(n => n.film_id === f.id).map(n => n.category)
      const catStr = cats.slice(0, 2).map(c => CATEGORY_LABELS[c] ?? c).join(' · ')
      const uf = userFilms.find(u => u.film_id === f.id)
      items.push({
        kind: 'film',
        film: f,
        subtitle: `Filme${catStr ? ` · ${catStr}` : ''}${cats.length > 2 ? ` +${cats.length - 2}` : ''}`,
        poster: movieData[f.title]?.poster ?? null,
        watched: uf?.watched ?? false,
      })
    }

    // Categorias
    for (const cat of ORDERED_CATEGORIES) {
      if (cat.toLowerCase().includes(q) || (CATEGORY_LABELS[cat] ?? '').toLowerCase().includes(q)) {
        items.push({ kind: 'category', cat })
      }
    }

    return items
  }, [q, films, nominations, userFilms, movieData, personPhotos])

  // ── Resultados relacionados (via TMDB) ─────────────────────────────────
  const relatedResults = useMemo<ResultItem[]>(() => {
    return relatedFilms
      .filter(f => !directResults.some(r => r.kind === 'film' && r.film.id === f.id))
      .map(f => {
        const cats = nominations.filter(n => n.film_id === f.id).map(n => n.category)
        const catStr = cats.slice(0, 2).map(c => CATEGORY_LABELS[c] ?? c).join(' · ')
        const uf = userFilms.find(u => u.film_id === f.id)
        return {
          kind: 'film' as const,
          film: f,
          subtitle: `Filme · ${catStr}${cats.length > 2 ? ` +${cats.length - 2}` : ''}`,
          poster: movieData[f.title]?.poster ?? null,
          watched: uf?.watched ?? false,
        }
      })
  }, [relatedFilms, directResults, nominations, userFilms, movieData])

  const watchedFilms = useMemo(() =>
    films.filter(f => userFilms.find(u => u.film_id === f.id && u.watched)),
    [films, userFilms]
  )

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  const THUMB = { width: 40, height: 56 } as const
  const thumbBorder = '1px solid rgba(255,255,255,0.14)'

  function renderItem(item: ResultItem, i: number, borderTop: boolean) {
    const divider = borderTop ? '1px solid rgba(255,255,255,0.08)' : 'none'
    if (item.kind === 'person') return (
      <Link key={item.name + i} href={item.href}
        className="flex items-center gap-3 px-4 py-3 active:bg-white/10 transition-colors"
        style={{ borderTop: divider }}>
        <div className="flex-shrink-0 rounded-full overflow-hidden"
          style={{ width: THUMB.width, height: THUMB.width, background: 'rgba(255,255,255,0.07)', border: thumbBorder }}>
          {item.photo
            ? <img src={item.photo} alt={item.name} className="w-full h-full object-cover object-top"/>
            : <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 20 }}>👤</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: 'white' }}>{item.name}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.subtitle}</p>
        </div>
        <ChevronRight />
      </Link>
    )
    if (item.kind === 'film') return (
      <Link key={item.film.id + i} href={`/filmes/${item.film.id}`}
        className="flex items-center gap-3 px-4 py-3 active:bg-white/10 transition-colors"
        style={{ borderTop: divider }}>
        <div className="rounded-xl overflow-hidden flex-shrink-0"
          style={{ ...THUMB, background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)', border: thumbBorder }}>
          {item.poster
            ? <img src={item.poster} alt={item.film.title} className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center text-base">🎬</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-tight flex-1" style={{ color: 'white' }}>
              {movieData[item.film.title]?.ptTitle || item.film.title}
            </p>
            {item.watched && (
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,69,58,0.9)' }}>
                <span className="text-[8px] font-bold text-black">✓</span>
              </div>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.subtitle}</p>
        </div>
        <ChevronRight />
      </Link>
    )
    // category
    return (
      <Link key={item.cat + i} href={`/categorias/${categorySlug(item.cat)}`}
        className="flex items-center gap-3 px-4 py-3 active:bg-white/10 transition-colors"
        style={{ borderTop: divider }}>
        <div className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ ...THUMB, background: categoryCardBg(item.cat), border: thumbBorder }}>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'white' }}>{CATEGORY_LABELS[item.cat] ?? item.cat}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Categoria</p>
        </div>
        <ChevronRight />
      </Link>
    )
  }

  return (
    <main className="min-h-screen pb-36 relative overflow-x-hidden" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Header */}
      <div className="relative px-4 pt-24 pb-6">
        <h1 className="text-3xl font-bold leading-tight"
          style={{ position: 'fixed', left: 16, top: 'max(env(safe-area-inset-top), 52px)', zIndex: 20, pointerEvents: 'none', opacity: titleOpacity, transition: 'opacity 0.2s ease' }}>
          Buscar
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Filmes, diretores, atores e categorias</p>
      </div>

      <div className="flex flex-col gap-7">

        {/* Estado inicial */}
        {q.length < 2 && (
          <>
            <div className="px-4">
              <p className="text-lg font-semibold mb-[5px]" style={{ color: 'white' }}>Categorias</p>
              <div className="grid grid-cols-2 gap-3">
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

            {watchedFilms.length > 0 && (
              <div>
                <p className="text-lg font-semibold mb-[5px] px-4" style={{ color: 'white' }}>Assistidos recentemente</p>
                <div className="relative">
                  <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-1"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {watchedFilms.slice(0, 8).map(film => (
                      <Link key={film.id} href={`/filmes/${film.id}`}
                        className="poster-press flex-shrink-0 relative rounded-2xl overflow-hidden"
                        style={{ width: 110, aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="absolute inset-0">
                          {movieData[film.title]?.poster
                            ? <img src={movieData[film.title].poster!} alt={film.title} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-end p-2" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                                <p className="text-white text-[10px] font-semibold leading-tight">{movieData[film.title]?.ptTitle || film.title}</p>
                              </div>
                          }
                        </div>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}/>
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(255,69,58,0.9)' }}>
                          <span className="text-[8px] font-bold text-black">✓</span>
                        </div>
                        <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium leading-tight z-10"
                          style={{ color: 'rgba(255,255,255,0.8)' }}>
                          {movieData[film.title]?.ptTitle || film.title}
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
          <div className="flex flex-col gap-6">

            {directResults.length === 0 && relatedResults.length === 0 && (
              <div className="px-4 flex flex-col items-center py-12 gap-3">
                <span className="text-5xl">🍿</span>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Nada encontrado para &ldquo;{rawQuery}&rdquo;
                </p>
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Tente buscar pelo nome do filme, ator ou categoria
                </p>
              </div>
            )}

            {/* Lista unificada de resultados diretos */}
            {directResults.length > 0 && (
              <div>
                {directResults.map((item, i) => renderItem(item, i, i > 0))}
              </div>
            )}

            {/* Relacionados via TMDB */}
            {relatedResults.length > 0 && (
              <div>
                <p className="px-4 text-lg font-semibold mb-1" style={{ color: 'white' }}>Relacionados</p>
                <p className="px-4 text-sm mb-[5px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Filmes com &ldquo;{rawQuery}&rdquo; nos créditos
                </p>
                {relatedResults.map((item, i) => renderItem(item, i + 1000, i > 0))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default function BuscaPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Spinner size={44} />
      </main>
    }>
      <BuscaInner />
    </Suspense>
  )
}
