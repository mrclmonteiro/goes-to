'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FEATURES = [
  { title: 'Acompanhar os indicados', desc: 'Um jeito simples de registrar os filmes indicados que você já assistiu', main: '🎬', orbs: ['✅', '🍿', '📺'] },
  { title: 'Avaliar os filmes', desc: 'Dê a sua nota em cada categoria na qual o filme está indicado', main: '⭐', orbs: ['💭', '🤔', '✍️'] },
  { title: 'Definir sua meta', desc: 'Escolha sua meta na premiação — o importante é fazer parte', main: '🎯', orbs: ['💪', '📺', '🍿'] },
  { title: 'Compartilhar com os amigos', desc: 'Mostre nos Instagram Stories como anda a sua meta', main: '📲', orbs: ['✨', '🤳', '🗣️'] },
  { title: 'E muito mais', desc: 'Descubra fatos sobre as premiações, filmes com base no que você assistiu e muito mais', main: '✨', orbs: ['🤩', '💭', '✍️'] },
]

function EmojiScene({ feature }: { feature: typeof FEATURES[0] }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <style>{`
        @keyframes mainFloat { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-12px) scale(1.08); } }
        @keyframes orb0 { 0%,100% { transform: translate(-50%,-50%) translateY(0px) rotate(0deg); } 40% { transform: translate(-50%,-50%) translateY(-10px) rotate(15deg); } 70% { transform: translate(-50%,-50%) translateY(5px) rotate(-8deg); } }
        @keyframes orb1 { 0%,100% { transform: translate(-50%,-50%) translateY(0px) rotate(0deg); } 30% { transform: translate(-50%,-50%) translateY(8px) rotate(-18deg); } 65% { transform: translate(-50%,-50%) translateY(-12px) rotate(10deg); } }
        @keyframes orb2 { 0%,100% { transform: translate(-50%,-50%) translateY(0px) rotate(0deg); } 25% { transform: translate(-50%,-50%) translateY(-7px) rotate(10deg); } 75% { transform: translate(-50%,-50%) translateY(9px) rotate(-14deg); } }
      `}</style>
      <div className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,69,58,0.12) 0%, transparent 70%)', filter: 'blur(24px)' }}/>
      {feature.orbs.map((orb, i) => {
        const angle = (i / feature.orbs.length) * 2 * Math.PI - Math.PI / 2
        const r = 62
        return (
          <span key={orb} className="absolute select-none pointer-events-none"
            style={{
              left: `calc(50% + ${Math.cos(angle) * r}px)`,
              top: `calc(50% + ${Math.sin(angle) * r}px)`,
              transform: 'translate(-50%,-50%)', fontSize: 22,
              animation: `orb${i} ${[2.8,3.2,2.5][i]}s ${[0,0.4,0.8][i]}s ease-in-out infinite`,
            }}>
            {orb}
          </span>
        )
      })}
      <span className="relative z-10 select-none"
        style={{ fontSize: 64, animation: 'mainFloat 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}>
        {feature.main}
      </span>
    </div>
  )
}

