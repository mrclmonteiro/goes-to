'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Spinner from '../components/Spinner'

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

const lgStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid transparent',
  boxShadow: 'var(--lg-shadow)',
}

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
  const [synopsisOpen, setSynopsisOpen] = useState(false)

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
      <Spinner size={44} />
    </main>
  )

  const title = details?.ptTitle ?? details?.title ?? titleParam
  const genres = details?.genres ?? []

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Botão voltar flutuante */}
      <button onClick={() => router.back()}
        className="lg-btn fixed z-20 flex items-center justify-center rounded-full"
        style={{ ...lgStyle, position: 'fixed', top: 'max(env(safe-area-inset-top), 45px)', left: '15px', width: '44px', height: '44px', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 3 }}>
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
          <div className="px-4">
            <p className="text-lg font-semibold" style={{ color: 'white' }}>Sinopse</p>
            <div className="mt-3 rounded-3xl px-5 py-5 relative" style={glass}>
              <div style={{ position: 'relative', maxHeight: '2.8em', overflow: 'hidden', lineHeight: '1.4em' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', margin: 0 }}>
                  {details.overview}
                </p>
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  height: '1.4em', width: '55%',
                  background: 'linear-gradient(to right, transparent, rgba(22,22,30,0.98) 60%)',
                  pointerEvents: 'none',
                }}/>
                <button
                  onClick={() => setSynopsisOpen(true)}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    background: 'none', border: 'none', padding: 0,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.72)', cursor: 'pointer', lineHeight: '1.4em',
                  }}>
                  MAIS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ficha técnica */}
        {(details?.director || (details?.writers?.length ?? 0) > 0 || (details?.budget ?? 0) > 0) && (
          <div className="px-4">
            <p className="text-lg font-semibold" style={{ color: 'white' }}>Ficha técnica</p>
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
              {(details?.writers?.length ?? 0) > 0 && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
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
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Orçamento</p>
                    <p className="text-sm font-medium">${(details!.budget / 1000000).toFixed(0)}M</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Elenco */}
        {(details?.cast?.length ?? 0) > 0 && (
          <div>
            <p className="px-4 text-lg font-semibold mb-4" style={{ color: 'white' }}>Elenco</p>
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
          <div className="px-4">
            <p className="text-lg font-semibold" style={{ color: 'white' }}>Onde assistir</p>
            <div className="mt-4 flex gap-4 flex-wrap">
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


      </div>

      {/* Sinopse Sheet */}
      <BottomSheet open={synopsisOpen} onClose={() => setSynopsisOpen(false)} title={title}>
        <div className="px-5 py-2">
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {details?.overview}
          </p>
        </div>
      </BottomSheet>
    </main>
  )
}
export default function ExternalFilmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Spinner size={44} />
      </main>
    }>
      <ExternalFilmContent />
    </Suspense>
  )
}