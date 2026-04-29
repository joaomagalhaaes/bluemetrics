import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clients = await prisma.client.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, adAccountId, accessToken, appId, appSecret } = await req.json()
  if (!name || !adAccountId) {
    return NextResponse.json({ error: 'Nome e Ad Account ID são obrigatórios' }, { status: 400 })
  }

  const client = await prisma.client.create({
    data: {
      name,
      adAccountId,
      accessToken: accessToken || null,
      appId: appId || null,
      appSecret: appSecret || null,
      userId: session.userId,
    },
  })
  return NextResponse.json(client)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.client.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
