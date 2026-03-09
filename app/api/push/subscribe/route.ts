import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription } = body as { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } }

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Validar JWT com anon key (garantidamente configurada no Vercel)
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: `JWT inválido: ${authError?.message ?? 'sem usuário'}` }, { status: 401 })
    }

    // Service role para contornar RLS; cai no anon se não configurado
    const dbClient = serviceKey ? createClient(supabaseUrl, serviceKey) : anonClient

    const { error } = await dbClient.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: `Server error: ${String(err)}` }, { status: 500 })
  }
}
