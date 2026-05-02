import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const EVOLUTION_URL = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { instanceName } = await req.json()
  if (!instanceName) return NextResponse.json({ error: 'instanceName obrigatório' }, { status: 400 })

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 503 })
  }

  // Constrói a URL do webhook a partir do host do request
  const host = req.headers.get('host') ?? ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const webhookUrl = `${protocol}://${host}/api/whatsapp/webhook`

  const headers = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY }

  const webhookBody = {
    url: webhookUrl,
    webhook_by_events: false,
    webhook_base64: false,
    webhookByEvents: false,
    webhookBase64: false,
    events: ['MESSAGES_UPSERT'],
    enabled: true,
  }

  // Tenta diferentes endpoints da Evolution API (v1, v2 e variações)
  const endpoints = [
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`,       method: 'POST' },
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`,       method: 'PUT'  },
    { url: `${EVOLUTION_URL}/webhook/${instanceName}`,           method: 'POST' },
    { url: `${EVOLUTION_URL}/webhook/${instanceName}`,           method: 'PUT'  },
    { url: `${EVOLUTION_URL}/webhook/instance/${instanceName}`,  method: 'POST' },
    { url: `${EVOLUTION_URL}/instance/settings/${instanceName}`, method: 'PUT'  },
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

      console.log(`[webhook-set] ${ep.method} ${ep.url} → ${res.status} | ${text.slice(0, 200)}`)

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
