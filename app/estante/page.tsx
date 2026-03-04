'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchAllMovieData } from '@/lib/tmdb'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { EasterEgg, EggType } from '@/app/components/EasterEgg'

// Novos avatares adicionados no final
const AVATARS = [
  '🎬', '🍿', '🎭', '🏆', '🎞️', '⭐', '🎪', '🎨',
  '🦁', '🎈', '🤵', '🦇', '🗼', '☕️', '🛳', '💰'
]
const AVATAR_COLORS = [
  ['#A1C4FD', '#C2E9FB'], // 🎬 Azul pastel
  ['#B5EAD7', '#83C5BE'], // 🍿 Menta pastel
  ['#FFDAC1', '#FF9AA2'], // 🎭 Pêssego/Rosa pastel
  ['#C7CEEA', '#A3B1C6'], // 🏆 Lilás/Azul acinzentado pastel
  ['#FDFD96', '#F6D365'], // 🎞️ Amarelo pastel
  ['#E0C3FC', '#8EC5FC'], // ⭐ Violeta/Azul pastel
  ['#84FAB0', '#8FD3F4'], // 🎪 Ciano pastel
  ['#E2E2E2', '#C9D6FF'], // 🎨 Cinza/Azul muito claro
  ['#A18CD1', '#FBC2EB'], // 🦁 Roxo/Rosa (Oposto ao leão)
  ['#D4FC79', '#96E6A1'], // 🎈 Verde limão (Oposto ao balão vermelho)
  ['#FBC2EB', '#A6C1EE'], // 🤵 Rosa/Azul claro pastel
  ['#FF9A9E', '#FECFEF'], // 🦇 Rosa bebê pastel (Contraste leve)
  ['#89F7FE', '#66A6FF'], // 🗼 Ciano pastel
  ['#FFECD2', '#FCB69F'], // ☕️ Coral/Pêssego
  ['#D4FC79', '#96E6A1'], // 🛳 Verde água
  ['#F3E7E9', '#E3EEFF']  // 💰 Azul e rosa ultraclaros
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

function SectionTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <p className={`text-lg font-semibold ${className}`} style={{ color: 'white' }}>{children}</p>
}

