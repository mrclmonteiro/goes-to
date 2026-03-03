'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { fetchMovieDetails } from '@/lib/tmdb'
import RatingSheet from '@/app/components/RatingSheet'

function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-5 overflow-x-auto pl-4 pr-4"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {children}
        <div style={{ minWidth: 4, flexShrink: 0 }}/>
      </div>
      <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, #0a0a0f)' }}/>
    </div>
  )
}

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

type Nomination = { film_id: string; category: string; nominee: string | null }
type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-lg font-semibold" style={{ color: 'white' }}>{children}</p>
  )
}

export default function FilmePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [film, setFilm] = useState<Film | null>(null)
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilm, setUserFilm] = useState<UserFilm | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>({})

  // Synopsis bottom sheet
  const [synopsisOpen, setSynopsisOpen] = useState(false)
  const [synopsisY, setSynopsisY] = useState(100)
  const [synopsisDragging, setSynopsisDragging] = useState(false)
  const synopsisDragStart = useRef<number | null>(null)
  const synopsisDragCurrent = useRef(0)

  function openSynopsis() {
    setSynopsisOpen(true)
    requestAnimationFrame(() => setSynopsisY(0))
  }
  function closeSynopsis() {
    setSynopsisY(100)
    setTimeout(() => setSynopsisOpen(false), 400)
  }

  useEffect(() => {
    if (synopsisOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [synopsisOpen])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      const { data: filmData } = await supabase.from('films').select('*').eq('id', id).single()
      const { data: nomsData } = await supabase.from('nominations').select('*').eq('film_id', id)
      const { data: ufData } = await supabase.from('user_films').select('*').eq('film_id', id).eq('user_id', user?.id ?? '').maybeSingle()
      setFilm(filmData)
      setNominations(nomsData ?? [])
      setUserFilm(ufData ?? null)
      if (ufData?.rating) {
        const cats = nomsData?.map((n: Nomination) => CATEGORY_LABELS[n.category] ?? n.category) ?? []
        const initial: Record<string, number> = {}
        cats.forEach((c: string) => { initial[c] = ufData.rating ?? 0 })
        setRatings(initial)
      }
      if (filmData) {
        const { fetchMovieData } = await import('@/lib/tmdb')
        const basic = await fetchMovieData(filmData.title)
        if (basic?.id) {
          const det = await fetchMovieDetails(basic.id)
          setDetails(det)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function toggleWatched() {
    if (!userId || !film) return
    const supabase = createClient()
    if (!supabase) return
    if (userFilm) {
      await supabase.from('user_films').update({ watched: !userFilm.watched }).eq('user_id', userId).eq('film_id', id)
      setUserFilm({ ...userFilm, watched: !userFilm.watched })
    } else {
      await supabase.from('user_films').insert({ user_id: userId, film_id: id, watched: true })
      setUserFilm({ film_id: id, watched: true, rating: null })
    }
  }

  async function saveRating(cat: string, value: number) {
    if (!userId || !film) return
    const supabase = createClient()
    if (!supabase) return
    const newRatings = { ...ratings, [cat]: value }
    setRatings(newRatings)
    const vals = Object.values(newRatings)
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
    if (userFilm) {
      await supabase.from('user_films').update({ rating: avg, watched: true }).eq('user_id', userId).eq('film_id', id)
      setUserFilm({ ...userFilm, rating: avg, watched: true })
    } else {
      await supabase.from('user_films').insert({ user_id: userId, film_id: id, watched: true, rating: avg })
      setUserFilm({ film_id: id, watched: true, rating: avg })
    }
  }

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
  if (!film) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Filme não encontrado</p>
    </main>
  )

  const backdrop = details?.backdrop
  const genres = details?.genres ?? []
  const filmNominations = nominations.map(n => ({ category: n.category, nominee: n.nominee ?? null }))

  return (
    <>
      <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

        {/* ── Back button — fixed, always visible ──────────────── */}
        <button
          onClick={() => router.back()}
          className="fixed top-14 left-4 z-50 w-9 h-9 rounded-full flex items-center justify-center"
          style={glass}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="relative w-full" style={{ height: '75vh', minHeight: 460 }}>
          <div className="absolute inset-0">
            {backdrop
              ? <img src={backdrop} alt={film.title} className="w-full h-full object-cover"/>
              : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a0533, #0a0a0f)'}}/>
            }
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 30%, rgba(10,10,15,0.7) 65%, #0a0a0f 100%)'
            }}/>
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 text-center">
            <h1 className="text-3xl font-bold leading-tight mb-2">{details?.ptTitle || film.title}</h1>
            {genres.length > 0 && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{genres.join(' · ')}</p>
            )}
            {details?.runtime > 0 && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {Math.floor(details.runtime / 60)}h {details.runtime % 60}min
                {details?.releaseDate ? ` · ${new Date(details.releaseDate).getFullYear()}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div className="mt-6 flex flex-col gap-8">

          {/* Ações */}
          <div className="px-4 flex gap-3">
            <button onClick={toggleWatched}
              className="flex-1 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: userFilm?.watched ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${userFilm?.watched ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)'}`,
                color: userFilm?.watched ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              }}>
              {userFilm?.watched ? '✓ Assistido' : '○ Marcar como assistido'}
            </button>
            <button onClick={() => setRatingSheetOpen(true)}
              className="py-3.5 px-5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all"
              style={{
                background: userFilm?.rating ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${userFilm?.rating ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)'}`,
                color: userFilm?.rating ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              }}>
              {userFilm?.rating ? `★ ${userFilm.rating}` : '★ Avaliar'}
            </button>
          </div>

          {/* Tagline */}
          {details?.tagline && (
            <p className="px-4 text-center text-xl font-semibold leading-snug"
              style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
              {details.tagline}
            </p>
          )}

          {/* ── Concorrendo a — sem box ───────────────────────── */}
          {filmNominations.length > 0 && (
            <div className="px-4">
              <SectionTitle>Concorrendo a</SectionTitle>
              <div className="mt-4 flex flex-col">
                {filmNominations.map((nom, i) => (
                  <div key={nom.category}>
                    <div className="flex items-center gap-3 py-3.5">
                      <svg width="12" height="18" viewBox="0 0 14 20" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M7 1 C5 3 2 5 1 8 C0 11 2 14 4 15 C5 16 6 17 7 19 C8 17 9 16 10 15 C12 14 14 11 13 8 C12 5 9 3 7 1Z"
                          fill="rgba(251,191,36,0.35)" stroke="rgba(251,191,36,0.25)" strokeWidth="0.5"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {CATEGORY_LABELS[nom.category] ?? nom.category}
                        </p>
                        {nom.nominee && (
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>{nom.nominee}</p>
                        )}
                      </div>
                    </div>
                    {i < filmNominations.length - 1 && (
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sinopse — título fora, texto em box com "Ver mais" ── */}
          {details?.overview && (
            <div className="px-4">
              <SectionTitle>Sinopse</SectionTitle>
              <div className="mt-3 rounded-3xl p-5 relative overflow-hidden" style={glass}>
                <p className="text-sm leading-relaxed" style={{
                  color: 'rgba(255,255,255,0.72)',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical' as any,
                  overflow: 'hidden',
                }}>
                  {details.overview}
                </p>
                {/* gradient fade at bottom of text */}
                <div className="absolute left-0 right-0 pointer-events-none"
                  style={{ bottom: 44, height: 32, background: 'linear-gradient(to bottom, transparent, rgba(18,18,28,0.96))' }}/>
                <button onClick={openSynopsis}
                  className="mt-3 text-xs font-semibold relative z-10"
                  style={{ color: 'rgba(251,191,36,0.8)' }}>
                  Ver mais ↓
                </button>
              </div>
            </div>
          )}

          {/* ── Ficha técnica — sem box ───────────────────────── */}
          {(details?.director || details?.writers?.length > 0 || details?.budget > 0) && (
            <div className="px-4">
              <SectionTitle>Ficha técnica</SectionTitle>
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

                {details?.writers?.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Roteiro</p>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {details.writers.map((w: any) => w.name).join(', ')}
                      </p>
                    </div>
                  </>
                )}

                {(details?.budget > 0 || details?.productionCompanies?.length > 0) && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                    <div className="grid grid-cols-2 gap-4">
                      {details?.budget > 0 && (
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Orçamento</p>
                          <p className="text-sm font-medium">${(details.budget / 1000000).toFixed(0)}M</p>
                        </div>
                      )}
                      {details?.productionCompanies?.length > 0 && (
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Estúdio</p>
                          <p className="text-sm font-medium leading-tight">{details.productionCompanies[0]}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Elenco — título px-4, scroll toca a borda ──────── */}
          {details?.cast?.length > 0 && (
            <div>
              <p className="px-4 text-lg font-semibold mb-4" style={{ color: 'white' }}>Elenco</p>
              <HScrollRow>
                {details.cast.map((actor: any) => (
                  <div key={actor.name} className="flex flex-col items-center flex-shrink-0 w-20">
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2"
                      style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}>
                      {actor.photo
                        ? <img src={actor.photo} alt={actor.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-lg"
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

          {/* ── Onde assistir — sem box ───────────────────────── */}
          {details?.streaming?.length > 0 && (
            <div className="px-4">
              <SectionTitle>Onde assistir</SectionTitle>
              <div className="mt-4 flex gap-4 flex-wrap">
                {details.streaming.map((s: any) => (
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
      </main>

      {/* ── Rating Sheet ─────────────────────────────────────────── */}
      <RatingSheet
        open={ratingSheetOpen}
        onClose={() => setRatingSheetOpen(false)}
        filmTitle={film.title}
        categories={filmNominations.map(n => CATEGORY_LABELS[n.category] ?? n.category)}
        nominees={Object.fromEntries(filmNominations.filter(n => n.nominee).map(n => [CATEGORY_LABELS[n.category] ?? n.category, n.nominee!]))}
        ratings={ratings}
        onRate={saveRating}
      />

      {/* ── Synopsis Bottom Sheet ────────────────────────────────── */}
      {synopsisOpen && (
        <div className="fixed inset-0 z-[999] flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeSynopsis}/>

          {/* Sheet */}
          <div
            className="relative w-full rounded-t-[32px] flex flex-col"
            style={{
              background: '#0e0e14',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
              maxHeight: '85vh',
              transform: `translateY(${synopsisY}%)`,
              transition: synopsisDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
            }}
            onTouchStart={e => {
              synopsisDragStart.current = e.touches[0].clientY
              setSynopsisDragging(true)
            }}
            onTouchMove={e => {
              if (synopsisDragStart.current === null) return
              const d = e.touches[0].clientY - synopsisDragStart.current
              if (d < 0) return
              synopsisDragCurrent.current = d
              setSynopsisY((d / window.innerHeight) * 100)
            }}
            onTouchEnd={() => {
              setSynopsisDragging(false)
              if (synopsisDragCurrent.current > 120) closeSynopsis()
              else setSynopsisY(0)
              synopsisDragStart.current = null
              synopsisDragCurrent.current = 0
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <div className="w-9"/>
              <p className="text-sm font-semibold" style={{ color: 'white' }}>Sinopse</p>
              <button
                onClick={closeSynopsis}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-5"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
              <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {details?.overview}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}