function FloatInput({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  return (
    <div className="relative" style={{ height: 52 }}>
      <input type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 w-full px-4 outline-none text-white text-sm bg-transparent"
        style={{ paddingTop: lifted ? 18 : 0, transition: 'padding-top 0.2s' }}/>
      <label className="absolute left-4 pointer-events-none transition-all duration-200"
        style={{
          top: lifted ? 8 : '50%',
          transform: lifted ? 'none' : 'translateY(-50%)',
          fontSize: lifted ? 10 : 14,
          color: focused ? 'rgba(255,69,58,0.9)' : 'rgba(255,255,255,0.35)',
          fontWeight: lifted ? 600 : 400,
          letterSpacing: lifted ? '0.05em' : 0,
        }}>
        {label}
      </label>
    </div>
  )
}

// Popup de confirmação de cadastro
function SignUpPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-6"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center gap-4"
        style={{
          background: 'rgba(20,20,28,0.98)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}>
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }`}</style>
        <span style={{ fontSize: 52 }}>📬</span>
        <div>
          <p className="text-lg font-bold mb-2">Quase lá!</p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Enviamos um email de confirmação para você. Verifique sua caixa de entrada e clique no link para ativar sua conta.
          </p>
        </div>
        <button onClick={onClose}
          className="lg-btn w-full py-3 rounded-full text-sm font-semibold mt-2"
          style={{ background: 'linear-gradient(135deg,rgba(255,69,58,0.95),rgba(204,50,40,0.95))', color: 'white' }}>
          Entendido!
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [featureIdx, setFeatureIdx] = useState(0)
  const [featureVisible, setFeatureVisible] = useState(true)
  const [showSignUpPopup, setShowSignUpPopup] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureVisible(false)
      setTimeout(() => { setFeatureIdx(i => (i + 1) % FEATURES.length); setFeatureVisible(true) }, 380)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit() {
    setLoading(true); setMessage('')
    try {
      const supabase = createClient()
      if (!supabase) { setMessage('Erro de configuração.'); setLoading(false); return }
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setMessage(error.message)
        else setShowSignUpPopup(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage(error.message)
        else router.push('/filmes')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const feature = FEATURES[featureIdx]

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#0a0a0f', color: 'white' }}>

      {showSignUpPopup && <SignUpPopup onClose={() => { setShowSignUpPopup(false); setIsSignUp(false) }}/>}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)', filter:'blur(60px)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'-10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,69,58,0.1) 0%, transparent 70%)', filter:'blur(60px)' }}/>
      </div>

      <div className="relative flex flex-col flex-1 px-6 pt-14">

        {/* Ícone à esquerda */}
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden"
            style={{ border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
            <img src="/icon.png" alt="Goes To" className="w-full h-full object-cover"/>
          </div>
        </div>

        {/* Headline centralizada */}
        <div className="text-center mb-10">
          <p className="text-sm font-medium mb-1" style={{ color:'rgba(255,255,255,0.4)' }}>Bem-vindo ao</p>
          <h1 className="text-4xl font-bold ">Goes To...</h1>
        </div>

        {/* Feature showcase */}
        <div className="flex flex-col items-center mb-10" style={{ minHeight: 300 }}>
          <div style={{
            opacity: featureVisible ? 1 : 0,
            transform: featureVisible ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}>
            <EmojiScene feature={feature}/>
          </div>

          {/* Texto fixo */}
          <p className="text-[10px] uppercase tracking-widest font-semibold mt-5 mb-1.5" style={{ color:'rgba(255,255,255,0.28)' }}>
            Um novo app para
          </p>

          {/* Texto que muda */}
          <div className="text-center px-2" style={{
            opacity: featureVisible ? 1 : 0,
            transform: featureVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.35s ease 0.06s, transform 0.35s ease 0.06s',
            minHeight: 72,
          }}>
            <p className="text-xl font-bold leading-tight mb-2">{feature.title}</p>
            <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.42)' }}>{feature.desc}</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="mb-3 rounded-2xl overflow-hidden"
          style={{ border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)' }}>
          <FloatInput label="Email" type="email" value={email} onChange={setEmail}/>
          <div style={{ height:1, background:'rgba(255,255,255,0.08)', marginLeft:16 }}/>
          <FloatInput label="Senha" type="password" value={password} onChange={setPassword}/>
        </div>

        {/* Botão menor e totalmente arredondado */}
        <div className="flex justify-center mb-3">
          <button onClick={handleSubmit} disabled={loading}
            className="lg-btn px-12 py-3 rounded-full text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,rgba(255,69,58,0.95),rgba(204,50,40,0.95))', color:'white', boxShadow:'0 4px 20px rgba(255,69,58,0.2)' }}>
            {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </button>
        </div>

        {message && <p className="text-xs text-center mb-3" style={{ color:'rgba(255,69,58,0.8)' }}>{message}</p>}

        <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-center mb-10"
          style={{ color:'rgba(255,255,255,0.28)' }}>
          {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
        </button>
      </div>

      <div className="px-6 py-6" style={{ background: 'rgba(80,80,88,0.35)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs leading-relaxed mb-4" style={{ color:'rgba(255,255,255,0.28)' }}>
          O <span style={{ color:'rgba(255,255,255,0.5)' }}>Goes To...</span> é um app desenvolvido por{' '}
          <span style={{ color:'rgba(255, 255, 255, 0.5)0)' }}>Marcelo Monteiro</span> com auxílio da{' '}
          <span style={{ color:'rgba(255, 255, 255, 0.5)' }}>Claude</span>.
        </p>
          <div className="flex gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
            {[
              { href: "https://x.com/mrclmonteiro", label: "X", svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { href: "https://www.instagram.com/mrclmonteiro/", label: "Instagram", svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
              { href:'https://letterboxd.com/mrclmonteiro/', label:'Letterboxd', svg:<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.7 3C3 3 0 6 0 9.7v4.6C0 18 3 21 6.7 21h10.6c3.7 0 6.7-3 6.7-6.7V9.7C24 6 21 3 17.3 3H6.7zm5.3 3.3a5.7 5.7 0 110 11.4 5.7 5.7 0 010-11.4zm-4 1.9a5.7 5.7 0 100 7.6 7 7 0 010-7.6zm8 0a7 7 0 010 7.6 5.7 5.7 0 100-7.6z"/></svg> },              
              { href: "https://www.linkedin.com/in/mrclmonteiro/", label: "LinkedIn", svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
              
            ].map(({ href, label, svg }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center"
                style={{ color: "rgba(255,255,255,0.35)'", lineHeight: 0 }}>
                {svg}
              </a>
            ))}
            </div>
            <div className="flex items-center gap-2">
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)'" }}>Gostou?</span>
    <a href="https://www.buymeacoffee.com/mrclmonteiro" target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#3c3c43", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 99, padding: "5px 12px", textDecoration: "none" }}>
      <span style={{ fontSize: 13 }}>☕</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "white", whiteSpace: "nowrap" }}>Me apoia um café</span>
    </a>
  </div>
      </div>
      </div> 
    </main>
  )
}