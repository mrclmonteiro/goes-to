import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_MAILTO}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type PushSub = {
  endpoint: string
  p256dh: string
  auth: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, message, url } = body as { title?: string; message?: string; url?: string }

    if (!title || !message) {
      return NextResponse.json({ error: 'title e message são obrigatórios' }, { status: 400 })
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Env SUPABASE não configuradas' }, { status: 500 })
    }

    // Validar JWT com anon key (garantidamente configurada no Vercel)
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: `JWT inválido: ${authError?.message ?? 'sem usuário'}` }, { status: 401 })
    }

    // Service role para queries de banco (bypassa RLS)
    const dbClient = serviceKey ? createClient(supabaseUrl, serviceKey) : createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: profile } = await dbClient
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: não é admin' }, { status: 403 })
    }

    const { data: subs, error: subsError } = await dbClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (subsError) {
      return NextResponse.json({ error: `Erro ao buscar subscriptions: ${subsError.message}` }, { status: 500 })
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0 })
    }

    const payload = JSON.stringify({ title, body: message, url: url || '/' })

    const results = await Promise.allSettled(
      subs.map((sub: PushSub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    // Remover subscriptions inválidas (410 Gone)
    const staleEndpoints: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number }
        if (err?.statusCode === 410) {
          staleEndpoints.push((subs[i] as PushSub).endpoint)
        }
      }
    })
    if (staleEndpoints.length > 0) {
      await dbClient
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints)
    }

    return NextResponse.json({ sent, failed })
  } catch (err) {
    console.error('Push send error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
