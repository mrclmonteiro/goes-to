'use client'
import React from 'react'

async function toDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}

export async function shareOrDownload(ref: React.RefObject<HTMLDivElement>) {
  if (!ref.current) return

  // Converte todos os pôsteres para base64 antes de renderizar
  const imgs = Array.from(ref.current.querySelectorAll('img'))
  await Promise.all(imgs.map(async img => {
    if (img.src.startsWith('data:')) return
    const data = await toDataUrl(img.src)
    if (data) img.src = data
  }))

  // Aguarda repintura
  await new Promise(r => setTimeout(r, 100))

  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(ref.current, {
    backgroundColor: '#0a0a0f',
    scale: 2,
    useCORS: false,
    allowTaint: true,
    logging: false,
  })

  canvas.toBlob(async blob => {
    if (!blob) return
    const file = new File([blob], 'goes-to-oscar2026.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Goes To... · Oscar 2026' })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'goes-to-oscar2026.png'
      a.click()
      URL.revokeObjectURL(url)
    }
  }, 'image/png')
}
