export const ORDERED_CATEGORIES = [
  'Best Picture',
  'Best Director',
  'Best Actor',
  'Best Actress',
  'Best Supporting Actor',
  'Best Supporting Actress',
  'Best Animated Feature',
  'Best International Feature',
  'Best Adapted Screenplay',
  'Best Original Screenplay',
  'Best Cinematography',
  'Best Film Editing',
  'Best Original Score',
  'Best Original Song',
  'Best Costume Design',
  'Best Production Design',
  'Best Makeup and Hairstyling',
  'Best Sound',
  'Best Visual Effects',
  'Best Casting',
  'Best Documentary Feature',
] as const

export const CATEGORY_LABELS: Record<string, string> = {
  'Best Picture': 'Melhor Filme',
  'Best Director': 'Melhor Direção',
  'Best Actor': 'Melhor Ator',
  'Best Actress': 'Melhor Atriz',
  'Best Supporting Actor': 'Melhor Ator Coadjuvante',
  'Best Supporting Actress': 'Melhor Atriz Coadjuvante',
  'Best Animated Feature': 'Melhor Animação',
  'Best International Feature': 'Melhor Filme Internacional',
  'Best Adapted Screenplay': 'Roteiro Adaptado',
  'Best Original Screenplay': 'Roteiro Original',
  'Best Cinematography': 'Fotografia',
  'Best Film Editing': 'Montagem',
  'Best Original Score': 'Trilha Sonora Original',
  'Best Original Song': 'Canção Original',
  'Best Costume Design': 'Figurino',
  'Best Production Design': 'Direção de Arte',
  'Best Makeup and Hairstyling': 'Maquiagem e Cabelo',
  'Best Sound': 'Som',
  'Best Visual Effects': 'Efeitos Visuais',
  'Best Casting': 'Elenco',
  'Best Documentary Feature': 'Documentário',
}

// [color1, color2, color3, baseColor] — Apple Music-style aura blobs
export const CATEGORY_AURA: Record<string, readonly [string, string, string, string]> = {
  'Best Picture':               ['#fbbf24', '#f59e0b', '#ef4444', '#1a0b00'],
  'Best Director':              ['#3b82f6', '#6366f1', '#1d4ed8', '#06003d'],
  'Best Actor':                 ['#0ea5e9', '#38bdf8', '#0284c7', '#001432'],
  'Best Actress':               ['#a855f7', '#ec4899', '#f472b6', '#150030'],
  'Best Supporting Actor':      ['#10b981', '#06b6d4', '#34d399', '#001f14'],
  'Best Supporting Actress':    ['#f43f5e', '#fb7185', '#f97316', '#200010'],
  'Best Animated Feature':      ['#f97316', '#c026d3', '#fbbf24', '#1e0418'],
  'Best International Feature': ['#059669', '#0d9488', '#6ee7b7', '#001a10'],
  'Best Adapted Screenplay':    ['#b45309', '#d97706', '#f59e0b', '#180e00'],
  'Best Original Screenplay':   ['#8b5cf6', '#a78bfa', '#e879f9', '#0e0028'],
  'Best Cinematography':        ['#4338ca', '#6366f1', '#38bdf8', '#06003c'],
  'Best Film Editing':          ['#dc2626', '#ef4444', '#fca5a5', '#1e0000'],
  'Best Original Score':        ['#0891b2', '#22d3ee', '#818cf8', '#001824'],
  'Best Original Song':         ['#db2777', '#ec4899', '#f0abfc', '#1e0018'],
  'Best Costume Design':        ['#9f1239', '#be123c', '#fda4af', '#200014'],
  'Best Production Design':     ['#166534', '#15803d', '#86efac', '#001a08'],
  'Best Makeup and Hairstyling':['#ea580c', '#fb923c', '#fbbf24', '#1e0800'],
  'Best Sound':                 ['#64748b', '#94a3b8', '#38bdf8', '#061020'],
  'Best Visual Effects':        ['#06b6d4', '#3b82f6', '#818cf8', '#00103c'],
  'Best Casting':               ['#d97706', '#f59e0b', '#34d399', '#160c00'],
  'Best Documentary Feature':   ['#4d7c0f', '#65a30d', '#f59e0b', '#081200'],
}

/** Deterministic blob positions based on category name hash */
function cardPos(cat: string): [[number, number], [number, number], [number, number]] {
  let h = 5381
  for (let i = 0; i < cat.length; i++) h = ((((h << 5) - h) ^ cat.charCodeAt(i)) >>> 0)
  return [
    [(h % 40) + 5,          ((h >> 6)  % 40) + 5 ],
    [((h >> 12) % 38) + 46, ((h >> 18) % 35) + 5 ],
    [((h >> 24) % 46) + 8,  ((h >> 28) % 28) + 58],
  ]
}

/** Generates a CSS `background` string with layered radial gradients (for static cards). */
export function categoryCardBg(cat: string): string {
  const a = CATEGORY_AURA[cat]
  if (!a) return '#111'
  const p = cardPos(cat)
  return (
    `radial-gradient(ellipse at ${p[0][0]}% ${p[0][1]}%, ${a[0]} 0%, transparent 55%), ` +
    `radial-gradient(ellipse at ${p[1][0]}% ${p[1][1]}%, ${a[1]} 0%, transparent 50%), ` +
    `radial-gradient(ellipse at ${p[2][0]}% ${p[2][1]}%, ${a[2]} 0%, transparent 60%), ` +
    a[3]
  )
}

export function categorySlug(cat: string): string {
  return cat.toLowerCase().replace(/\s+/g, '-')
}

export function slugToCategory(slug: string): string | undefined {
  return ORDERED_CATEGORIES.find(c => categorySlug(c) === slug)
}

/** Categories where nominees are people (director, actors) rather than films. */
export const PERSON_CATEGORIES_SET = new Set([
  'Best Director',
  'Best Actor',
  'Best Actress',
  'Best Supporting Actor',
  'Best Supporting Actress',
])
