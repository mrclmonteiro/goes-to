/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE = 'https://api.themoviedb.org/3'
const IMG = (size: string) => `https://image.tmdb.org/t/p/${size}`

async function get(path: string) {
  const token = process.env.NEXT_PUBLIC_TMDB_TOKEN
  
  if (!token) {
    console.warn('TMDB token not configured')
    return null
  }

  try {
    const res = await fetch(`${BASE}${path}`, { 
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 3600 }
    })
    
    if (!res.ok) {
      console.warn(`TMDB API error: ${res.status} ${res.statusText}`)
      return null
    }
    
    return res.json()
  } catch (error) {
    console.warn('TMDB fetch error:', error)
    return null
  }
}

export async function fetchMovieData(title: string) {
  // Tenta buscar em EN primeiro; se não achar, tenta em pt-BR (filmes com título em português no DB)
  let data = await get(`/search/movie?query=${encodeURIComponent(title)}&language=en-US`)
  let movie = data?.results?.[0]

  if (!movie) {
    data = await get(`/search/movie?query=${encodeURIComponent(title)}&language=pt-BR`)
    movie = data?.results?.[0]
  }

  if (!movie) {
    console.warn(`No TMDB results for: ${title}`)
    return null
  }

  // Busca título em pt-BR e imagens em paralelo
  const [ptDetails, images] = await Promise.all([
    get(`/movie/${movie.id}?language=pt-BR`),
    get(`/movie/${movie.id}/images?include_image_language=en,null`),
  ])

  const posterPath = ptDetails?.poster_path ?? movie.poster_path

  const backdrops: string[] = (images?.backdrops ?? [])
    .filter((b: any) => b.file_path)
    .sort((a: any, b: any) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, 6)
    .map((b: any) => IMG('w1280') + b.file_path)

  if (backdrops.length === 0 && movie.backdrop_path) {
    backdrops.push(IMG('w1280') + movie.backdrop_path)
  }

  return {
    ptTitle: ptDetails?.title ?? movie.title ?? null,
    id: movie.id,
    poster: posterPath ? IMG('w342') + posterPath : null,
    backdrop: backdrops[0] ?? null,
    backdrops,
    overview: movie.overview ?? null,
  }
}

export async function fetchPersonPhoto(name: string): Promise<string | null> {
  const data = await get(`/search/person?query=${encodeURIComponent(name)}&language=en-US`)
  const person = data?.results?.[0]
  if (!person?.profile_path) return null
  return IMG('w185') + person.profile_path
}

// Returns TMDB movie credits (id + title) for a person by name
export async function fetchPersonMovieIds(name: string): Promise<{ id: number; title: string }[]> {
  const data = await get(`/search/person?query=${encodeURIComponent(name)}&language=en-US`)
  const person = data?.results?.[0]
  if (!person?.id) return []
  const credits = await get(`/person/${person.id}/movie_credits?language=en-US`)
  const seen = new Set<number>()
  const result: { id: number; title: string }[] = []
  for (const c of [...(credits?.cast ?? []), ...(credits?.crew ?? [])]) {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      result.push({ id: c.id, title: c.title ?? '' })
    }
  }
  return result
}

// Picks the best logo: always prefer English PNGs (transparent bg).
// We never use pt logos because TMDB doesn't reliably distinguish pt-BR from pt-PT.
// The caller must apply filter: brightness(0) invert(1) to guarantee white rendering.
function pickLogo(images: any): string | null {
  const logos: any[] = images?.logos ?? []
  if (!logos.length) return null
  const scored = logos
    .filter((l: any) => l.file_path)
    .map((l: any) => {
      let score = 0
      if (l.iso_639_1 === 'en') score += 200
      // exclude pt logos entirely to avoid showing pt-PT by mistake
      if (l.iso_639_1 === 'pt') score -= 999
        if (l.file_path.endsWith('.png')) score += 50
        score += (l.vote_average ?? 0)
        return { ...l, score }
      })
      .sort((a: any, b: any) => b.score - a.score)
    const best = scored[0]
    return best ? IMG('w500') + best.file_path : null
}

