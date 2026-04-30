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

  // Body com ambos os formatos (camelCase v1 e snake_case v2)
  const body = {
    url: webhookUrl,
    webhook_by_events: false,
    webhook_base64: false,
    webhookByEvents: false,
    webhookBase64: false,
    events: ['MESSAGES_UPSERT'],
    enabled: true,
  }

  // Tenta diferentes endpoints da Evolution API (v1 e v2)
  const endpoints = [
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`, method: 'POST' },
    { url: `${EVOLUTION_URL}/webhook/set/${instanceName}`, method: 'PUT' },
    { url: `${EVOLUTION_URL}/webhook/instance/${instanceName}`, method: 'POST' },
    { url: `${EVOLUTION_URL}/webhook/instance/${instanceName}`, method: 'PUT' },
  ]

  let lastError = ''

  for (const ep of endpoints) {
    try {
      console.log(`[webhook-set] Tentando ${ep.method} ${ep.url}`)
      const res = await fetch(ep.url, {
        method: ep.method,
        headers,
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))
      console.log(`[webhook-set] ${ep.method} ${ep.url} → ${res.status}`, JSON.stringify(data))

      if (res.ok) {
        return NextResponse.json({ ok: true, webhookUrl, endpoint: ep.url })
      }

      lastError = data.message ?? data.error ?? `Status ${res.status}`
    } catch (e) {
      console.error(`[webhook-set] ${ep.method} ${ep.url} falhou:`, e)
      lastError = String(e)
    }
  }

  // Se nenhum endpoint funcionou, tenta configurar via settings da instância
  try {
    console.log(`[webhook-set] Tentando via settings da instância`)
    const res = await fetch(`${EVOLUTION_URL}/instance/settings/${instanceName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        webhook_url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        webhook_events: ['MESSAGES_UPSERT'],
      }),
    })
    const data = await res.json().catch(() => ({}))
    console.log(`[webhook-set] settings → ${res.status}`, JSON.stringify(data))
    if (res.ok) {
      return NextResponse.json({ ok: true, webhookUrl, endpoint: 'settings' })
    }
  } catch (e) {
    console.error('[webhook-set] settings falhou:', e)
  }

  return NextResponse.json({
    error: `Não foi possível configurar o webhook. Configure manualmente no Evolution API. URL: ${webhookUrl}`,
    webhookUrl,
    lastError,
  }, { status: 500 })
}
