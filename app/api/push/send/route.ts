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

    // Verificar autenticação e admin via JWT no header Authorization
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: subs } = await serviceClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

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
      await serviceClient
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
