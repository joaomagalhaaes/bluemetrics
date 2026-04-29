import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const leads = await prisma.lead.findMany({
    where: { userId: session.userId },
    include: { conversations: { orderBy: { timestamp: 'desc' }, take: 1 } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { name, phone, adSource, adCampaign, clientId, notes } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
  const lead = await prisma.lead.create({
    data: { name, phone, adSource, adCampaign, clientId, notes, userId: session.userId },
  })
  return NextResponse.json(lead)
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id, status, name, notes } = await req.json()
  const data: Record<string, unknown> = { status, name, notes, updatedAt: new Date() }
  if (status === 'closed') data.closedAt = new Date()
  const lead = await prisma.lead.updateMany({ where: { id, userId: session.userId }, data })
  return NextResponse.json(lead)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  await prisma.lead.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
