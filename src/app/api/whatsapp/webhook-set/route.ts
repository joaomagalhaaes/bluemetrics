import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const EVOLUTION_URL = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''
const APP_URL       = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { instanceName } = await req.json()
  if (!instanceName) return NextResponse.json({ error: 'instanceName obrigatório' }, { status: 400 })

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 })
  }

  const webhookUrl = `${APP_URL}/api/whatsapp/webhook`

  try {
    const res = await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
      body: JSON.stringify({
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT'],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Webhook set error:', data)
      return NextResponse.json({ error: data.message ?? 'Erro ao configurar webhook' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, webhookUrl })
  } catch (e) {
    console.error('Webhook set error:', e)
    return NextResponse.json({ error: 'Erro ao conectar à Evolution API' }, { status: 500 })
  }
}
