import { createBrowserClient } from '@supabase/ssr'

let cached: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // only create a browser client; this prevents errors during server-side
  // rendering or build time when the environment variables may not yet exist.
  if (typeof window === 'undefined') {
    // server/build environment – return a dummy object so that imports
    // remain safe. The real client will be created on the first render in
    // the browser.
    return cached as any
  }

  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase environment variables are required but not provided.'
    )
  }

  cached = createBrowserClient(url, key)
  return cached
}
