'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData } from '@/lib/tmdb'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { EasterEgg, EggType } from '@/app/components/EasterEgg'

const AVATARS = [
  '🎬', '🍿', '🎭', '🏆', '🎞️', '⭐', '🎪', '🎨',
  '🦁', '🎈', '🤵', '🦇', '🗼', '☕️', '🛳', '💰'
]
const AVATAR_COLORS = [
  ['#A1C4FD', '#C2E9FB'], ['#B5EAD7', '#83C5BE'], ['#FFDAC1', '#FF9AA2'],
  ['#C7CEEA', '#A3B1C6'], ['#FDFD96', '#F6D365'], ['#E0C3FC', '#8EC5FC'],
  ['#84FAB0', '#8FD3F4'], ['#E2E2E2', '#C9D6FF'], ['#A18CD1', '#FBC2EB'],
  ['#D4FC79', '#96E6A1'], ['#FBC2EB', '#A6C1EE'], ['#FF9A9E', '#FECFEF'],
  ['#89F7FE', '#66A6FF'], ['#FFECD2', '#FCB69F'], ['#D4FC79', '#96E6A1'],
  ['#F3E7E9', '#E3EEFF']
]

// ── metas em português + personalizada ──────────────────────────────
const GOAL_OPTIONS = [
  { label: 'Melhor Filme',   category: 'Best Picture' },
  { label: 'Atuação',        category: 'Atuação' },
  { label: 'Direção',        category: 'Best Director' },
  { label: 'Internacional',  category: 'Best International Feature' },
  { label: 'Elenco',         category: 'Best Casting' },
  { label: 'Todos os indicados', category: 'Todos' },
  { label: 'Personalizada',  category: 'custom' },
]

type Film = { id: string; title: string }
type UserFilm = { film_id: string; watched: boolean; rating: number | null }
type Nomination = { film_id: string; category: string }
type Profile = { display_name: string | null; username: string | null; avatar_index: number; goal_category: string }

function SectionTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-lg font-semibold ${className}`} style={{ color: 'white' }}>{children}</p>
}

// Liquid glass — tudo inline (Tailwind v4 interfere via CSS)
const lgStyle: React.CSSProperties = {
  background: 'rgba(120,120,128,0.18)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.25)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
}
const ddStyle: React.CSSProperties = {
  background: 'rgba(20,20,25,0.65)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
}

// ── PWA detection ────────────────────────────────────────────────────
function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false)
  useEffect(() => {
    setIsPWA(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )
  }, [])
  return isPWA
}

function detectOS(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

function InstallGate({ onClose }: { onClose: () => void }) {
  const os = detectOS()
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  function dismiss() { setVisible(false); setTimeout(onClose, 280) }
  const instructions =
    os === 'ios'
      ? 'No Safari, toque em ⬡ (Compartilhar) → "Adicionar à Tela de Início" → "Adicionar".'
      : os === 'android'
      ? 'No Chrome, toque em ⋮ (Menu) → "Adicionar à tela inicial" → "Instalar".'
      : 'No seu navegador, procure a opção "Instalar app" ou "Adicionar à tela inicial".'
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
      style={{
        backdropFilter: visible ? 'blur(18px) saturate(160%)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(18px) saturate(160%)' : 'blur(0px)',
        background: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        transition: 'backdrop-filter 0.3s ease, background 0.3s ease',
      }}
      onClick={dismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(12,12,18,0.72)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: '28px 24px 24px',
          width: '100%',
          maxWidth: 360,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
          position: 'relative',
        }}
      >
        <button onClick={dismiss}
          className="lg-btn rounded-full flex items-center justify-center"
          style={{
            position: 'absolute', top: 16, right: 16, width: 43, height: 43,
            background: 'rgba(120,120,128,0.18)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 16 }}>
          <span style={{ fontSize: 52, lineHeight: 1, display: 'block' }}>👮</span>
          <span style={{ fontSize: 26, position: 'absolute', bottom: 0, right: -4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>🔦</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.2 }}>
          Pego pelo lanterninha!
        </p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
          Para compartilhar nos Stories, você precisa adicionar o atalho do app no seu celular.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 14px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {os === 'ios' ? 'iPhone / iPad' : os === 'android' ? 'Android' : 'Como instalar'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>{instructions}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <button onClick={dismiss} className="accent-btn"
            style={{ background: 'rgba(251,191,36,0.13)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', fontSize: 15, fontWeight: 700 }}>
            OK, entendi!
          </button>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 13, cursor: 'pointer', padding: '4px' }}>
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bottom Sheet ──────────────────────────────────────────────────────
function BottomSheet({ open, onClose, children, title, onAction, actionLabel }: {
  open: boolean; onClose: () => void; children: React.ReactNode
  title?: string; onAction?: () => void; actionLabel?: string
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
  const hasActions = !!onAction

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}/>
      <div className="relative w-full rounded-t-[32px] flex flex-col overflow-hidden"
        style={{
          background: '#0e0e14',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
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
          dragStart.current = null; currentY.current = 0
        }}>

        <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 z-30 pointer-events-none">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>

        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-6 z-30"
          style={{ justifyContent: hasActions ? 'space-between' : 'flex-end' }}>
          <button onClick={onClose}
            className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
            style={{ position: 'relative', ...lgStyle, width: 43, height: 43 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {hasActions && title && (
            <p className="text-base font-semibold absolute left-0 right-0 text-center pointer-events-none"
              style={{ color: 'white', top: 'calc(1.5rem + 10px)' }}>{title}</p>
          )}
          {!hasActions && title && (
            <p className="text-lg font-semibold mr-auto ml-0 pointer-events-none"
              style={{ color: 'white', position: 'absolute', left: 20, top: 'calc(1.5rem + 10px)' }}>{title}</p>
          )}
          {hasActions && (
            <button onClick={onAction}
              className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
              style={{ position: 'relative', ...lgStyle, width: 43, height: 43 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L19 7" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
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

export default function EstantePage() {
  const router = useRouter()
  const shareRef = useRef<HTMLDivElement>(null)
  const isPWA = useIsPWA()
  const [showInstallGate, setShowInstallGate] = useState(false)
  const [iconDataUrl, setIconDataUrl] = useState<string>('')

  // meta personalizada
  const [customGoalCount, setCustomGoalCount] = useState(10)
  const [customGoalInput, setCustomGoalInput] = useState('10')

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({ display_name: null, username: null, avatar_index: 0, goal_category: 'Best Picture' })
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [posters, setPosters] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [activeEgg, setActiveEgg] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)
  const [prevProgress, setPrevProgress] = useState(0)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState('')
  const [tempAvatarIndex, setTempAvatarIndex] = useState(0)

  // Pre-load app icon as base64 for html2canvas
  useEffect(() => {
    fetch('/icon.png')
      .then(r => r.blob())
      .then(blob => new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      }))
      .then(setIconDataUrl)
      .catch(() => {})
  }, [])

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
  }, [router])

  const filmCategories = (filmId: string) => nominations.filter(n => n.film_id === filmId).map(n => n.category)

  const isCustomGoal = profile.goal_category === 'custom'

  const goalFilms = isCustomGoal
    ? films
    : films.filter(f => {
        const cats = filmCategories(f.id)
        if (profile.goal_category === 'Todos') return true
        if (profile.goal_category === 'Atuação') return cats.some(c => c.includes('Actor') || c.includes('Actress'))
        return cats.includes(profile.goal_category)
      })

  const watchedGoal = goalFilms.filter(f => userFilms.find(u => u.film_id === f.id && u.watched)).length
  const customTarget = isCustomGoal ? customGoalCount : goalFilms.length
  const progress = customTarget > 0 ? Math.min(watchedGoal / customTarget, 1) : 0
  const goalComplete = progress >= 1 && customTarget > 0
  const watchedFilms = films.filter(f => userFilms.find(u => u.film_id === f.id && u.watched))

  const goalLabel = isCustomGoal
    ? `${customGoalCount} filmes`
    : (GOAL_OPTIONS.find(g => g.category === profile.goal_category)?.label ?? 'Melhor Filme')

  useEffect(() => {
    if (progress === 1 && prevProgress < 1 && customTarget > 0) {
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000)
    }
    setPrevProgress(progress)
  }, [progress, prevProgress, customTarget])

  async function updateGoal(cat: string) {
    if (!userId) return
    const supabase = createClient()
    if (!supabase) return
    setProfile(p => ({ ...p, goal_category: cat })); setGoalDropdownOpen(false)
    await supabase.from('user_profiles').update({ goal_category: cat }).eq('id', userId)
  }

  async function saveConfig() {
    if (!userId) return
    setSavingConfig(true)
    const supabase = createClient()
    if (supabase) {
      if (editEmail) await supabase.auth.updateUser({ email: editEmail })
      if (editPassword) await supabase.auth.updateUser({ password: editPassword })
      await supabase.from('user_profiles').update({
        display_name: editDisplayName,
        username: editUsername,
        avatar_index: tempAvatarIndex
      }).eq('id', userId)
    }
    setProfile(p => ({ ...p, display_name: editDisplayName, username: editUsername, avatar_index: tempAvatarIndex }))
    setConfigMsg('Configurações salvas!')
    setTimeout(() => {
      setConfigMsg('')
      setSavingConfig(false)
      setConfigOpen(false)
      setTimeout(() => {
        const a = AVATARS[tempAvatarIndex]
        const eggMap: Record<string, string> = {
          '🦁': 'lion', '🎈': 'up', '🤵': '007', '🦇': 'batman',
          '🗼': 'paris', '☕️': 'clube', '🛳': 'titanic', '💰': 'chefao'
        }
        const egg = eggMap[a]
        if (egg) {
          setActiveEgg(egg)
          setTimeout(() => setActiveEgg(null), egg === 'up' || egg === 'titanic' ? 4000 : 3000)
        }
      }, 500)
    }, 1500)
  }

  async function shareGoal() {
    if (!isPWA) { setShowInstallGate(true); return }
    if (!shareRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(shareRef.current, {
      backgroundColor: '#0a0a0f', scale: 3, useCORS: false, allowTaint: false, logging: false,
      onclone: (doc: Document) => { doc.documentElement.style.fontFeatureSettings = 'normal' },
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
      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(360deg); }
        }
      `}</style>

      <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>

        {/* Avatar color light */}
        <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{
          height: '220px', zIndex: 0,
          background: `linear-gradient(to bottom,
            ${AVATAR_COLORS[profile.avatar_index]?.[0]}4D 0%,
            ${AVATAR_COLORS[profile.avatar_index]?.[1]}26 55%,
            transparent 100%)`,
          transition: 'background 0.6s ease',
        }}/>

        {/* Confetti */}
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

        <EasterEgg egg={activeEgg as EggType} />

        {/* Botão voltar */}
        <button onClick={() => router.back()}
          className="lg-btn fixed z-[100] flex items-center justify-center rounded-full pointer-events-auto"
          style={{ ...lgStyle, top: 'max(env(safe-area-inset-top), 45px)', left: '15px', width: '43px', height: '43px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-[2px]">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Botão configurações */}
        <button onClick={() => { setTempAvatarIndex(profile.avatar_index); setConfigOpen(true) }}
          className="lg-btn fixed z-[100] flex items-center justify-center rounded-full pointer-events-auto"
          style={{ ...lgStyle, top: 'max(env(safe-area-inset-top), 45px)', right: '15px', width: '43px', height: '43px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="white" strokeWidth="1.8"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="white" strokeWidth="1.8"/>
          </svg>
        </button>

        {/* Perfil */}
        <div className="flex flex-col items-center relative z-10" style={{ marginTop: '100px', marginBottom: '33px' }}>
          <div className="relative rounded-full flex items-center justify-center mb-4 shadow-2xl pointer-events-none"
            style={{
              width: '125px', height: '125px',
              background: `linear-gradient(135deg, ${AVATAR_COLORS[profile.avatar_index]?.[0] || '#333'}, ${AVATAR_COLORS[profile.avatar_index]?.[1] || '#111'})`,
              border: '3px solid rgba(255,255,255,0.6)'
            }}>
            <span style={{ fontSize: '65px' }}>{AVATARS[profile.avatar_index]}</span>
          </div>
          <p className="font-bold tracking-tight" style={{ fontSize: '20px', color: 'white', lineHeight: '1.2' }}>
            {profile.display_name || 'Cinéfilo'}
          </p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
            @{profile.username || 'usuario'}
          </p>
        </div>

        <div className="px-4 flex flex-col gap-5">

          {/* Meta */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle className={goalComplete ? 'text-amber-400' : ''}>
                {goalComplete ? '🏆 Meta concluída!' : 'Minha meta'}
              </SectionTitle>
              <div className="flex items-center gap-2">

                {/* Dropdown Meta */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setGoalDropdownOpen(!goalDropdownOpen)}
                    className="lg-btn flex items-center gap-1.5 px-4 rounded-full text-sm font-semibold"
                    style={{ position: 'relative', ...lgStyle, height: 43, color: 'rgba(255,255,255,0.9)' }}>
                    {goalLabel} <span style={{ color: 'rgba(255,255,255,0.45)' }}>▾</span>
                  </button>
                  {goalDropdownOpen && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 98 }} onClick={() => setGoalDropdownOpen(false)}/>
                      <div className="absolute top-full right-0 mt-2 rounded-2xl py-2 w-52 overflow-hidden"
                        style={{ ...ddStyle, zIndex: 99 }}>
                        {GOAL_OPTIONS.map(g => (
                          <div key={g.category}>
                            <button onClick={() => updateGoal(g.category)}
                              className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors"
                              style={{ color: g.category === profile.goal_category ? '#fbbf24' : 'rgba(255,255,255,0.85)' }}>
                              {g.label}
                            </button>
                            {/* Input numérico inline para meta personalizada */}
                            {g.category === 'custom' && profile.goal_category === 'custom' && (
                              <div className="px-4 pb-3 flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1} max={999}
                                  value={customGoalInput}
                                  onChange={e => {
                                    setCustomGoalInput(e.target.value)
                                    const n = parseInt(e.target.value)
                                    if (!isNaN(n) && n > 0) setCustomGoalCount(n)
                                  }}
                                  className="rounded-lg px-3 py-1.5 text-sm text-right"
                                  style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'white', outline: 'none', width: 72
                                  }}
                                />
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>filmes</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Compartilhar meta */}
                <button onClick={() => setMetaOpen(true)}
                  className="lg-btn rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ ...lgStyle, width: 43, height: 43, color: 'white' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '-2px' }}>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Box da Meta */}
            <div className="rounded-3xl p-5" style={{
              ...glass,
              background: goalComplete ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.06)',
              border: goalComplete ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold tabular-nums" style={{ color: goalComplete ? '#fbbf24' : 'white' }}>{watchedGoal}</span>
                <span className="text-xl mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>/ {customTarget}</span>
                <span className="text-[10px] uppercase tracking-wider mb-1.5 ml-1 font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>assistidos</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress * 100}%`, background: goalComplete ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}/>
              </div>
              <p className="text-[11px] mt-3 font-medium" style={{ color: goalComplete ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.3)' }}>
                {goalComplete
                  ? 'Você assistiu tudo! Incrível 🌟'
                  : `${customTarget - watchedGoal} ${customTarget - watchedGoal === 1 ? 'falta' : 'faltam'} pra cravar a meta 🎯`}
              </p>
            </div>
          </div>

          {/* Grid filmes assistidos */}
          {watchedFilms.length > 0 ? (
            <div>
              <SectionTitle className="mb-3">O que você assistiu</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {watchedFilms.map(film => {
                  const uf = userFilms.find(u => u.film_id === film.id)
                  return (
                    <Link key={film.id} href={`/filmes/${film.id}`} className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '2/3' }}>
                      <div className="absolute inset-0">
                        {posters[film.title]
                          ? <Image src={posters[film.title]!} alt={film.title} fill className="object-cover" />
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

      {/* ── Sheet Configurações ──────────────────────────────────── */}
      <BottomSheet open={configOpen} onClose={() => setConfigOpen(false)} title="Configurações"
        onAction={saveConfig} actionLabel={savingConfig ? '...' : 'Concluído'}>
        <div className="flex flex-col gap-6 px-5 pt-2">
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Avatar</p>
            <div className="flex flex-wrap gap-3 justify-start">
              {AVATARS.map((emoji, i) => (
                <button key={i} onClick={() => setTempAvatarIndex(i)}
                  className={`w-[50px] h-[50px] rounded-full text-2xl flex items-center justify-center transition-all ${
                    tempAvatarIndex === i ? 'scale-110 ring-2 ring-white z-10 shadow-lg' : 'opacity-60 scale-95 hover:opacity-100'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${AVATAR_COLORS[i][0]}, ${AVATAR_COLORS[i][1]})` }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
          <div className="form-rows">
            {[
              { label: 'Nome', value: editDisplayName, onChange: setEditDisplayName, placeholder: 'Como quer ser chamado', type: 'text' },
              { label: 'Usuário', value: editUsername, onChange: setEditUsername, placeholder: '@usuario', type: 'text' },
              { label: 'Email', value: editEmail, onChange: setEditEmail, placeholder: 'email@exemplo.com', type: 'email' },
              { label: 'Senha', value: editPassword, onChange: setEditPassword, placeholder: '••••••••', type: 'password' },
            ].map(field => (
              <div key={field.label} className="form-row">
                <span className="form-row-label">{field.label}</span>
                <input type={field.type} value={field.value} onChange={e => field.onChange(e.target.value)}
                  placeholder={field.placeholder} className="form-row-input"/>
              </div>
            ))}
          </div>
          {configMsg && (
            <p className="text-xs text-center font-medium" style={{ color: 'rgba(251,191,36,0.8)' }}>{configMsg}</p>
          )}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
          <button onClick={async () => { const sb = createClient(); if (sb) await sb.auth.signOut(); router.push('/') }}
            className="w-full py-3.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.2)', color: 'rgba(255,99,88,0.9)' }}>
            Sair da conta
          </button>
        </div>
      </BottomSheet>

      {/* ── Sheet Meta + Share ───────────────────────────────────── */}
      <BottomSheet open={metaOpen} onClose={() => setMetaOpen(false)} title="Minha Meta">
        <div className="px-5 py-4 flex flex-col gap-5">

          {/* ── Card Story 9:16 ── */}
          {/* Wrapper visual: cantos arredondados só na UI */}
          <div style={{ borderRadius: 24, overflow: 'hidden', width: '100%', aspectRatio: '9/16' }}>
          <div ref={shareRef}
            style={{
              width: '100%', height: '100%',
              background: bgGradient,
              borderRadius: 0,
              display: 'flex', flexDirection: 'column',
              padding: '36px 28px',
              position: 'relative',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>

            {/* Orbes decorativos */}
            <div style={{
              position: 'absolute', top: '-8%', right: '-12%',
              width: '65%', height: '40%', borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
              filter: 'blur(40px)', pointerEvents: 'none',
            }}/>
            <div style={{
              position: 'absolute', bottom: '10%', left: '-15%',
              width: '55%', height: '30%', borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
              filter: 'blur(32px)', pointerEvents: 'none',
            }}/>

            {/* Topo: ícone do app */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)', flexShrink: 0,
              }}>
                {iconDataUrl
                  ? <img src={iconDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }}/>
                }
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Goes To...</p>
            </div>

            {/* Perfil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 99,
                background: `${accentColor}22`,
                border: `2px solid ${accentColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>
                {AVATARS[profile.avatar_index]}
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                  {profile.display_name ?? 'Cinéfilo'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Conteúdo central */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

              {goalComplete ? (
                /* ── CELEBRAÇÃO ────────────────────────────────── */
                <>
                  <p style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))', lineHeight: 1 }}>
                    🏆✨
                  </p>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: `${accentColor}99`, marginBottom: 12,
                  }}>
                    Meta concluída!
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: 8 }}>
                    Assisti todos os <span style={{ color: accentColor }}>{customTarget}</span> filmes da minha meta
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 28 }}>
                    {goalLabel} · Oscar 2026
                  </p>

                  {/* Barra cheia dourada */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Progresso</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: accentColor }}>100%</p>
                    </div>
                    <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, width: '100%',
                        background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)',
                        boxShadow: '0 0 12px rgba(251,191,36,0.5)',
                      }}/>
                    </div>
                  </div>

                  <p style={{ fontSize: 28, letterSpacing: 6, textAlign: 'center' }}>🌟🎬🌟🎬🌟</p>
                </>
              ) : (
                /* ── PROGRESSO ─────────────────────────────────── */
                <>
                  

                  <p style={{ fontSize: 21, fontWeight: 800, color: 'white', lineHeight: 1.35, marginBottom: 28 }}>
                    Já bati{' '}
                    <span style={{ color: accentColor }}>{watchedGoal}/{customTarget}</span>
                    {' '}da minha meta de{' '}
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{goalLabel}</span>
                    {' '}dos indicados ao Oscar 2026
                  </p>

                  {/* Barra de progresso */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Progresso</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: accentColor }}>{Math.round(progress * 100)}%</p>
                    </div>
                    {/* Track */}
                    <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${progress * 100}%`,
                        background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
                      }}/>
                    </div>
                    {/* Tick marks */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      {[0, 25, 50, 75, 100].map(pct => (
                        <p key={pct} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{pct}%</p>
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {customTarget - watchedGoal} {customTarget - watchedGoal === 1 ? 'falta' : 'faltam'} pra cravar 🎯
                  </p>
                </>
              )}
            </div>

            {/* Rodapé */}
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 24, letterSpacing: '0.05em' }}>
              goes-to.vercel.app
            </p>
          </div>
          </div>{/* end visual wrapper */}

          <button onClick={shareGoal}
            className="w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Compartilhar nos Instagram Stories
          </button>
        </div>
      </BottomSheet>

      {showInstallGate && <InstallGate onClose={() => setShowInstallGate(false)} />}
    </>
  )
}