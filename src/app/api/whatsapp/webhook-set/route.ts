import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const EVOLUTION_URL = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { instanceName } = await req.json()
  if (!instanceName) return NextResponse.json({ error: 'instanceName obrigatório' }, { status: 400 })

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return NextResponse.json({ error: 'Evolution API não configurada. Variáveis EVOLUTION_API_URL e EVOLUTION_API_KEY são necessárias.' }, { status: 503 })
  }

  // Constrói a URL do webhook a partir do host do request
  const host = req.headers.get('host') ?? ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const webhookUrl = `${protocol}://${host}/api/whatsapp/webhook`

  const headers = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY }

  // Evolution API v2.x webhook body
  const webhookBody = {
    url: webhookUrl,
    webhookByEvents: false,
    webhookBase64: false,
    events: [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'MESSAGES_DELETE',
      'SEND_MESSAGE',
      'CONNECTION_UPDATE',
      'CONTACTS_UPSERT',
      'CHATS_UPSERT',
      'CHATS_UPDATE',
      'CHATS_SET',
      'PRESENCE_UPDATE',
      'GROUPS_UPSERT',
      'GROUP_UPDATE',
      'CALL',
      'QRCODE_UPDATED',
    ],
    enabled: true,
  }

  // Tenta os endpoints da Evolution API v2 e v1
  const endpoints = [
    // Evolution v2.x
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`, method: 'PUT' },
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`, method: 'POST' },
    // Evolution v2.x alternativo
    { url: `${EVOLUTION_URL}/webhook/${instanceName}`, method: 'PUT' },
    { url: `${EVOLUTION_URL}/webhook/${instanceName}`, method: 'POST' },
    // Evolution v1.x
    { url: `${EVOLUTION_URL}/webhook/instance/${instanceName}`, method: 'POST' },
  ]

  const errors: string[] = []

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers,
        body: JSON.stringify(webhookBody),
      })

      const text = await res.text()
      let data: Record<string, unknown> = {}
      try { data = JSON.parse(text) } catch { data = { raw: text } }

      console.log(`[webhook-set] ${ep.method} ${ep.url} → ${res.status} | ${text.slice(0, 300)}`)

      if (res.ok) {
        return NextResponse.json({ ok: true, webhookUrl, endpoint: ep.url })
      }

      errors.push(`${ep.method} ${ep.url} → ${res.status}: ${data.message ?? data.error ?? text.slice(0, 100)}`)
    } catch (e) {
      const msg = String(e)
      console.error(`[webhook-set] ${ep.method} ${ep.url} falhou:`, msg)
      errors.push(`${ep.method} ${ep.url} → ${msg.slice(0, 100)}`)
    }
  }

  console.error('[webhook-set] Todos os endpoints falharam:', errors)

  return NextResponse.json({
    error: `Não foi possível configurar o webhook. Configure manualmente no Evolution API. URL: ${webhookUrl}`,
    webhookUrl,
    errors,
  }, { status: 500 })
}
