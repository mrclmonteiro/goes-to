'use client'
import { useEffect, useState } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Já está rodando como PWA instalado
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ((window.navigator as unknown as { standalone?: boolean }).standalone === true)
    // Usuário já dispensou
    const dismissed = localStorage.getItem('install-banner-dismissed')
    if (!isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 3000)
    }
  }, [])

  function dismiss() {
    localStorage.setItem('install-banner-dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isAndroid = /android/i.test(navigator.userAgent)

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[998] rounded-3xl p-4"
      style={{
        background: 'rgba(14,14,20,0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        animation: 'slideUp 0.4s cubic-bezier(0.32,0.72,0,1)',
      }}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
          <img src="/icon.png" alt="Goes To" className="w-full h-full object-cover"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'white' }}>Adicione à tela inicial</p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isIOS
              ? 'Toque em  ↑  e depois "Adicionar à Tela de Início"'
              : isAndroid
              ? 'Toque em ⋮ e depois "Adicionar à tela inicial"'
              : 'Instale para uma experiência melhor'}
          </p>
        </div>
        <button onClick={dismiss}
          className="lg-btn w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
