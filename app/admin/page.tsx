'use client'
import { useEffect, useState, useRef } from 'react'
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

// --- TIPOS DO LIVESTREAM ---
type LiveUpdate = {
  id?: string
  created_at?: string
  kind: 'update' | 'winner'
  title: string | null
  plain_text: string | null
  rich_html: string | null
  category: string | null
  film_id: string | null
  person_name: string | null
  person_photo_url: string | null
  is_published: boolean
}

// --- COMPONENTE DO EDITOR RICH TEXT ---
function RichTextEditor({ 
  initialHtml, 
  onChange 
}: { 
  initialHtml: string, 
  onChange: (html: string, plain: string) => void 
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHtml && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.innerHTML = initialHtml || ''
    }
  }, [initialHtml])

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    update()
  }

  const update = () => {
    if (!editorRef.current) return
    onChange(editorRef.current.innerHTML, editorRef.current.innerText)
  }

  const insertLink = () => {
    const url = prompt('URL do link (ex: https://...):')
    if (url) exec('createLink', url)
  }

  const insertYouTube = () => {
    const url = prompt('Cole a URL do YouTube:')
    if (!url) return
    const videoIdMatch = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null
    if (videoId) {
      const iframe = `<br><div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; margin: 16px 0;"><iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div><br>`
      exec('insertHTML', iframe)
    } else {
      alert('Não foi possível identificar o vídeo na URL.')
    }
  }

  const insertTweet = () => {
    const embedCode = prompt('Cole aqui o código HTML de embed do Tweet:')
    if (embedCode) {
      exec('insertHTML', `<br><div style="display:flex; justify-content:center; margin: 16px 0;">${embedCode}</div><br>`)
    }
  }

  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)' }}>
      <div className="flex flex-wrap gap-1 p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
        <button type="button" onClick={() => exec('bold')} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded font-bold text-white transition-colors">B</button>
        <button type="button" onClick={() => exec('italic')} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded italic text-white transition-colors">I</button>
        <div className="w-px h-6 my-auto mx-1 bg-white/10" />
        <button type="button" onClick={insertLink} className="px-3 h-8 flex items-center justify-center hover:bg-white/10 rounded text-sm text-white transition-colors">🔗 Link</button>
        <button type="button" onClick={insertYouTube} className="px-3 h-8 flex items-center justify-center hover:bg-white/10 rounded text-sm text-red-400 transition-colors">▶️ YouTube</button>
        <button type="button" onClick={insertTweet} className="px-3 h-8 flex items-center justify-center hover:bg-white/10 rounded text-sm text-blue-400 transition-colors">🐦 Tweet</button>
      </div>
      <div
        ref={editorRef}
        className="p-4 min-h-[150px] outline-none"
        contentEditable
        onInput={update}
        onBlur={update}
        style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', lineHeight: '1.6' }}
      />
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [films, setFilms] = useState<Film[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedCat, setSelectedCat] = useState<string>(ORDERED_CATEGORIES[0])
  const [pushTitle, setPushTitle] = useState('')
  const [pushMessage, setPushMessage] = useState('')
  const [pushSending, setPushSending] = useState(false)
  const [pushResult, setPushResult] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Estados do Livestream
  const [updates, setUpdates] = useState<LiveUpdate[]>([])
  const [editingUpdate, setEditingUpdate] = useState<Partial<LiveUpdate> | null>(null)
  const [isSavingUpdate, setIsSavingUpdate] = useState(false)

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

      const { data: { session } } = await supabase.auth.refreshSession()
      if (session?.access_token) setAccessToken(session.access_token)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.is_admin) { router.replace('/'); return }

      setAuthorized(true)

      // Adicionando a busca dos live updates aqui
      const [{ data: filmsData }, { data: nomsData }, { data: updatesData }] = await Promise.all([
        supabase.from('films').select('id, title'),
        supabase.from('nominations').select('film_id, category, nominee, winner'),
        supabase.from('oscar_live_updates').select('*').order('created_at', { ascending: false })
      ])
      
      setFilms(filmsData ?? [])
      setNominations(nomsData ?? [])
      setUpdates(updatesData ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function toggleWinner(nom: Nomination) {
    const { film_id, category, nominee, winner: currentWinner } = nom
    const key = `${film_id}-${category}`
    setSaving(key)
    const supabase = createClient()
    if (!supabase) return

    try {
      // 1. Atualiza a tabela nominations e FORÇA o erro caso o banco falhe
      await supabase
        .from('nominations')
        .update({ winner: !currentWinner })
        .eq('film_id', film_id)
        .eq('category', category)
        .throwOnError()

      // 2. Cria ou remove a atualização automática no livestream
      if (!currentWinner) {
        // Virou vencedor: cria o post no livestream
        const { data: newUpdate } = await supabase
          .from('oscar_live_updates')
          .insert({
            kind: 'winner',
            category: category,
            film_id: film_id,
            person_name: nominee, 
            is_published: true
          })
          .select()
          .single()
          .throwOnError()
          
        if (newUpdate) setUpdates(prev => [newUpdate, ...prev])
      } else {
        // Deixou de ser vencedor (desmarcou): remove o post do livestream
        let query = supabase
          .from('oscar_live_updates')
          .delete()
          .eq('kind', 'winner')
          .eq('category', category)
          .eq('film_id', film_id)

        if (nominee) {
          query = query.eq('person_name', nominee)
        } else {
          query = query.is('person_name', null)
        }

        const { data: removed } = await query.select().throwOnError()
          
        if (removed && removed.length > 0) {
          const removedIds = removed.map((r: { id: string }) => r.id)
          setUpdates(prev => prev.filter(u => !removedIds.includes(u.id)))
        }
      }

      // 3. Atualiza a UI das indicações
      setNominations(prev =>
        prev.map(n =>
          n.film_id === film_id && n.category === category
            ? { ...n, winner: !currentWinner }
            : n
        )
      )
    } catch (err) {
      console.error("Erro no toggleWinner:", err)
      alert('Erro ao alterar vencedor. O banco de dados e a interface foram mantidos sincronizados.')
    } finally {
      setSaving(null)
    }
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

  // Funções do Livestream
  async function saveUpdate() {
    if (!editingUpdate) return
    setIsSavingUpdate(true)
    const supabase = createClient()
    if (!supabase) return

    try {
      if (editingUpdate.id) {
        const { data, error } = await supabase
          .from('oscar_live_updates')
          .update(editingUpdate)
          .eq('id', editingUpdate.id)
          .select()
          .single()
        
        if (error) throw error
        if (data) setUpdates(prev => prev.map(u => u.id === data.id ? data : u))
      } else {
        const { data, error } = await supabase
          .from('oscar_live_updates')
          .insert({ ...editingUpdate, is_published: true })
          .select()
          .single()
          
        if (error) throw error
        if (data) setUpdates(prev => [data, ...prev])
      }
      setEditingUpdate(null)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar atualização')
    } finally {
      setIsSavingUpdate(false)
    }
  }

  async function deleteUpdate(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta atualização permanentemente?')) return
    const supabase = createClient()
    if (!supabase) return
    
    await supabase.from('oscar_live_updates').delete().eq('id', id)
    setUpdates(prev => prev.filter(u => u.id !== id))
  }

  const noms = nominations.filter(n => n.category === selectedCat)

  if (loading || !authorized) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Spinner size={44} />
    </main>
  )

  return (
    <main className="min-h-screen pb-24" style={{ background: '#0a0a0f', color: 'white' }}>

      {/* Back button */}
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

      {/* Push Notifications */}
      <div className="px-4 mb-6">
          <p className="text-lg font-semibold mb-[5px]" style={{ color: 'white' }}>Enviar notificação push</p>
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

      {/* Live Stream: Editor e Lista */}
      <div className="px-4 mb-10 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🔴 Live Stream Updates
          </h2>
          <button 
            onClick={() => setEditingUpdate({ kind: 'update', rich_html: '', plain_text: '', is_published: true })}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            + Adicionar
          </button>
        </div>

        {editingUpdate && (
          <div className="mb-8 p-5 rounded-2xl bg-black/40 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingUpdate.id ? 'Editar Atualização' : 'Nova Atualização'}
            </h3>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1 uppercase tracking-wide">Tipo</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none"
                  value={editingUpdate.kind}
                  onChange={e => setEditingUpdate({ ...editingUpdate, kind: e.target.value as 'update' | 'winner' })}
                >
                  <option value="update">📝 Atualização Geral</option>
                  <option value="winner">🏆 Anúncio de Vencedor</option>
                </select>
              </div>

              {editingUpdate.kind === 'winner' && (
                <div className="grid grid-cols-1 gap-4 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1 uppercase">Categoria</label>
                    <select 
                      className="w-full bg-black/50 border border-white/10 text-white p-2.5 rounded-lg outline-none"
                      value={editingUpdate.category || ''}
                      onChange={e => setEditingUpdate({ ...editingUpdate, category: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {ORDERED_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1 uppercase">Filme</label>
                    <select 
                      className="w-full bg-black/50 border border-white/10 text-white p-2.5 rounded-lg outline-none"
                      value={editingUpdate.film_id || ''}
                      onChange={e => setEditingUpdate({ ...editingUpdate, film_id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {films.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1 uppercase">Nome (Opcional - Ex: Diretor)</label>
                    <input 
                      type="text"
                      className="w-full bg-black/50 border border-white/10 text-white p-2.5 rounded-lg outline-none"
                      value={editingUpdate.person_name || ''}
                      onChange={e => setEditingUpdate({ ...editingUpdate, person_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1 uppercase">Foto (URL - Opcional)</label>
                    <input 
                      type="text"
                      className="w-full bg-black/50 border border-white/10 text-white p-2.5 rounded-lg outline-none"
                      value={editingUpdate.person_photo_url || ''}
                      onChange={e => setEditingUpdate({ ...editingUpdate, person_photo_url: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1 uppercase tracking-wide">Título (Opcional)</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl outline-none"
                  value={editingUpdate.title || ''}
                  onChange={e => setEditingUpdate({ ...editingUpdate, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1 uppercase tracking-wide">Conteúdo do Post</label>
                <RichTextEditor 
                  initialHtml={editingUpdate.rich_html || ''}
                  onChange={(html, plain) => setEditingUpdate({ ...editingUpdate, rich_html: html, plain_text: plain })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  onClick={() => setEditingUpdate(null)}
                  className="px-5 py-2.5 rounded-xl text-white/60 hover:text-white font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveUpdate}
                  disabled={isSavingUpdate}
                  className="bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-white/90 disabled:opacity-50"
                >
                  {isSavingUpdate ? 'Salvando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {updates.length === 0 && !editingUpdate && (
            <p className="text-white/40 text-center py-6 text-sm">Nenhuma atualização no momento.</p>
          )}
          {updates.map(upd => (
            <div key={upd.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 items-start sm:items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {upd.kind === 'winner' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 uppercase">🏆 Vencedor</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">📝 Update</span>
                  )}
                </div>
                {upd.title && <h4 className="text-sm font-bold text-white truncate">{upd.title}</h4>}
                <p className="text-xs text-white/50 line-clamp-2 mt-1">{upd.plain_text}</p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => setEditingUpdate(upd)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => deleteUpdate(upd.id!)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Definir Vencedores Tradicional */}
      <p className="text-lg font-semibold mb-[5px] px-4" style={{ color: 'white' }}>Escolher categoria para definir vencedor</p>
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

      <p className="text-lg font-semibold mb-[5px] px-4" style={{ color: 'white' }}>Definir vencedor</p>
      <div className="px-4">
        <p className="text-xs tracking-widest font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                onClick={() => toggleWinner(nom)}
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