// Picks the best poster image preferring pt-BR/pt language, then English, then highest vote_average
function pickPoster(images: any, hasPtBR = false): string | null {
  const posters: any[] = images?.posters ?? []
  if (!posters.length) return null
  const scored = posters
    .filter((p: any) => p.file_path)
    .map((p: any) => {
      let score = 0
      if (p.iso_639_1 === 'en') {
        score += 100
      }
      if (p.iso_639_1 === 'pt') {
        score += hasPtBR ? 200 : -10
      }
      score += (p.vote_average ?? 0)
      return { ...p, score }
    })
    .sort((a: any, b: any) => b.score - a.score)
  const best = scored[0]
  return best ? IMG('w342') + best.file_path : null
}

export async function fetchMovieDetails(tmdbId: number) {
  const [details, credits, keywords, watchProviders, images] = await Promise.all([
    // include translations so we can detect pt-BR vs pt-PT
    get(`/movie/${tmdbId}?language=pt-BR&append_to_response=releases,translations`),
    get(`/movie/${tmdbId}/credits?language=pt-BR`),
    get(`/movie/${tmdbId}/keywords`),
    get(`/movie/${tmdbId}/watch/providers`),
    // request posters/logos prioritizing Portuguese, then English, then neutral
    get(`/movie/${tmdbId}/images?include_image_language=pt-BR,pt,en,null`),
  ])
  if (!details) return null

  const director = credits?.crew?.find((c: any) => c.job === 'Director')
  const writers = credits?.crew?.filter((c: any) => ['Screenplay', 'Writer', 'Story'].includes(c.job)).slice(0, 3) ?? []
  const cast = credits?.cast?.slice(0, 15).map((c: any) => ({
    name: c.name,
    character: c.character,
    photo: c.profile_path ? IMG('w185') + c.profile_path : null,
  })) ?? []

  const brProviders = watchProviders?.results?.BR
  const streaming = [
    ...(brProviders?.flatrate ?? []),
    ...(brProviders?.rent ?? []),
  ].filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.provider_id === v.provider_id) === i)
    .slice(0, 6)
    .map((p: any) => ({
      name: p.provider_name,
      logo: p.logo_path ? IMG('w92') + p.logo_path : null,
    }))

  const hasPtBR = Boolean(
    details.translations?.translations?.some((t: any) =>
      t.iso_639_1 === 'pt' && t.iso_3166_1 === 'BR'
    )
  )
  return {
    tmdbId,
    tagline: details.tagline ?? null,
    overview: details.overview ?? null,
    ptTitle: details.title ?? null,
    genres: details.genres?.map((g: any) => g.name) ?? [],
    runtime: details.runtime ?? null,
    budget: details.budget ?? null,
    revenue: details.revenue ?? null,
    releaseDate: details.release_date ?? null,
    backdrop: details.backdrop_path ? IMG('w1280') + details.backdrop_path : null,
    poster: pickPoster(images, hasPtBR) ?? (details.poster_path ? IMG('w342') + details.poster_path : null),
    logo: pickLogo(images),
    director: director ? { name: director.name, photo: director.profile_path ? IMG('w185') + director.profile_path : null } : null,
    writers: writers.map((w: any) => ({ name: w.name, job: w.job })),
    cast,
    keywords: keywords?.keywords?.slice(0, 10).map((k: any) => k.name) ?? [],
    streaming,
    productionCompanies: details.production_companies?.slice(0, 3).map((c: any) => c.name) ?? [],
  }
}

export async function fetchAllMovieData(titles: string[]): Promise<Record<string, {
  ptTitle: string | null; poster: string | null; backdrop: string | null; backdrops: string[]; overview: string | null; tmdbId: number | null
}>> {
  const pairs = await Promise.all(titles.map(async t => [t, await fetchMovieData(t)] as const))
  return Object.fromEntries(pairs.map(([t, d]) => [t, d
    ? { ptTitle: d.ptTitle, poster: d.poster, backdrop: d.backdrop, backdrops: d.backdrops, overview: d.overview, tmdbId: d.id ?? null }
    : { ptTitle: null, poster: null, backdrop: null, backdrops: [], overview: null, tmdbId: null }
  ]))
}

export async function fetchSimilarMovies(tmdbId: number): Promise<{ title: string; poster: string | null; tmdbId: number }[]> {
  const data = await get(`/movie/${tmdbId}/similar?language=pt-BR`)
  return (data?.results ?? []).slice(0, 10).map((m: any) => ({
    title: m.title,
    poster: m.poster_path ? IMG('w342') + m.poster_path : null,
    tmdbId: m.id,
  }))
}