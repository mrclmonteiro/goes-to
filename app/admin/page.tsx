'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ORDERED_CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'
import Spinner from '../components/Spinner'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

const lgStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(6px) saturate(280%)',
  WebkitBackdropFilter: 'blur(6px) saturate(280%)',
  border: '1px solid transparent',
  boxShadow: 'var(--lg-shadow)',
}

type Film = { id: string; title: string }
type Nomination = { id?: string; film_id: string; category: string; nominee: string | null; winner: boolean }

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [saving, setSaving] = useState<string | null>(null) // film_id+category being saved
  const [selectedCat, setSelectedCat] = useState<string>(ORDERED_CATEGORIES[0])
  const [pushTitle, setPushTitle] = useState('')
  const [pushMessage, setPushMessage] = useState('')
  const [pushSending, setPushSending] = useState(false)
  const [pushResult, setPushResult] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // onAuthStateChange é o único método 100% confiável para capturar o token
  // getSession/refreshSession podem retornar null dependendo do contexto
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_: AuthChangeEvent, session: Session | null) => {
      if (session?.access_token) setAccessToken(session.access_token)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) { router.replace('/'); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      // refreshSession garante token fresco (getSession pode retornar null no admin)
      const { data: { session } } = await supabase.auth.refreshSession()
      if (session?.access_token) setAccessToken(session.access_token)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.is_admin) { router.replace('/'); return }

      setAuthorized(true)

      const [{ data: filmsData }, { data: nomsData }] = await Promise.all([
        supabase.from('films').select('id, title'),
        supabase.from('nominations').select('film_id, category, nominee, winner'),
      ])
      setFilms(filmsData ?? [])
      setNominations(nomsData ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function toggleWinner(filmId: string, category: string, currentWinner: boolean) {
    const key = `${filmId}-${category}`
    setSaving(key)
    const supabase = createClient()
    if (!supabase) return

    await supabase
      .from('nominations')
      .update({ winner: !currentWinner })
      .eq('film_id', filmId)
      .eq('category', category)

    setNominations(prev =>
      prev.map(n =>
        n.film_id === filmId && n.category === category
          ? { ...n, winner: !currentWinner }
          : n
      )
    )
    setSaving(null)
  }

  async function sendPush() {
    if (!pushTitle.trim() || !pushMessage.trim()) return
    if (!accessToken) { setPushResult('Erro: sessão não carregada, recarregue a página'); return }
    setPushSending(true)
    setPushResult(null)
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: pushTitle.trim(), message: pushMessage.trim(), url: '/filmes' }),
      })
      const data = await res.json()
      if (res.ok) {
        setPushResult(`✓ Enviado para ${data.sent} dispositivo(s)`)
        setPushTitle('')
        setPushMessage('')
      } else {
        setPushResult(`Erro: ${data.error}`)
      }
    } catch {
      setPushResult('Erro ao enviar')
    } finally {
      setPushSending(false)
    }
  }

  const noms = nominations.filter(n => n.category === selectedCat)

  if (loading || !authorized) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  return (
    <main className="min-h-screen pb-24" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Back button — fixed, liquid glass */}
      <button
        onClick={() => router.back()}
        className="lg-btn fixed z-[100] flex items-center justify-center rounded-full"
        style={{ ...lgStyle, top: 'max(env(safe-area-inset-top), 45px)', left: 15, width: 44, height: 44, overflow: 'hidden' }}
      >
        <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 2 }} />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-[2px]" style={{ position: 'relative', zIndex: 3 }}>
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Header */}
      <div className="px-4 pt-[max(calc(env(safe-area-inset-top)+60px),90px)] pb-4">
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>

      {/* Push Notifications — topo */}
      <div className="px-4 mb-6">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Enviar notificação push
        </p>
        <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <input
            value={pushTitle}
            onChange={e => setPushTitle(e.target.value)}
            placeholder="Título"
            maxLength={80}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
          <textarea
            value={pushMessage}
            onChange={e => setPushMessage(e.target.value)}
            placeholder="Mensagem"
            maxLength={200}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
          <button
            onClick={sendPush}
            disabled={pushSending || !pushTitle.trim() || !pushMessage.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: pushSending || !pushTitle.trim() || !pushMessage.trim()
                ? 'rgba(255,69,58,0.3)'
                : '#FF453A',
              color: 'white',
              opacity: pushSending ? 0.7 : 1,
            }}
          >
            {pushSending ? 'Enviando…' : '🔔 Enviar para todos'}
          </button>
          {pushResult && (
            <p className="text-xs text-center" style={{ color: pushResult.startsWith('✓') ? '#34C759' : '#FF453A' }}>
              {pushResult}
            </p>
          )}
        </div>
      </div>

          
      {/* Category picker */}
      <div className="px-4 mb-6">
        <div className="flex flex-col gap-1">
          {ORDERED_CATEGORIES.map(cat => {
            const winnerCount = nominations.filter(n => n.category === cat && n.winner).length
            const isSelected = cat === selectedCat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors"
                style={{
                  background: isSelected ? 'rgba(255,69,58,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isSelected ? 'rgba(255,69,58,0.4)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: isSelected ? 'white' : 'rgba(255,255,255,0.65)' }}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
                {winnerCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,69,58,0.25)', color: '#FF453A' }}>
                    ✓ vencedor
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Nominees for selected category */}
      <div className="px-4">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {CATEGORY_LABELS[selectedCat] ?? selectedCat}
        </p>
        <div className="flex flex-col gap-2">
          {noms.map(nom => {
            const film = films.find(f => f.id === nom.film_id)
            if (!film) return null
            const key = `${nom.film_id}-${nom.category}`
            const isSaving = saving === key
            return (
              <button
                key={key}
                onClick={() => toggleWinner(nom.film_id, nom.category, nom.winner)}
                disabled={!!saving}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-left"
                style={{
                  background: nom.winner ? 'rgba(255,69,58,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${nom.winner ? 'rgba(255,69,58,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  opacity: saving && !isSaving ? 0.5 : 1,
                }}
              >
                {/* Winner indicator */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: nom.winner ? '#FF453A' : 'rgba(255,255,255,0.08)',
                    border: `1.5px solid ${nom.winner ? '#FF453A' : 'rgba(255,255,255,0.15)'}`,
                  }}
                >
                  {isSaving
                    ? <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin"/>
                    : nom.winner
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : null
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: nom.winner ? 'white' : 'rgba(255,255,255,0.7)' }}>
                    {film.title}
                  </p>
                  {nom.nominee && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: nom.winner ? 'rgba(255,69,58,0.9)' : 'rgba(255,255,255,0.35)' }}>
                      {nom.nominee}
                    </p>
                  )}
                </div>

                {nom.winner && (
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: '#FF453A' }}>🏆</span>
                )}
              </button>
            )
          })}
          {noms.length === 0 && (
            <p className="text-sm py-6 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Nenhum indicado encontrado para esta categoria
            </p>
          )}
        </div>
      </div>

    </main>
  )
}
