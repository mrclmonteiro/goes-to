'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData } from '@/lib/tmdb'
import Link from 'next/link'
import Image from 'next/image'
import Spinner from '../../components/Spinner'
import { use } from 'react'

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
  'Best Documentary Short Film': 'Curta Documentário',
  'Best Animated Short Film': 'Curta Animação',
  'Best Live Action Short Film': 'Curta Ficção',
}

const AVATARS = [
  '🎬', '🍿', '🎭', '🏆', '🎞️', '⭐', '🎪', '🎨',
  '🦁', '🎈', '🤵', '🦇', '🗼', '☕️', '🛳', '💰',
  '🐶', '👵', '🐔', '👩‍🦱', '💀', '🛸', '🏊‍♀️', '🤡',
  '🦈'
]
const AVATAR_COLORS = [
  ['#A1C4FD', '#C2E9FB'], ['#B5EAD7', '#83C5BE'], ['#FFDAC1', '#FF9AA2'],
  ['#C7CEEA', '#A3B1C6'], ['#FDFD96', '#F6D365'], ['#E0C3FC', '#8EC5FC'],
  ['#84FAB0', '#8FD3F4'], ['#E2E2E2', '#C9D6FF'], ['#A18CD1', '#FBC2EB'],
  ['#D4FC79', '#96E6A1'], ['#FBC2EB', '#A6C1EE'], ['#FF9A9E', '#FECFEF'],
  ['#89F7FE', '#66A6FF'], ['#FFECD2', '#FCB69F'], ['#D4FC79', '#96E6A1'],
  ['#F3E7E9', '#E3EEFF'], ['#A1C4FD', '#C2E9FB'], ['#E0C3FC', '#8EC5FC'],
  ['#A8E6CF', '#DCEDC1'], ['#D4FC79', '#96E6A1'], ['#CFD9DF', '#E2EBF0'],
  ['#FFECD2', '#FCB69F'], ['#FFDAC1', '#FF9AA2'], ['#FBC2EB', '#A6C1EE'],
  ['#FFDAB9', '#F08080']
]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Profile = { id: string; display_name: string | null; username: string | null; avatar_index: number }
type CatRating = { film_id: string; category: string; rating: number; created_at: string | null }

function MiniStars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  return (
    <span className="inline-flex gap-px">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="9" height="9" viewBox="0 0 24 24">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={i < full ? '#FF453A' : (i === full && hasHalf) ? 'rgba(255,69,58,0.4)' : 'none'}
            stroke={i < full || (i === full && hasHalf) ? 'none' : 'rgba(255,255,255,0.18)'}
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </span>
  )
}

