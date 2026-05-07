import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { setInstanceWebhook } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { instanceName } = await req.json()
  if (!instanceName) return NextResponse.json({ error: 'instanceName obrigatório' }, { status: 400 })

  const host = req.headers.get('host') ?? ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const webhookUrl = `${protocol}://${host}/api/whatsapp/webhook`

  const result = await setInstanceWebhook(instanceName, webhookUrl)

  if (result.ok) {
    return NextResponse.json({ ok: true, webhookUrl })
  }

  return NextResponse.json({
    error: `Não foi possível configurar o webhook. Configure manualmente no Evolution API. URL: ${webhookUrl}`,
    webhookUrl,
  }, { status: 500 })
}
