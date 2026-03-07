'use client'
import { useEffect } from 'react'

/**
 * iOS Safari só dispara :active em elementos não-âncora quando existe
 * um listener de touchstart em algum ancestral. Registrar um listener
 * passivo no document ativa o :active de todos os botões globalmente.
 */
export default function TouchActiveFix() {
  useEffect(() => {
    const noop = () => {}
    document.addEventListener('touchstart', noop, { passive: true })
    return () => document.removeEventListener('touchstart', noop)
  }, [])
  return null
}
