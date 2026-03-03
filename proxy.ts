import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip middleware if env vars are missing
  if (!url || !key) {
    return response
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && request.nextUrl.pathname.startsWith('/filmes')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    // If there's an error with Supabase, let the request continue
    // This prevents the app from getting stuck during auth checks
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: ['/filmes/:path*'],
}
