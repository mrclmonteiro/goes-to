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
      next: { revalidate: 3600 } // cache for 1 hour
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
  const data = await get(`/search/movie?query=${encodeURIComponent(title)}&language=en-US`)
  
  if (!data) {
    console.warn(`No TMDB data for: ${title}`)
    return null
  }
  
  const movie = data?.results?.[0]
  if (!movie) {
    console.warn(`No results for: ${title}`)
    return null
  }
  
  return {
    id: movie.id,
    poster: movie.poster_path ? IMG('w342') + movie.poster_path : null,
    backdrop: movie.backdrop_path ? IMG('w1280') + movie.backdrop_path : null,
    overview: movie.overview ?? null,
  }
}

export async function fetchMovieDetails(tmdbId: number) {
  const [details, credits, keywords, watchProviders] = await Promise.all([
    get(`/movie/${tmdbId}?language=pt-BR&append_to_response=releases`),
    get(`/movie/${tmdbId}/credits?language=pt-BR`),
    get(`/movie/${tmdbId}/keywords`),
    get(`/movie/${tmdbId}/watch/providers`),
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

  return {
    tmdbId,
    tagline: details.tagline ?? null,
    overview: details.overview ?? null,
    genres: details.genres?.map((g: any) => g.name) ?? [],
    runtime: details.runtime ?? null,
    budget: details.budget ?? null,
    revenue: details.revenue ?? null,
    releaseDate: details.release_date ?? null,
    backdrop: details.backdrop_path ? IMG('w1280') + details.backdrop_path : null,
    poster: details.poster_path ? IMG('w342') + details.poster_path : null,
    director: director ? { name: director.name, photo: director.profile_path ? IMG('w185') + director.profile_path : null } : null,
    writers: writers.map((w: any) => ({ name: w.name, job: w.job })),
    cast,
    keywords: keywords?.keywords?.slice(0, 10).map((k: any) => k.name) ?? [],
    streaming,
    productionCompanies: details.production_companies?.slice(0, 3).map((c: any) => c.name) ?? [],
  }
}

export async function fetchPersonPhoto(name: string): Promise<string | null> {
  const data = await get(`/search/person?query=${encodeURIComponent(name)}&language=en-US`)
  const person = data?.results?.[0]
  return person?.profile_path ? IMG('w185') + person.profile_path : null
}

export async function fetchAllMovieData(titles: string[]): Promise<Record<string, {
  id: number | null; poster: string | null; backdrop: string | null; overview: string | null
}>> {
  const pairs = await Promise.all(titles.map(async t => [t, await fetchMovieData(t)] as const))
  return Object.fromEntries(pairs.map(([t, d]) => [t, d ?? { id: null, poster: null, backdrop: null, overview: null }]))
}

export async function fetchSimilarMovies(tmdbId: number): Promise<{ title: string; poster: string | null; tmdbId: number }[]> {
  const data = await get(`/movie/${tmdbId}/similar?language=pt-BR`)
  return (data?.results ?? []).slice(0, 10).map((m: any) => ({
    title: m.title,
    poster: m.poster_path ? IMG('w342') + m.poster_path : null,
    tmdbId: m.id,
  }))
}
