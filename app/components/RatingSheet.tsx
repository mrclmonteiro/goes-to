'use client'
import { useEffect, useRef, useState } from 'react'

const QUALITY: Record<number, string> = {
  0.5: 'Horrível', 1: 'Fraco', 1.5: 'Fraco+', 2: 'Regular',
  2.5: 'Regular+', 3: 'Bom', 3.5: 'Bom+', 4: 'Ótimo',
  4.5: 'Ótimo+', 5: 'Imperdível',
}

function HalfStarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const displayed = hover ?? value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const leftVal = star - 0.5
        const rightVal = star
        const leftFilled = displayed >= leftVal
        const rightFilled = displayed >= rightVal
        return (
          <div key={star} className="relative w-8 h-8 cursor-pointer flex items-center justify-center"
            onMouseLeave={() => setHover(null)}>
            {/* Estrela base (vazia) */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="absolute">
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
                stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            {/* Metade esquerda preenchida */}
            {leftFilled && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="absolute" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
                  fill="#fbbf24" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            )}
            {/* Metade direita preenchida */}
            {rightFilled && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="absolute" style={{ clipPath: 'inset(0 0 0 50%)' }}>
                <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
                  fill="#fbbf24" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            )}
            {/* Áreas de clique: metade esquerda e direita */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 h-full" onMouseEnter={() => setHover(leftVal)} onClick={() => onChange(leftVal)}/>
              <div className="flex-1 h-full" onMouseEnter={() => setHover(rightVal)} onClick={() => onChange(rightVal)}/>
            </div>
          </div>
        )
      })}
      {displayed > 0 && (
        <span className="ml-2 text-xs font-medium" style={{ color: 'rgba(251,191,36,0.7)' }}>
          {QUALITY[displayed] ?? ''}
        </span>
      )}
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  filmTitle: string
  categories: string[]
  nominees?: Record<string, string>
  ratings: Record<string, number>
  onRate: (cat: string, value: number) => void
}

export default function RatingSheet({ open, onClose, filmTitle, categories, nominees = {}, ratings, onRate }: Props) {
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

  const filledCats = categories.filter(c => ratings[c] > 0)
  const avg = filledCats.length > 0
    ? Math.round((filledCats.reduce((s, c) => s + ratings[c], 0) / filledCats.length) * 10) / 10
    : 0

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}/>
      <div className="relative w-full rounded-t-[32px] flex flex-col"
        style={{
          background: '#0e0e14', border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none', boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
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
          <div className="text-center">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Avaliando</p>
            <p className="text-sm font-semibold">{filmTitle}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>

        <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
          <div className="px-5 pt-4 flex flex-col gap-1">

            {categories.map((cat, i) => (
              <div key={cat}>
                <div className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold">{cat}</p>
                      {nominees[cat] && (
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>{nominees[cat]}</p>
                      )}
                    </div>
                    {ratings[cat] > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.12)', color: 'rgba(251,191,36,0.8)' }}>
                        {ratings[cat]}★
                      </span>
                    )}
                  </div>
                  <HalfStarRating value={ratings[cat] ?? 0} onChange={v => onRate(cat, v)}/>
                </div>
                {i < categories.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}/>}
              </div>
            ))}

            {/* Média geral */}
            {avg > 0 && (
              <div className="mt-3 mb-2 rounded-2xl p-4 flex items-center justify-between"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Sua média geral</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black" style={{ color: '#fbbf24' }}>{avg}</span>
                  <span style={{ color: '#fbbf24' }}>★</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