export default function PerfilPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [films, setFilms] = useState<Film[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [catRatings, setCatRatings] = useState<CatRating[]>([])
  const [posters, setPosters] = useState<Record<string, string | null>>({})
  const [ptTitles, setPtTitles] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) return
      // busca perfil pelo username
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, avatar_index')
        .eq('username', username)
        .maybeSingle()
      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      const [{ data: filmsData }, { data: ufData }] = await Promise.all([
        supabase.from('films').select('*'),
        supabase.from('user_films').select('film_id, watched, rating').eq('user_id', prof.id),
      ])
      const loaded = filmsData ?? []
      setFilms(loaded)
      setUserFilms(ufData ?? [])

      // notas por categoria — tenta com created_at, fallback sem
      const { data: crWithDate, error: crErr } = await supabase
        .from('user_category_ratings')
        .select('film_id, category, rating, created_at')
        .eq('user_id', prof.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (!crErr) {
        setCatRatings(crWithDate ?? [])
      } else {
        const { data: crNoDate } = await supabase
          .from('user_category_ratings')
          .select('film_id, category, rating')
          .eq('user_id', prof.id)
          .limit(50)
        setCatRatings((crNoDate ?? []).map((r: { film_id: string; category: string; rating: number }) => ({ ...r, created_at: null })))
      }

      setLoading(false)
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setPosters(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.poster])))
      setPtTitles(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.ptTitle ?? null])))
    }
    load().catch(e => console.error('[perfil] load error:', e))
  }, [username])

  const watchedFilms = films.filter(f => userFilms.find(u => u.film_id === f.id && u.watched))

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  if (notFound || !profile) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 pb-32" style={{ background: '#0a0a0f', color: 'white' }}>
      <span style={{ fontSize: 56 }}>👤</span>
      <p className="text-xl font-bold">Usuário não encontrado</p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>@{username}</p>
      <Link href="/filmes" className="mt-4 px-6 py-3 rounded-full text-sm font-semibold"
        style={{ background: 'rgba(255,69,58,0.15)', border: '1px solid rgba(255,69,58,0.3)', color: '#FF453A' }}>
        Voltar ao início
      </Link>
    </main>
  )

  const colors = AVATAR_COLORS[profile.avatar_index] ?? AVATAR_COLORS[0]
  const emoji = AVATARS[profile.avatar_index] ?? '🎬'

  return (
    <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Brilho avatar */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{
        height: 220, zIndex: 0,
        background: `linear-gradient(to bottom, ${colors[0]}4D 0%, ${colors[1]}26 55%, transparent 100%)`,
        transition: 'background 0.6s ease',
      }}/>

      {/* Botão voltar */}
      <button onClick={() => window.history.back()}
        className="lg-btn fixed z-[100] flex items-center justify-center rounded-full"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(6px) saturate(280%)',
          WebkitBackdropFilter: 'blur(6px) saturate(280%)',
          border: '1px solid transparent',
          boxShadow: 'var(--lg-shadow)',
          top: 'max(env(safe-area-inset-top), 45px)', left: 15,
          width: 44, height: 44, overflow: 'hidden',
        }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-[2px]" style={{ position: 'relative', zIndex: 3 }}>
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Cabeçalho perfil */}
      <div className="flex flex-col items-center relative z-10" style={{ marginTop: 100, marginBottom: 32 }}>
        <div className="rounded-full flex items-center justify-center mb-4"
          style={{
            width: 120, height: 120,
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            border: '3px solid rgba(255,255,255,0.55)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
          <span style={{ fontSize: 60 }}>{emoji}</span>
        </div>
        <p className="font-bold" style={{ fontSize: 26, color: 'white', lineHeight: 1.2 }}>
          {profile.display_name || profile.username || 'Cinéfilo'}
        </p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          @{profile.username}
        </p>
        <div className="flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            {watchedFilms.length}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            {watchedFilms.length === 1 ? 'filme assistido' : 'filmes assistidos'}
          </span>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-6">

        {/* Grid filmes assistidos */}
        {watchedFilms.length > 0 ? (
          <div>
            <p className="text-lg font-semibold mb-3" style={{ color: 'white' }}>
              O que {profile.display_name ?? profile.username ?? 'eles'} assistiu
            </p>
            <div className="grid grid-cols-3 gap-3">
              {watchedFilms.map(film => {
                const uf = userFilms.find(u => u.film_id === film.id)
                return (
                  <Link key={film.id} href={`/filmes/${film.id}`}
                    className="relative rounded-2xl overflow-hidden active:scale-[0.96] transition-transform duration-100"
                    style={{ aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="absolute inset-0">
                      {posters[film.title]
                        ? <Image src={posters[film.title]!} alt={ptTitles[film.title] ?? film.title} fill className="object-cover"/>
                        : <div className="w-full h-full flex items-end p-3" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                            <p className="text-white text-xs font-semibold leading-tight">{ptTitles[film.title] || film.title}</p>
                          </div>
                      }
                    </div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}/>
                    {uf?.rating != null && uf.rating > 0 && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <MiniStars rating={uf.rating} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10"
                      style={{ background: 'rgba(255,69,58,0.9)' }}>
                      <span className="text-[9px] font-bold text-black">✓</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 gap-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 40 }}>🍿</span>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum filme assistido ainda</p>
          </div>
        )}

        {/* Avaliações por categoria */}
        {catRatings.length > 0 && (
          <div>
            <p className="text-lg font-semibold mb-3" style={{ color: 'white' }}>Avaliações por categoria</p>
            <div className="flex flex-col gap-2">
              {catRatings.map((r, i) => {
                const film = films.find(f => f.id === r.film_id)
                const ptTitle = film ? (ptTitles[film.title] ?? film.title) : '?'
                const poster = film ? (posters[film.title] ?? null) : null
                const catLabel = CATEGORY_LABELS[r.category] ?? r.category
                return (
                  <Link key={i} href={`/filmes/${r.film_id}`}
                    className="flex items-center gap-3 rounded-2xl p-3 active:scale-[0.98] transition-transform duration-100"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {poster && (
                      <img src={poster} alt={ptTitle}
                        className="rounded-lg object-cover flex-shrink-0"
                        style={{ width: 36, height: 52 }}/>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {ptTitle}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{catLabel}</p>
                      <div className="mt-1"><MiniStars rating={r.rating} /></div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
