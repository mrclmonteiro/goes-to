'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData } from '@/lib/tmdb'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

const AVATARS = ['🎬', '🍿', '🎭', '🏆', '🎞️', '⭐', '🎪', '🎨']
const AVATAR_COLORS = [
  ['#1a0533','#0a0a0f'],['#1a0a00','#0a0a0f'],['#001a1a','#0a0a0f'],
  ['#1a1500','#0a0a0f'],['#0a001a','#0a0a0f'],['#1a1a00','#0a0a0f'],
  ['#001a0a','#0a0a0f'],['#1a000a','#0a0a0f'],
]
const GOAL_OPTIONS = [
  { label: 'Best Picture', category: 'Best Picture' },
  { label: 'Atuação', category: 'Atuação' },
  { label: 'Direção', category: 'Best Director' },
  { label: 'Internacional', category: 'Best International Feature' },
  { label: 'Animação', category: 'Best Animated Feature' },
  { label: 'Todos os indicados', category: 'Todos' },
]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Nomination = { film_id: string; category: string }
type Profile = { display_name: string | null; username: string | null; avatar_index: number; goal_category: string }

function BottomSheet({ open, onClose, children, title }: {
  open: boolean; onClose: () => void; children: React.ReactNode; title?: string
}) {
  const [translateY, setTranslateY] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<number | null>(null)
  const currentY = useRef(0)

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; requestAnimationFrame(() => setTranslateY(0)) }
    else { setTranslateY(100); document.body.style.overflow = '' }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open && translateY >= 100) return null

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}/>
      <div className="relative w-full rounded-t-[32px] flex flex-col"
        style={{
          background: '#0e0e14', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
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
          dragStart.current = null
        }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div className="w-9"/>
          {title && <p className="text-sm font-semibold" style={{ color: 'white' }}>{title}</p>}
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
        <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function EstantePage() {
  const router = useRouter()
  const shareRef = useRef<HTMLDivElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({ display_name: null, username: null, avatar_index: 0, goal_category: 'Best Picture' })
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [posters, setPosters] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [prevProgress, setPrevProgress] = useState(0)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) { router.push('/'); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      setEditEmail(user.email ?? '')
      const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
      if (profileData) {
        setProfile(profileData)
        setEditDisplayName(profileData.display_name ?? '')
        setEditUsername(profileData.username ?? '')
      } else {
        const np = { id: user.id, display_name: 'Cinéfilo', username: user.email?.split('@')[0], avatar_index: 0, goal_category: 'Best Picture' }
        await supabase.from('user_profiles').insert(np)
        setProfile({ display_name: 'Cinéfilo', username: user.email?.split('@')[0] ?? null, avatar_index: 0, goal_category: 'Best Picture' })
        setEditDisplayName('Cinéfilo'); setEditUsername(user.email?.split('@')[0] ?? '')
      }
      const { data: filmsData } = await supabase.from('films').select('*')
      const { data: nomsData } = await supabase.from('nominations').select('*')
      const { data: ufData } = await supabase.from('user_films').select('*').eq('user_id', user.id)
      const loaded = filmsData ?? []
      setFilms(loaded); setNominations(nomsData ?? []); setUserFilms(ufData ?? [])
      setLoading(false)
      const data = await fetchAllMovieData(loaded.map((f: Film) => f.title))
      setPosters(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.poster])))
    }
    load()
  }, [])

  const filmCategories = (filmId: string) => nominations.filter(n => n.film_id === filmId).map(n => n.category)
  const goalFilms = films.filter(f => {
    const cats = filmCategories(f.id)
    if (profile.goal_category === 'Todos') return true
    if (profile.goal_category === 'Atuação') return cats.some(c => c.includes('Actor') || c.includes('Actress'))
    return cats.includes(profile.goal_category)
  })
  const watchedGoal = goalFilms.filter(f => userFilms.find(u => u.film_id === f.id && u.watched)).length
  const progress = goalFilms.length > 0 ? watchedGoal / goalFilms.length : 0
  const goalComplete = progress >= 1 && goalFilms.length > 0
  const watchedFilms = films.filter(f => userFilms.find(u => u.film_id === f.id && u.watched))

  useEffect(() => {
    if (progress === 1 && prevProgress < 1 && goalFilms.length > 0) {
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000)
    }
    setPrevProgress(progress)
  }, [progress])

  async function updateGoal(cat: string) {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return

    setProfile(p => ({ ...p, goal_category: cat })); setGoalDropdownOpen(false)
    await supabase.from('user_profiles').update({ goal_category: cat }).eq('id', userId)
  }

  async function updateAvatar(dir: 1 | -1) {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return

    const next = (profile.avatar_index + dir + AVATARS.length) % AVATARS.length
    setProfile(p => ({ ...p, avatar_index: next }))
    await supabase.from('user_profiles').update({ avatar_index: next }).eq('id', userId)
  }

  async function saveConfig() {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return

    setSavingConfig(true); setConfigMsg('')
    await supabase.from('user_profiles').update({ display_name: editDisplayName, username: editUsername }).eq('id', userId)
    setProfile(p => ({ ...p, display_name: editDisplayName, username: editUsername }))
    if (editPassword.length >= 6) {
      const { error } = await supabase.auth.updateUser({ password: editPassword })
      if (error) { setConfigMsg('Erro ao atualizar senha'); setSavingConfig(false); return }
    }
    setConfigMsg('Salvo!'); setSavingConfig(false)
    setTimeout(() => { setConfigMsg(''); setConfigOpen(false) }, 1200)
  }

  async function shareGoal() {
    if (!shareRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(shareRef.current, {
      backgroundColor: null, scale: 3, useCORS: false, allowTaint: false, logging: false,
    })
    canvas.toBlob(async blob => {
      if (!blob) return
      const file = new File([blob], 'goes-to-oscar2026.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Goes To... · Oscar 2026' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'goes-to-oscar2026.png'; a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  const glass = {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
  }
  const avatarColors = AVATAR_COLORS[profile.avatar_index]
  const goalLabel = GOAL_OPTIONS.find(g => g.category === profile.goal_category)?.label ?? 'Best Picture'
  const accentColor = goalComplete ? '#fbbf24' : '#a78bfa'
  const bgGradient = goalComplete
    ? 'linear-gradient(160deg, #78350f 0%, #451a03 55%, #0a0a0f 100%)'
    : 'linear-gradient(160deg, #1e1b4b 0%, #0f0c29 55%, #0a0a0f 100%)'

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p className="text-sm animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p>
    </main>
  )

  return (
    <>
      <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

        {showConfetti && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {Array.from({ length: 60 }, (_, i) => (
              <div key={i} className="absolute" style={{
                left: `${Math.random() * 100}%`, top: '-10%', width: 8, height: 8,
                borderRadius: Math.random() > 0.5 ? '50%' : 2,
                background: ['#fbbf24','#f59e0b','#ffffff','#a78bfa','#60a5fa'][i % 5],
                animation: `fall ${1 + Math.random() * 2}s ${Math.random() * 2}s linear forwards`,
              }}/>
            ))}
          </div>
        )}

        {/* Botões flutuantes */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pointer-events-none"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 12 }}>
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center pointer-events-auto"
            style={{ background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => setConfigOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center pointer-events-auto"
            style={{ background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="white" strokeWidth="1.8"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="white" strokeWidth="1.8"/>
            </svg>
          </button>
        </div>

        {/* Hero perfil */}
        <div className="relative pt-16 pb-8 flex flex-col items-center px-4"
          style={{ background: `linear-gradient(to bottom, ${avatarColors[0]}99, transparent)` }}>
          <div className="relative mb-4 flex items-center gap-3">
            {editingAvatar && (
              <button onClick={() => updateAvatar(-1)} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ background: goalComplete ? 'rgba(251,191,36,0.2)' : `${avatarColors[0]}88`, border: `2.5px solid ${goalComplete ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.2)'}` }}>
                {AVATARS[profile.avatar_index]}
              </div>
              <button onClick={() => setEditingAvatar(!editingAvatar)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                {editingAvatar ? '✓' : '✏️'}
              </button>
            </div>
            {editingAvatar && (
              <button onClick={() => updateAvatar(1)} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          <div className="text-center mt-2">
            <p className="text-xl font-bold">{profile.display_name ?? 'Cinéfilo'}</p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>@{profile.username ?? 'usuário'}</p>
          </div>
          <div className="flex gap-8 mt-6">
            {[
              { v: watchedFilms.length, l: 'assistidos', gold: false },
              { v: userFilms.filter(u => u.rating).length, l: 'avaliados', gold: false },
              { v: `${Math.round(progress * 100)}%`, l: 'da meta', gold: goalComplete },
            ].map(({ v, l, gold }) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-bold" style={{ color: gold ? '#fbbf24' : 'white' }}>{v}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 flex flex-col gap-5">

          {/* Meta */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="rounded-3xl p-5" style={{ ...glass, ...(goalComplete ? { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' } : {}) }}>
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: goalComplete ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.4)' }}>
                  {goalComplete ? '🏆 Meta concluída!' : 'Minha meta'}
                </p>
                <div className="flex items-center gap-2">
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setGoalDropdownOpen(!goalDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                      {goalLabel} <span style={{ color: 'rgba(255,255,255,0.4)' }}>▾</span>
                    </button>
                    {goalDropdownOpen && (
                      <>
                        <div className="fixed inset-0" style={{ zIndex: 98 }} onClick={() => setGoalDropdownOpen(false)}/>
                        <div className="absolute top-full right-0 mt-2 rounded-2xl py-2 w-52" style={{ ...glass, background: 'rgba(14,14,20,0.98)', zIndex: 99 }}>
                          {GOAL_OPTIONS.map(g => (
                            <button key={g.category} onClick={() => updateGoal(g.category)}
                              className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5"
                              style={{ color: g.category === profile.goal_category ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => setMetaOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold tabular-nums" style={{ color: goalComplete ? '#fbbf24' : 'white' }}>{watchedGoal}</span>
                <span className="text-xl mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>/ {goalFilms.length}</span>
                <span className="text-sm mb-1 ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>assistidos</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress * 100}%`, background: goalComplete ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}/>
              </div>
              <p className="text-xs mt-2" style={{ color: goalComplete ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.25)' }}>
                {goalComplete ? 'Você assistiu tudo! Incrível 🌟' : `${goalFilms.length - watchedGoal} ${goalFilms.length - watchedGoal === 1 ? 'falta' : 'faltam'} pra cravar a meta 🎯`}
              </p>
            </div>
          </div>

          {/* Grid filmes */}
          {watchedFilms.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>O que você assistiu</p>
              <div className="grid grid-cols-3 gap-3">
                {watchedFilms.map(film => {
                  const uf = userFilms.find(u => u.film_id === film.id)
                  return (
                    <Link key={film.id} href={`/filmes/${film.id}`} className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '2/3' }}>
                      <div className="absolute inset-0">
                        {posters[film.title]
                          ? <img src={posters[film.title]!} alt={film.title} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-end p-3" style={{ background: 'linear-gradient(135deg, #2d1b69, #0a0a0f)' }}>
                              <p className="text-white text-xs font-semibold leading-tight">{film.title}</p>
                            </div>
                        }
                      </div>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}/>
                      {uf?.rating && <p className="absolute bottom-2 left-3 text-xs z-10" style={{ color: '#fbbf24' }}>{'★'.repeat(uf.rating)}</p>}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.9)' }}>
                        <span className="text-[10px] font-bold text-black">✓</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 gap-4">
              <span className="text-6xl">🍿</span>
              <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Sua estante está vazia</p>
              <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>Que tal explorar os indicados?</p>
              <Link href="/filmes" className="mt-2 px-5 py-3 rounded-full text-sm font-semibold"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                Ver indicados a Melhor Filme
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Sheet Configurações */}
      <BottomSheet open={configOpen} onClose={() => setConfigOpen(false)} title="Configurações">
        <div className="px-5 py-4 flex flex-col gap-5">
          {[
            { label: 'Nome de exibição', value: editDisplayName, onChange: setEditDisplayName, placeholder: 'Como você quer ser chamado' },
            { label: 'Nome de usuário', value: editUsername, onChange: setEditUsername, placeholder: '@usuario' },
            { label: 'Email', value: editEmail, onChange: setEditEmail, placeholder: 'email@exemplo.com', type: 'email' },
            { label: 'Nova senha', value: editPassword, onChange: setEditPassword, placeholder: 'Deixe em branco pra manter', type: 'password' },
          ].map(field => (
            <div key={field.label}>
              <p className="text-xs mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{field.label}</p>
              <input type={field.type ?? 'text'} value={field.value} onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder} className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}/>
            </div>
          ))}
          {configMsg && <p className="text-xs text-center font-medium" style={{ color: '#fbbf24' }}>{configMsg}</p>}
          <button onClick={saveConfig} disabled={savingConfig} className="w-full py-3.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(251,191,36,0.9)', color: '#1a0e00' }}>
            {savingConfig ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
          <button onClick={async () => { const sb = createClient(); if (sb) await sb.auth.signOut(); router.push('/') }}
            className="w-full py-3.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.2)', color: 'rgba(255,99,88,0.9)' }}>
            Sair da conta
          </button>
        </div>
      </BottomSheet>

      {/* Sheet Meta + Share */}
      <BottomSheet open={metaOpen} onClose={() => setMetaOpen(false)} title="Minha Meta">
        <div className="px-5 py-4 flex flex-col gap-5">

          {/* Card Story 9:16 — estilo checklist, sem imagens */}
          <div ref={shareRef}
            style={{
              width: '100%', aspectRatio: '9/16',
              background: bgGradient,
              borderRadius: 24, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              padding: '32px 28px', gap: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>

            {/* Topo */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: `${accentColor}99`, marginBottom: 16 }}>
                Goes To... · Oscar 2026
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 99, background: `${accentColor}22`, border: `2px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {AVATARS[profile.avatar_index]}
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{profile.display_name ?? 'Cinéfilo'}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>@{profile.username}</p>
                </div>
              </div>
            </div>

            {/* Barra progresso */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{goalLabel}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: accentColor, lineHeight: 1 }}>{Math.round(progress * 100)}%</p>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${progress * 100}%`, background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})` }}/>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                {watchedGoal} de {goalFilms.length} assistidos {goalComplete ? '🏆' : ''}
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }}/>

            {/* Lista checklist */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
              {goalFilms.slice(0, 12).map((film, i) => {
                const uf = userFilms.find(u => u.film_id === film.id)
                const watched = uf?.watched ?? false
                const rating = uf?.rating ?? 0
                return (
                  <div key={film.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 0',
                    borderBottom: i < Math.min(goalFilms.length, 12) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    {/* Checkbox */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                      background: watched ? accentColor : 'rgba(255,255,255,0.08)',
                      border: watched ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {watched && <span style={{ fontSize: 10, fontWeight: 900, color: '#1a0a00' }}>✓</span>}
                    </div>
                    {/* Título */}
                    <p style={{
                      flex: 1, fontSize: 12, fontWeight: watched ? 600 : 400,
                      color: watched ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                      lineHeight: 1.3,
                      textDecoration: !watched ? 'none' : 'none',
                    }}>
                      {film.title}
                    </p>
                    {/* Estrelas */}
                    {rating > 0 && (
                      <p style={{ fontSize: 10, color: accentColor, flexShrink: 0 }}>{'★'.repeat(rating)}</p>
                    )}
                  </div>
                )
              })}
              {goalFilms.length > 12 && (
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', paddingTop: 8 }}>+{goalFilms.length - 12} filmes</p>
              )}
            </div>

            {/* Rodapé */}
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 20 }}>goesto.app</p>
          </div>

          {/* Botão compartilhar */}
          <button onClick={shareGoal} className="w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Compartilhar nos Instagram Stories
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
