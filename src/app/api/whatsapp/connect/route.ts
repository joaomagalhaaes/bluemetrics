import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVOLUTION_URL = process.env.EVOLUTION_API_URL ?? ''
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const instances = await prisma.whatsappInstance.findMany({ where: { userId: session.userId } })
  return NextResponse.json(instances)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { instanceName } = await req.json()
  if (!instanceName) return NextResponse.json({ error: 'Nome da instância obrigatório' }, { status: 400 })

  // Cria instância no banco
  const existing = await prisma.whatsappInstance.findFirst({ where: { instanceName, userId: session.userId } })
  if (existing) return NextResponse.json(existing)

  const instance = await prisma.whatsappInstance.create({
    data: { instanceName, userId: session.userId, status: 'connecting' },
  })

  // Se Evolution API estiver configurada, cria lá também
  if (EVOLUTION_URL && EVOLUTION_KEY) {
    try {
      await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({
          instanceName,
          token: '',
          qrcode: true,
          webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
          webhookByEvents: false,
          events: ['MESSAGES_UPSERT'],
        }),
      })
    } catch (e) {
      console.error('Evolution API error:', e)
    }
  }

  return NextResponse.json(instance)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  await prisma.whatsappInstance.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
