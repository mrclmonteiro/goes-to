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
  'Best Documentary Short Film',
  'Best Animated Short Film',
  'Best Live Action Short Film',
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
  'Best Documentary Short Film': 'Curta Documentário',
  'Best Animated Short Film': 'Curta Animação',
  'Best Live Action Short Film': 'Curta Ficção',
}

// Structure: [blob1, blob2, blob3, BASE_COLOR, ...extraBlobs]
// Index 3 is always the base background color (used by hero animation).
// categoryCardBg uses indices 0,1,2 + any extras at 4+ as blobs.
// Best Picture has 6 blobs (pot-pourri of all categories).
export const CATEGORY_AURA: Record<string, readonly [string, string, string, string, ...string[]]> = {
  'Best Picture':               ['#fbbf24', '#a855f7', '#ef4444', '#0e0014', '#0ea5e9', '#10b981', '#f97316'],
  'Best Director':              ['#4338ca', '#1e1b4b', '#fbbf24', '#060012'],
  'Best Actor':                 ['#7dd3fc', '#bae6fd', '#0ea5e9', '#001428'],
  'Best Actress':               ['#d946ef', '#a21caf', '#f0abfc', '#1a0024'],
  'Best Supporting Actor':      ['#10b981', '#059669', '#34d399', '#00180e'],
  'Best Supporting Actress':    ['#f43f5e', '#be123c', '#fb7185', '#1e0008'],
  'Best Animated Feature':      ['#a3e635', '#4ade80', '#a855f7', '#081200'],
  'Best International Feature': ['#0d9488', '#0891b2', '#99f6e4', '#001818'],
  'Best Adapted Screenplay':    ['#b45309', '#78350f', '#fde68a', '#120800'],
  'Best Original Screenplay':   ['#8b5cf6', '#c4b5fd', '#ddd6fe', '#080018'],
  'Best Cinematography':        ['#78716c', '#d6d3d1', '#44403c', '#080806'],
  'Best Film Editing':          ['#dc2626', '#991b1b', '#fee2e2', '#1a0000'],
  'Best Original Score':        ['#500724', '#881337', '#fda4af', '#150004'],
  'Best Original Song':         ['#facc15', '#fb923c', '#fde68a', '#140e00'],
  'Best Costume Design':        ['#f9a8d4', '#ec4899', '#fdf2f8', '#1a0018'],
  'Best Production Design':     ['#166534', '#4d7c0f', '#d9f99d', '#001206'],
  'Best Makeup and Hairstyling':['#ea580c', '#fb923c', '#fed7aa', '#180800'],
  'Best Sound':                 ['#334155', '#1e293b', '#38bdf8', '#04080e'],
  'Best Visual Effects':        ['#06b6d4', '#7c3aed', '#a5f3fc', '#01001e'],
  'Best Casting':               ['#d97706', '#fcd34d', '#f59e0b', '#140c00'],
  'Best Documentary Feature':   ['#92400e', '#451a03', '#fbbf24', '#100400'],
  'Best Documentary Short Film': ['#ca8a04', '#fcd34d', '#713f12', '#0e0900'],
  'Best Animated Short Film':    ['#e879f9', '#c026d3', '#f5d0fe', '#160018'],
  'Best Live Action Short Film': ['#0284c7', '#075985', '#7dd3fc', '#00080f'],
}

// Explicit blob positions [x%, y%] per category for maximum visual variety
const CATEGORY_POSITIONS: Record<string, [number, number][]> = {
  'Best Picture':               [[12,12],[82,8],[90,55],[70,88],[18,82],[8,48]],
  'Best Director':              [[20,15],[80,70],[52,42]],
  'Best Actor':                 [[50,10],[85,65],[15,58]],
  'Best Actress':               [[80,15],[12,78],[48,48]],
  'Best Supporting Actor':      [[15,55],[80,22],[48,82]],
  'Best Supporting Actress':    [[10,18],[82,75],[42,30]],
  'Best Animated Feature':      [[50,20],[18,75],[82,62]],
  'Best International Feature': [[22,25],[80,28],[42,80]],
  'Best Adapted Screenplay':    [[18,72],[75,22],[85,80]],
  'Best Original Screenplay':   [[72,15],[18,58],[52,82]],
  'Best Cinematography':        [[40,12],[82,82],[10,62]],
  'Best Film Editing':          [[60,28],[15,75],[85,48]],
  'Best Original Score':        [[50,78],[12,18],[85,12]],
  'Best Original Song':         [[32,15],[82,50],[15,78]],
  'Best Costume Design':        [[78,22],[22,62],[62,85]],
  'Best Production Design':     [[18,80],[85,18],[48,48]],
  'Best Makeup and Hairstyling':[[55,15],[88,72],[10,58]],
  'Best Sound':                 [[10,48],[88,48],[50,82]],
  'Best Visual Effects':        [[22,12],[80,75],[72,18]],
  'Best Casting':               [[50,52],[10,18],[88,12]],
  'Best Documentary Feature':   [[22,28],[75,72],[50,42]],
  'Best Documentary Short Film': [[28,70],[78,18],[52,42]],
  'Best Animated Short Film':    [[68,25],[15,72],[88,70]],
  'Best Live Action Short Film': [[22,35],[72,75],[55,15]],
}

/** Generates a CSS `background` string with layered radial gradients (for static cards). */
export function categoryCardBg(cat: string): string {
  const a = CATEGORY_AURA[cat]
  if (!a) return '#111'
  const base = a[3]
  // blobs: indices 0,1,2 + any extras at 4+ (index 3 is always base)
  const colors = [a[0], a[1], a[2], ...a.slice(4)]
  const positions = CATEGORY_POSITIONS[cat] ?? [[25,30],[78,15],[48,80]]
  const blobs = colors.map((color, i) => {
    const [x, y] = positions[i] ?? [50, 50]
    return `radial-gradient(ellipse at ${x}% ${y}%, ${color} 0%, transparent 55%)`
  })
  return blobs.join(', ') + ', ' + base
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
