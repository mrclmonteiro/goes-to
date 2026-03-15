'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData, fetchPersonPhoto, fetchMovieDetails } from '@/lib/tmdb'
import Link from 'next/link'
import Spinner from '../../components/Spinner'
import {
  CATEGORY_LABELS,
  CATEGORY_AURA,
  PERSON_CATEGORIES_SET,
  slugToCategory,
  categoryCardBg,
} from '@/lib/categories'

type Film = { id: string; title: string }
type Nomination = { film_id: string; category: string; nominee: string | null; winner: boolean }
type UserFilm = { film_id: string; rating: number | null; watched: boolean }
type MovieData = { ptTitle: string | null; poster: string | null; backdrop: string | null; tmdbId: number | null }
type WinnerDetails = { logo: string | null; tagline: string | null }

const lgStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid transparent',
  boxShadow: 'var(--lg-shadow)',
}

// ── Animated GaugeChart (identical to filmes/page.tsx) ──────────────
function GaugeChart({ ratings }: { ratings: { title: string; subtitle?: string; rating: number }[] }) {
  const targetPct = ratings.length > 0 ? ratings[0].rating / 5 : 0
  const [animPct, setAnimPct] = useState(targetPct)
  const animRef = useRef<number | null>(null)
  const fromRef = useRef(animPct)

  useEffect(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    const from = fromRef.current
    const to = targetPct
    const duration = 700
    const start = performance.now()
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const v = from + (to - from) * easeInOut(t)
      fromRef.current = v
      setAnimPct(v)
      if (t < 1) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPct])

  const isEmpty = ratings.length === 0
  const top = ratings[0]
  const displayRating = top ? Math.round(animPct * 5 * 10) / 10 : 0
  const r = 72, cx = 100, cy = 92
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + r * Math.cos(toRad(a))
  const arcY = (a: number) => cy + r * Math.sin(toRad(a))
  const needleAngle = 180 + animPct * 180
  const needleX = cx + (r - 14) * Math.cos(toRad(needleAngle))
  const needleY = cy + (r - 14) * Math.sin(toRad(needleAngle))
  const segments = 24

  if (isEmpty) return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm" style={{ color: 'rgba(128,128,128,0.5)' }}>Ainda sem votos nessa categoria</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(128,128,128,0.3)' }}>Avalie os filmes para ver o favorito</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-64">
        {Array.from({ length: segments }, (_, i) => {
          const sa = 180 + (i / segments) * 180
          const ea = 180 + ((i + 1) / segments) * 180
          const lit = i / segments < animPct
          return (
            <path key={i}
              d={`M ${arcX(sa)} ${arcY(sa)} A ${r} ${r} 0 0 1 ${arcX(ea)} ${arcY(ea)}`}
              stroke={lit ? `hsl(${30 + (i / segments) * 40},90%,60%)` : 'rgba(128,128,128,0.15)'}
              strokeWidth="9" strokeLinecap="butt" fill="none"/>
          )
        })}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="4" fill="white"/>
        <text x="28" y="106" fill="rgba(128,128,128,0.4)" fontSize="9" textAnchor="middle">0</text>
        <text x="172" y="106" fill="rgba(128,128,128,0.4)" fontSize="9" textAnchor="middle">5★</text>
        <text x={cx} y={cy - 18} fill="white" fontSize="26" fontWeight="700" textAnchor="middle">{displayRating}</text>
        <text x={cx} y={cy - 4} fill="rgba(255,255,255,0.35)" fontSize="8" textAnchor="middle">estrelas</text>
      </svg>
      <p className="font-semibold text-base mt-1 text-center" style={{ color: 'white' }}>{top.title}</p>
      {top.subtitle && <p className="text-xs font-medium mt-0.5 text-center" style={{ color: '#FF453A' }}>{top.subtitle}</p>}
      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>favorito dos usuários</p>
      {ratings.length > 1 && (
        <div className="flex gap-2 mt-4 w-full max-w-xs">
          {ratings.slice(1, 3).map((f, i) => (
            <div key={f.title} className="flex-1 rounded-2xl p-3 text-center" style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>#{i + 2}</p>
              <p className="text-xs font-medium mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.title}</p>
              {f.subtitle && <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.subtitle}</p>}
              <p className="text-xs mt-1" style={{ color: '#FF453A' }}>{f.rating}★</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoriaPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const category = slugToCategory(slug)
  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? category) : slug
  const aura = category ? CATEGORY_AURA[category] : ['#888888', '#666666', '#444444', '#0a0a0f'] as const
  const isPersonCat = category ? PERSON_CATEGORIES_SET.has(category) : false

  const [userId, setUserId] = useState<string | null>(null)
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [allUserFilms, setAllUserFilms] = useState<UserFilm[]>([])
  const [myUserFilms, setMyUserFilms] = useState<UserFilm[]>([])
  const [movieData, setMovieData] = useState<Record<string, MovieData>>({})
  const [personPhotos, setPersonPhotos] = useState<Record<string, string | null>>({})
  const [winnerDetails, setWinnerDetails] = useState<WinnerDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!category) { setLoading(false); return }
    async function load() {
      const supabase = createClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      const [{ data: filmsData }, { data: nomsData }, { data: allUF }, { data: myUF }] = await Promise.all([
        supabase.from('films').select('*'),
        supabase.from('nominations').select('*').eq('category', category),
        supabase.from('user_films').select('film_id, rating'),
        supabase.from('user_films').select('*').eq('user_id', user?.id ?? ''),
      ])
      const loaded = filmsData ?? []
      const noms = nomsData ?? []
      setFilms(loaded)
      setNominations(noms)
      setAllUserFilms(allUF ?? [])
      setMyUserFilms(myUF ?? [])
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setMovieData(data as any)
      setLoading(false)
      if (isPersonCat) {
        const nominees = noms
          .filter((n: Nomination) => n.nominee)
          .flatMap((n: Nomination) =>
            (n.nominee as string).split(/,| e /).map((s: string) => s.trim()).filter(Boolean)
          )
        const unique = [...new Set(nominees)] as string[]
        const photoPairs = await Promise.all(
          unique.map(async name => [name, await fetchPersonPhoto(name)] as const)
        )
        setPersonPhotos(Object.fromEntries(photoPairs))
      }
      // Buscar logo + tagline do vencedor
      const winnerNomLoad = noms.find((n: Nomination) => n.winner)
      if (winnerNomLoad) {
        const winnerF = loaded.find((f: Film) => f.id === winnerNomLoad.film_id)
        if (winnerF) {
          const tid = (data as any)[winnerF.title]?.tmdbId
          if (tid) {
            const det = await fetchMovieDetails(tid)
            setWinnerDetails({ logo: det?.logo ?? null, tagline: det?.tagline ?? null })
          }
        }
      }
    }
    load().catch(e => console.error('[categoria] load error:', e))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const nomFilms = films.filter(f => nominations.some(n => n.film_id === f.id))
  const nomWinners = new Set(nominations.filter(n => n.winner).map(n => n.film_id))

  const nominees = isPersonCat
    ? nominations
        .filter(n => n.nominee)
        .flatMap(n =>
          (n.nominee as string).split(/,| e /).map(s => s.trim()).filter(Boolean)
            .map(name => ({ name, film: films.find(f => f.id === n.film_id)!, winner: n.winner }))
        )
        .filter(n => n.film)
    : []

  const swingRatings = nomFilms
    .map(f => {
      const rats = allUserFilms.filter(u => u.film_id === f.id && u.rating)
      if (!rats.length) return { title: f.title, rating: 0 }
      const avg = rats.reduce((s, u) => s + (u.rating ?? 0), 0) / rats.length
      return { title: f.title, rating: Math.round(avg * 10) / 10 }
    })
    .filter(f => f.rating > 0)
    .sort((a, b) => b.rating - a.rating)

  const gaugeRatings = swingRatings.map(r => {
    const ptTitle = (movieData[r.title] as any)?.ptTitle || r.title
    if (isPersonCat) {
      const film = films.find(f => f.title === r.title)
      const nom = film ? nominations.find(n => n.film_id === film.id && n.nominee) : null
      const name = nom?.nominee ? (nom.nominee as string).split(/,| e /)[0].trim() : null
      return { ...r, title: name ?? ptTitle, subtitle: name ? ptTitle : undefined }
    }
    return { ...r, title: ptTitle }
  })

  const winnerNom = nominations.find(n => n.winner)
  const winnerFilm = winnerNom ? (nomFilms.find(f => f.id === winnerNom.film_id) ?? null) : null
  const topRatedFilm = swingRatings.length > 0 ? (films.find(f => f.title === swingRatings[0].title) ?? null) : null
  const usersGuessedRight = !!(winnerFilm && topRatedFilm && winnerFilm.id === topRatedFilm.id)

  const getMyUF = (filmId: string) => myUserFilms.find(u => u.film_id === filmId)

  async function toggleWatched(filmId: string) {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return
    const ex = getMyUF(filmId)
    if (ex) {
      await supabase.from('user_films').update({ watched: !ex.watched }).eq('user_id', userId).eq('film_id', filmId)
    } else {
      await supabase.from('user_films').insert({ user_id: userId, film_id: filmId, watched: true })
    }
    const { data } = await supabase.from('user_films').select('*').eq('user_id', userId)
    setMyUserFilms(data ?? [])
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  if (!category) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Categoria não encontrada</p>
    </main>
  )

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* ── Back button ─────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="lg-btn fixed z-[100] flex items-center justify-center rounded-full"
        style={{ ...lgStyle, position: 'fixed', top: 'max(env(safe-area-inset-top), 45px)', left: '15px', width: '44px', height: '44px', overflow: 'hidden' }}
      >
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-[2px]" style={{ position: 'relative', zIndex: 3 }}>
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Hero — animated gradient ────────────────────────────── */}
      <div className="relative w-full" style={{ height: '40vh', minHeight: 300 }}>
        <div className="absolute inset-0 overflow-hidden" style={{ background: aura[3] }}>
          <style>{`
            @keyframes catAura1 { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.2); } }
            @keyframes catAura2 { 0%,100% { transform: translate(-50%,-50%) scale(1); } 60% { transform: translate(-50%,-50%) scale(1.15) rotate(22deg); } }
            @keyframes catAura3 { 0%,100% { transform: translate(-50%,-50%) scale(1.08); } 40% { transform: translate(-50%,-50%) scale(0.9) rotate(-18deg); } }
          `}</style>
          <div style={{
            position: 'absolute', left: '25%', top: '32%',
            width: '72vw', height: '72vw', borderRadius: '50%',
            background: `radial-gradient(circle, ${aura[0]}bb 0%, transparent 70%)`,
            filter: 'blur(52px)',
            animation: 'catAura1 9s ease-in-out infinite',
          }}/>
          <div style={{
            position: 'absolute', left: '60%', top: '8%',
            width: '56vw', height: '56vw', borderRadius: '50%',
            background: `radial-gradient(circle, ${aura[1]}bb 0%, transparent 70%)`,
            filter: 'blur(46px)',
            animation: 'catAura2 11s ease-in-out infinite',
          }}/>
          <div style={{
            position: 'absolute', left: '8%', top: '56%',
            width: '62vw', height: '62vw', borderRadius: '50%',
            background: `radial-gradient(circle, ${aura[2]}bb 0%, transparent 70%)`,
            filter: 'blur(50px)',
            animation: 'catAura3 7s ease-in-out infinite',
          }}/>
        </div>

        {/* Bottom fade to page background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(10,10,15,0.45) 78%, #0a0a0f 100%)'
        }}/>

        {/* Category title — centered */}
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none">
          <h1 className="text-3xl font-bold leading-tight" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.45)' }}>{categoryLabel}</h1>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="px-4 mt-2">

        {/* ── O grande vencedor ────────────────────────────────────── */}
        {winnerFilm && (
          <div className="mb-8">
            <p className="text-lg font-semibold mb-4" style={{ color: 'white' }}>O grande vencedor</p>
            <Link href={`/filmes/${winnerFilm.id}`}
              className="block relative rounded-3xl overflow-hidden transition-transform duration-150 active:scale-[1.03]"
              style={{
                height: 280,
                border: '1px solid rgba(255,255,255,0.28)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35), 0 8px 32px rgba(0,0,0,0.35)',
              }}>
              {(movieData[winnerFilm.title] as any)?.backdrop
                ? <img src={(movieData[winnerFilm.title] as any).backdrop} alt={winnerFilm.title} className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0" style={{ background: categoryCardBg(category!) }} />
              }
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.92) 100%)' }} />
              <div className="absolute top-4 left-4 z-10 text-2xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>🏆</div>
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex items-end gap-4">
                                {isPersonCat && winnerNom?.nominee && (() => {
                  const firstName = (winnerNom.nominee as string).split(/,| e /)[0].trim();
                  const photo = personPhotos[firstName];
                  return (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ border: '2px solid rgba(255,255,255,0.8)' }}>
                      {photo ? (
                        <img src={photo} alt={firstName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-white/20 backdrop-blur-md text-white">
                          {firstName.charAt(0)}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex-1">
                  
                  {isPersonCat && winnerNom?.nominee && (
                    <p className="text-lg font-bold mb-1" style={{ color: '#E5E7EB' }}>
                      {winnerNom.nominee}
                    </p>
                  )}
                  {winnerDetails?.logo
                    ? <img src={winnerDetails.logo} alt={winnerFilm.title} className="h-12 mb-2 object-contain object-left" style={{ filter: 'brightness(0) invert(1)', maxWidth: '70%' }} />
                    : <p className="text-2xl font-bold mb-1 leading-tight" style={{ color: 'white', textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}>{(movieData[winnerFilm.title] as any)?.ptTitle || winnerFilm.title}</p>
                  }
                  {winnerDetails?.tagline && (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{winnerDetails.tagline}</p>
                  )}
                  
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* A opinião dos usuários */}
        <p className="text-lg font-semibold mb-4" style={{ color: 'white' }}>A opinião dos usuários</p>
        <div className="rounded-3xl p-6 mb-8 flex flex-col items-center" style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <GaugeChart ratings={gaugeRatings}/>
          {winnerFilm && swingRatings.length > 0 && (
            <div className="mt-4 px-4 py-2 rounded-full flex items-center gap-1.5" style={{
              background: usersGuessedRight ? 'rgba(52,199,89,0.12)' : 'rgba(255,69,58,0.12)',
              border: `1px solid ${usersGuessedRight ? 'rgba(52,199,89,0.3)' : 'rgba(255,69,58,0.2)'}`,
            }}>
              <span className="text-xs">{usersGuessedRight ? '🎯' : '❌'}</span>
              <span className="text-xs font-medium" style={{ color: usersGuessedRight ? '#34C759' : '#FF453A' }}>
                {usersGuessedRight
                  ? 'A galera acertou o vencedor!'
                  : `A galera errou — venceu ${(movieData[winnerFilm.title] as any)?.ptTitle || winnerFilm.title}`}
              </span>
            </div>
          )}
        </div>

        {/* Indicados */}
        <p className="text-lg font-semibold mb-4" style={{ color: 'white' }}>Indicados</p>

        {isPersonCat ? (
          <div className="grid grid-cols-3 gap-3">
            {nominees.map(({ name, film, winner }, i) => {
              const poster = (movieData[film.title] as any)?.poster
              const photo = personPhotos[name]
              return (
                <Link key={`${name}-${i}`} href={`/filmes/${film.id}`}
                  className="poster-press relative rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '2/3', border: `1px solid ${winner ? 'rgba(255,69,58,0.6)' : 'rgba(255,255,255,0.08)'}`, opacity: winner ? 1 : 0.45 }}>
                  <div className="absolute inset-0">
                    {poster
                      ? <img src={poster} alt={film.title} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#2d1b69,#0a0a0f)'}}/>
                    }
                  </div>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)' }}/>
                  {winner && (
                    <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(255,69,58,0.9)', color: 'white' }}>🏆</div>
                  )}
                  {(() => { const uf = getMyUF(film.id); return (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWatched(film.id) }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                      style={{ background: uf?.watched ? 'rgba(255,69,58,0.9)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                      <span className="text-[10px] font-bold" style={{ color: uf?.watched ? '#000' : 'rgba(255,255,255,0.4)' }}>{uf?.watched ? '✓' : '○'}</span>
                    </button>
                  )})()}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-2 z-10">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                      style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}>
                      {photo
                        ? <img src={photo} alt={name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{name.charAt(0)}</div>
                      }
                    </div>
                    <p className="text-[10px] font-semibold leading-tight"
                      style={{ color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{name}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {nomFilms.map(film => {
              const poster = (movieData[film.title] as any)?.poster
              const ptTitle = (movieData[film.title] as any)?.ptTitle
              const isWinner = nomWinners.has(film.id)
              return (
                <Link key={film.id} href={`/filmes/${film.id}`}
                  className="poster-press relative rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '2/3', border: `1px solid ${isWinner ? 'rgba(255,69,58,0.6)' : 'rgba(255,255,255,0.08)'}`, opacity: isWinner ? 1 : 0.45 }}>
                  <div className="absolute inset-0">
                    {poster
                      ? <img src={poster} alt={film.title} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-end p-3" style={{ background: 'linear-gradient(135deg,#2d1b69,#0a0a0f)' }}>
                          <p className="text-white text-xs font-semibold leading-tight">{ptTitle || film.title}</p>
                        </div>
                    }
                  </div>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }}/>
                  {isWinner && (
                    <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(255,69,58,0.9)', color: 'white' }}>🏆</div>
                  )}
                  {(() => { const uf = getMyUF(film.id); return (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWatched(film.id) }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                      style={{ background: uf?.watched ? 'rgba(255,69,58,0.9)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
                      <span className="text-[10px] font-bold" style={{ color: uf?.watched ? '#000' : 'rgba(255,255,255,0.4)' }}>{uf?.watched ? '✓' : '○'}</span>
                    </button>
                  )})()}
                  <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium leading-tight z-10"
                    style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {ptTitle || film.title}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