function BottomSheet({ open, onClose, children, title, onAction, actionLabel }: {
  open: boolean; onClose: () => void; children: React.ReactNode
  title?: string
  onAction?: () => void   // botão direito (ex: salvar)
  actionLabel?: string    // texto do botão direito (ex: "Concluído")
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

  // ensure props are referenced to avoid unused variable warnings
  useEffect(() => {
    // no-op: props may be used by future header button implementation
  }, [onAction, actionLabel])

  if (!open && translateY >= 100) return null

  const hasActions = !!onAction  // true = layout Apple 3 colunas

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}/>
      <div className="relative w-full rounded-t-[32px] flex flex-col overflow-hidden"
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

        {/* Gradiente sobre o conteúdo */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
          style={{ height: '100px', background: 'linear-gradient(to bottom, #0e0e14 65%, transparent 100%)' }}/>

        {/* Handle */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 z-30 pointer-events-none">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-6 z-30"
          style={{ justifyContent: hasActions ? 'space-between' : 'flex-end' }}>

          {/* Esquerda: botão fechar (sempre) */}
          <button onClick={onClose}
            className="rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{
              background: 'rgba(120,120,128,0.18)',
              backdropFilter: 'blur(48px) saturate(200%)',
              WebkitBackdropFilter: 'blur(48px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4)',
              width: 43, height: 43,
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Centro: título (só quando há ação à direita) */}
          {hasActions && title && (
            <p className="text-base font-semibold absolute left-0 right-0 text-center pointer-events-none"
              style={{ color: 'white', top: 'calc(1.5rem + 10px)' }}>
              {title}
            </p>
          )}

          {/* Sem ação: título à esquerda do X (layout original) */}
          {!hasActions && title && (
            <p className="text-lg font-semibold mr-auto ml-0 pointer-events-none"
              style={{ color: 'white', position: 'absolute', left: 20, top: 'calc(1.5rem + 10px)' }}>
              {title}
            </p>
          )}

          {/* Direita: botão de ação (Concluído / salvar) */}
          {hasActions && (
            <button onClick={onAction}
              className="rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0 text-sm font-semibold"
              style={{
                background: 'rgba(120,120,128,0.18)',
                backdropFilter: 'blur(48px) saturate(200%)',
                WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4)',
                width: 43, height: 43, color: '#fbbf24', 
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M5 12L10 17L19 7" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
            </button>
          )}
        </div>

        {/* Conteúdo */}
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

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({ display_name: null, username: null, avatar_index: 0, goal_category: 'Best Picture' })
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [userFilms, setUserFilms] = useState<UserFilm[]>([])
  const [posters, setPosters] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [activeEgg, setActiveEgg] = useState<string | null>(null) // NOVO ESTADO AQUI
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
  }, [progress, prevProgress, goalFilms.length])

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
      if (editEmail && editEmail !== '') await supabase.auth.updateUser({ email: editEmail })
      if (editPassword && editPassword !== '') await supabase.auth.updateUser({ password: editPassword })
      
      await supabase.from('user_profiles').update({ 
        display_name: editDisplayName, 
        username: editUsername,
        avatar_index: tempAvatarIndex
      }).eq('id', userId)
    }
    
    setProfile(p => ({ ...p, display_name: editDisplayName, username: editUsername, avatar_index: tempAvatarIndex }))
    setConfigMsg('Configurações salvas!')
    
    // 1. Primeiro esperamos o tempo da mensagem de sucesso
    setTimeout(() => { 
      setConfigMsg('')
      setSavingConfig(false)
      setConfigOpen(false) // Fecha o modal

      // 2. Agora, esperamos o modal sumir da tela (aprox 400ms) para disparar o ovo
      setTimeout(() => {
        const a = AVATARS[tempAvatarIndex]
        let egg = null
        if (a === '🦁') egg = 'lion'
        else if (a === '🎈') egg = 'up'
        else if (a === '🤵') egg = '007'
        else if (a === '🦇') egg = 'batman'
        else if (a === '🗼') egg = 'paris'
        else if (a === '☕️') egg = 'clube'
        else if (a === '🛳') egg = 'titanic'
        else if (a === '💰') egg = 'chefao'

        if (egg) {
          setActiveEgg(egg)
          // Define o tempo que cada animação dura antes de sumir
          const duration = (egg === 'up' || egg === 'titanic') ? 4000 : 3000
          setTimeout(() => setActiveEgg(null), duration)
        }
      }, 500) // Meio segundo após mandar fechar o modal
      
    }, 1500)
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
      <style>{`
        @keyframes lion-crown {
          0% { transform: translateY(-40px); opacity: 0; }
          20% { transform: translateY(0); opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pop-in-out {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.2); opacity: 1; }
          30% { transform: scale(1); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes titanic-sink {
          0% { transform: rotate(0deg) translateY(0); }
          30% { transform: rotate(-30deg) translateY(0); }
          80% { transform: rotate(-45deg) translateY(60px); opacity: 0; }
          100% { transform: rotate(0deg) translateY(0); opacity: 1; }
        }
        @keyframes up-fly {
          0% { transform: translateY(100vh); }
          100% { transform: translateY(-120vh); }
        }
      `}</style>

      <main className="min-h-screen pb-36" style={{ background: '#0a0a0f', color: 'white' }}>
        <div
  className="fixed top-0 left-0 right-0 pointer-events-none"
  style={{
    height: '220px', // vai até ~metade da foto de perfil
    zIndex: 0,
    background: `linear-gradient(to bottom,
      ${AVATAR_COLORS[profile.avatar_index]?.[0]}4D 0%,
      ${AVATAR_COLORS[profile.avatar_index]?.[1]}26 55%,
      transparent 100%
    )`,
    transition: 'background 0.6s ease',
  }}
