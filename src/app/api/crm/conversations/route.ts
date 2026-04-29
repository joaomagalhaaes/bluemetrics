import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const leadId = req.nextUrl.searchParams.get('leadId')
  if (!leadId) return NextResponse.json({ error: 'leadId obrigatório' }, { status: 400 })
  // Verifica se o lead pertence ao usuário
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.userId } })
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  const convs = await prisma.conversation.findMany({
    where: { leadId },
    orderBy: { timestamp: 'asc' },
  })
  return NextResponse.json({ lead, conversations: convs })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { leadId, message, fromMe } = await req.json()
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.userId } })
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  const conv = await prisma.conversation.create({ data: { leadId, message, fromMe: fromMe ?? true } })
  await prisma.lead.update({ where: { id: leadId }, data: { updatedAt: new Date() } })
  return NextResponse.json(conv)
}
