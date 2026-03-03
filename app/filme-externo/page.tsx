'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Cast = { name: string; character: string; photo: string | null }
type Streaming = { name: string; logo: string | null }

type FilmDetails = {
  title: string
  ptTitle: string | null
  poster: string | null
  backdrop: string | null
  overview: string | null
  tagline: string | null
  genres: string[]
  runtime: number
  releaseDate: string | null
  director: { name: string; photo: string | null } | null
  writers: { name: string }[]
  cast: Cast[]
  streaming: Streaming[]
  keywords: string[]
  budget: number
}

function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pl-5 pr-5"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {children}
        <div style={{ minWidth: 4, flexShrink: 0 }}/>
      </div>
      <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, #0a0a0f)' }}/>
    </div>
  )
}

function ExternalFilmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tmdbId = searchParams.get('id')
  const titleParam = searchParams.get('title') ?? ''

  const [details, setDetails] = useState<FilmDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [overviewExpanded, setOverviewExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      if (!tmdbId) { setLoading(false); return }
      const { fetchMovieDetails } = await import('@/lib/tmdb')
      const det = await fetchMovieDetails(Number(tmdbId))
      setDetails(det as unknown as FilmDetails)
      setLoading(false)
    }
    load()
  }, [tmdbId])

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

  const title = details?.ptTitle ?? details?.title ?? titleParam
  const genres = details?.genres ?? []

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Botão voltar flutuante */}
      <button onClick={() => router.back()}
        className="fixed top-14 left-4 z-20 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ ...glass, position: 'fixed' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Header: poster + info lado a lado */}
      <div className="relative overflow-hidden">
        {/* backdrop suave */}
        {details?.backdrop && (
          <div className="absolute inset-0">
            <img src={details.backdrop} alt={title} className="w-full h-full object-cover"/>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.5) 0%, #0a0a0f 100%)' }}/>
          </div>
        )}
        {!details?.backdrop && (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a0533, #0a0a0f)' }}/>
        )}

        <div className="relative flex items-end gap-5 px-5 pt-28 pb-8">
          {/* Poster */}
          <div className="flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 110, aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.15)' }}>
            {details?.poster
              ? <img src={details.poster} alt={title} className="w-full h-full object-cover"/>
              : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}/>
            }
          </div>

          {/* Info */}
          <div className="flex-1 pb-1">
            <p className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Você pode gostar
            </p>
            <h1 className="text-xl font-bold leading-tight mb-2">{title}</h1>
            {genres.length > 0 && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{genres.slice(0,3).join(' · ')}</p>
            )}
            {details?.runtime && details.runtime > 0 && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {Math.floor(details.runtime / 60)}h {details.runtime % 60}min
                {details.releaseDate ? ` · ${new Date(details.releaseDate).getFullYear()}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-2">

        {/* Tagline */}
        {details?.tagline && (
          <p className="text-center text-lg font-semibold px-6 leading-snug"
            style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
            {details.tagline}
          </p>
        )}

        {/* Sinopse */}
        {details?.overview && (
          <div className="mx-4 rounded-3xl p-5" style={glass}>
            <p className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Sinopse</p>
            <div className="relative">
              <p className="text-sm leading-relaxed" style={{
                color: 'rgba(255,255,255,0.72)',
                ...(overviewExpanded ? {} : {
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical' as any,
                  overflow: 'hidden',
                })
              }}>
                {details.overview}
              </p>
              {!overviewExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-8"
                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(14,14,20,0.96))' }}/>
              )}
            </div>
            <button onClick={() => setOverviewExpanded(!overviewExpanded)}
              className="mt-3 text-xs font-semibold" style={{ color: 'rgba(251,191,36,0.8)' }}>
              {overviewExpanded ? 'Ver menos ↑' : 'Ver mais ↓'}
            </button>
          </div>
        )}

        {/* Ficha técnica */}
        {(details?.director || (details?.writers?.length ?? 0) > 0 || (details?.budget ?? 0) > 0) && (
          <div className="mx-4 rounded-3xl p-5 flex flex-col gap-4" style={glass}>
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Ficha técnica</p>

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

            {(details?.writers?.length ?? 0) > 0 && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Roteiro</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {details!.writers.map(w => w.name).join(', ')}
                  </p>
                </div>
              </>
            )}

            {(details?.budget ?? 0) > 0 && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
                <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Orçamento</p>
                  <p className="text-sm font-medium">${(details!.budget / 1000000).toFixed(0)}M</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Elenco */}
        {(details?.cast?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-4 px-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Elenco</p>
            <HScrollRow>
              {details!.cast.map((actor) => (
                <div key={actor.name} className="flex flex-col items-center flex-shrink-0 w-20">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-2"
                    style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}>
                    {actor.photo
                      ? <img src={actor.photo} alt={actor.name} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-xl"
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

        {/* Streaming */}
        {(details?.streaming?.length ?? 0) > 0 && (
          <div className="mx-4 rounded-3xl p-5" style={glass}>
            <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Onde assistir</p>
            <div className="flex gap-4 flex-wrap">
              {details!.streaming.map(s => (
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

        {/* Keywords */}
        {(details?.keywords?.length ?? 0) > 0 && (
          <div className="px-4 flex flex-wrap gap-2 pb-2">
            {details!.keywords.map(kw => (
              <span key={kw} className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
                {kw}
              </span>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
export default function ExternalFilmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p className="text-sm animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
      </main>
    }>
      <ExternalFilmContent />
    </Suspense>
  )
}