/>

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

        {/* Botões flutuantes Superiores (Liquid Glass) */}
        
        {/* Botão Superior Direito (Configurações) */}
        <button onClick={() => { setTempAvatarIndex(profile.avatar_index); setConfigOpen(true); }}
          className="fixed z-[100] flex items-center justify-center rounded-full transition-all active:scale-95 pointer-events-auto"
          style={{
            background: 'rgba(120,120,128,0.18)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
            top: 'max(env(safe-area-inset-top), 45px)',
            left: '15px',
            width: '43px',
            height: '43px',
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-[2px]">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Botão Superior Direito (Configurações) */}
        <button onClick={() => setConfigOpen(true)}
          className="fixed z-[100] flex items-center justify-center rounded-full transition-all active:scale-95 pointer-events-auto"
          style={{
            background: 'rgba(120,120,128,0.18)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
            top: 'max(env(safe-area-inset-top), 45px)',
            right: '15px',
            width: '43px',
            height: '43px',
          }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="white" strokeWidth="1.8"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="white" strokeWidth="1.8"/>
          </svg>
        </button>

        {/* Perfil - Avatar e Nomes */}
          <div 
            className="flex flex-col items-center relative z-10" 
            style={{ 
              marginTop: '100px', 
              marginBottom: '33px' // <--- ADICIONE ESTA LINHA (65px / 2)
            }}
          >
            {/* Foto de Perfil */}
            <div 
              className="relative rounded-full flex items-center justify-center mb-4 shadow-2xl pointer-events-none"
              style={{ 
                width: '125px', 
                height: '125px',
                background: `linear-gradient(135deg, ${AVATAR_COLORS[profile.avatar_index]?.[0] || '#333'}, ${AVATAR_COLORS[profile.avatar_index]?.[1] || '#111'})`,
                border: '3px solid rgba(255,255,255,0.6)'
              }}>
              <span style={{ fontSize: '65px' }}>
                {AVATARS[profile.avatar_index]}
              </span>
            </div>
            
            {/* Nome de Exibição */}
            <p className="font-bold tracking-tight" style={{ fontSize: '20px', color: 'white', lineHeight: '1.2' }}>
              {profile.display_name || 'Cinéfilo'}
            </p>
            
            {/* Username */}
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
              @{profile.username || 'usuario'}
            </p>
          </div>

        <div className="px-4 flex flex-col gap-5">

          {/* Meta */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Título + Ações fora do Box */}
            <div className="flex items-center justify-between mb-3">
              <SectionTitle className={goalComplete ? "text-amber-400" : ""}>
                {goalComplete ? '🏆 Meta concluída!' : 'Minha meta'}
              </SectionTitle>
              <div className="flex items-center gap-2">
                
                {/* Dropdown Meta (Liquid Glass - 43px) */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setGoalDropdownOpen(!goalDropdownOpen)}
                    className="flex items-center gap-1.5 px-4 rounded-full text-sm font-semibold transition-all active:scale-95"
                    style={{ 
                      height: '43px', /* 85px pela metade */
                      background: 'rgba(120,120,128,0.18)', 
                      backdropFilter: 'blur(48px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                      border: '1px solid rgba(255,255,255,0.25)', 
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.9)' 
                    }}>
                    {goalLabel} <span style={{ color: 'rgba(255,255,255,0.6)' }}>▾</span>
                  </button>
                  
                  {goalDropdownOpen && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 98 }} onClick={() => setGoalDropdownOpen(false)}/>
                      <div className="absolute top-full right-0 mt-2 rounded-2xl py-2 w-52 overflow-hidden shadow-2xl" 
                        style={{ 
                          background: 'rgba(20,20,25,0.65)', 
                          backdropFilter: 'blur(48px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
                          zIndex: 99 
                        }}>
                        {GOAL_OPTIONS.map(g => (
                          <button key={g.category} onClick={() => updateGoal(g.category)}
                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors"
                            style={{ color: g.category === profile.goal_category ? '#fbbf24' : 'rgba(255,255,255,0.85)' }}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Botão Compartilhar (Liquid Glass 43px/24px) */}
                <button onClick={() => setMetaOpen(true)} 
                  className="rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                  style={{ 
                    width: '43px', height: '43px', /* 85px pela metade */
                    background: 'rgba(120,120,128,0.18)', 
                    backdropFilter: 'blur(48px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.25)', 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(255,255,255,0.1)',
                    color: 'white' 
                  }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '-2px' }}>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>

              </div>
            </div>

            {/* Box da Meta (Glass Card) */}
            <div className="rounded-3xl p-5" style={{ 
              ...glass, 
              background: goalComplete ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.06)',
              border: goalComplete ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold tabular-nums" style={{ color: goalComplete ? '#fbbf24' : 'white' }}>{watchedGoal}</span>
                <span className="text-xl mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>/ {goalFilms.length}</span>
                <span className="text-[10px] uppercase tracking-wider mb-1.5 ml-1 font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>assistidos</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress * 100}%`, background: goalComplete ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}/>
              </div>
              <p className="text-[11px] mt-3 font-medium" style={{ color: goalComplete ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.3)' }}>
                {goalComplete ? 'Você assistiu tudo! Incrível 🌟' : `${goalFilms.length - watchedGoal} ${goalFilms.length - watchedGoal === 1 ? 'falta' : 'faltam'} pra cravar a meta 🎯`}
              </p>
            </div>
          </div>

          {/* Grid filmes */}
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

      {/* Sheet Configurações */}
      {/* Settings Sheet */}
      <BottomSheet
  open={configOpen}
  onClose={() => setConfigOpen(false)}
  title="Configurações"
  onAction={saveConfig}
  actionLabel={savingConfig ? '...' : 'Concluído'}
>
        <div className="flex flex-col gap-6 px-5 pt-2">
          
          {/* Seletor de Avatar Movido pra Cá */}
          <div>
            <p className="text-sm font-semibold mb-3 text-white">Avatar</p>
            <div className="flex flex-wrap gap-3 justify-start">
              {AVATARS.map((emoji, i) => (
                <button key={i} 
                  onClick={() => setTempAvatarIndex(i)}
                  className={`w-[50px] h-[50px] rounded-full text-2xl flex items-center justify-center transition-all ${
                    tempAvatarIndex === i ? 'scale-110 ring-2 ring-white z-10 shadow-lg' : 'opacity-60 scale-95 hover:opacity-100'
                  }`}
                  style={{ 
                    background: `linear-gradient(135deg, ${AVATAR_COLORS[i][0]}, ${AVATAR_COLORS[i][1]})`,
                  }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Divisor Visual */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
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