import { createBrowserClient } from '@supabase/ssr'

let cached: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // only create a browser client; this prevents errors during server-side
  // rendering or build time when the environment variables may not yet exist.
  if (typeof window === 'undefined') {
    return null
  }

  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Missing Supabase env vars:', { url: !!url, key: !!key })
    return null
  }

  try {
    cached = createBrowserClient(url, key)
    return cached
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

