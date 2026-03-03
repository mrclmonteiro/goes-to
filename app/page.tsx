'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    setMessage('')
    
    try {
      const supabase = createClient()
      if (!supabase || typeof supabase !== 'object') {
        setMessage('Erro: Supabase não configurado. Verifique as variáveis de ambiente.')
        setLoading(false)
        return
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setMessage(error.message)
        else setMessage('Verifique seu email para confirmar o cadastro!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage(error.message)
        else router.push('/filmes')
      }
    } catch (error: any) {
      setMessage(error?.message || 'Erro ao processar requisição. Tente novamente.')
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-8 relative overflow-hidden">

      {/* Orbs de fundo */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/30 blur-[120px] -top-32 -left-32 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-500/20 blur-[100px] -bottom-16 -right-16 pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/20 blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Card de vidro */}
      <div className="relative w-full max-w-sm rounded-3xl p-px"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
        }}>
        <div className="rounded-3xl p-8 flex flex-col gap-5"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>

          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Goes To...</h1>
            <p className="text-white/40 text-sm mt-1">Oscar 2026 · 98ª cerimônia</p>
          </div>

          {/* Inputs */}
          <input
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {/* Botão principal */}
          <button
            className="rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.9), rgba(245,158,11,0.9))',
              boxShadow: '0 4px 24px rgba(251,191,36,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
              color: '#1a0e00',
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </button>

          {message && (
            <p className="text-xs text-center text-amber-400/80">{message}</p>
          )}

          {/* Trocar modo */}
          <button
            className="text-white/30 text-xs hover:text-white/60 transition-colors text-center"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </button>
        </div>
      </div>
    </main>
  )
}
