'use client'
import { useEffect, useRef, useState } from 'react'

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-2 justify-center">
      {[1,2,3,4,5].map(i => (
        <button key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="text-3xl transition-transform active:scale-90"
          style={{ color: i <= (hover || value) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }}>
          ★
        </button>
      ))}
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  filmTitle: string
  categories: string[]
  ratings: Record<string, number>
  onRate: (cat: string, value: number) => void
}

export default function RatingSheet({ open, onClose, filmTitle, categories, ratings, onRate }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)
  const currentY = useRef(0)
  const [translateY, setTranslateY] = useState(100)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => setTranslateY(0))
    } else {
      setTranslateY(100)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function onDragStart(clientY: number) {
    dragStart.current = clientY
    currentY.current = 0
    setIsDragging(true)
  }

  function onDragMove(clientY: number) {
    if (dragStart.current === null) return
    const delta = clientY - dragStart.current
    if (delta < 0) return
    currentY.current = delta
    const pct = (delta / window.innerHeight) * 100
    setTranslateY(Math.min(pct, 60))
  }

  function onDragEnd() {
    setIsDragging(false)
    if (currentY.current > 120) {
      onClose()
    } else {
      setTranslateY(0)
    }
    dragStart.current = null
  }

  if (!open && translateY >= 100) return null

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          transition: isDragging ? 'none' : 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full rounded-t-[32px] flex flex-col"
        style={{
          background: '#0e0e14',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
          transform: `translateY(${translateY}%)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
          maxHeight: '92vh',
        }}
        onTouchStart={e => onDragStart(e.touches[0].clientY)}
        onTouchMove={e => onDragMove(e.touches[0].clientY)}
        onTouchEnd={onDragEnd}
        onMouseDown={e => onDragStart(e.clientY)}
        onMouseMove={e => { if (dragStart.current !== null) onDragMove(e.clientY) }}
        onMouseUp={onDragEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div className="w-9"/>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Avaliando
            </p>
            <p className="text-base font-semibold mt-0.5 leading-tight" style={{ color: 'white' }}>
              {filmTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-6"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>

          <p className="text-sm text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Avalie o filme em cada categoria em que foi indicado. A nota geral será a média das categorias.
          </p>

          {categories.map((cat, i) => (
            <div key={cat}>
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-semibold text-center" style={{ color: 'rgba(255,255,255,0.85)' }}>{cat}</p>
                <StarRating value={ratings[cat] ?? 0} onChange={v => onRate(cat, v)}/>
                {ratings[cat] > 0 && (
                  <p className="text-xs" style={{ color: 'rgba(251,191,36,0.6)' }}>
                    {['', 'Fraco', 'Regular', 'Bom', 'Ótimo', 'Imperdível'][ratings[cat]]}
                  </p>
                )}
              </div>
              {i < categories.length - 1 && (
                <div className="mt-6" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>
              )}
            </div>
          ))}

          {Object.keys(ratings).length > 0 && (
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Nota geral</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: '#fbbf24' }}>
                  {(Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1)}
                </span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>/ 5</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
