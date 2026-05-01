import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const period = req.nextUrl.searchParams.get('period') // 'week' | 'month' | 'all'

  let dateFilter = {}
  if (period === 'week') {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // domingo
    startOfWeek.setHours(0, 0, 0, 0)
    dateFilter = { date: { gte: startOfWeek } }
  } else if (period === 'month') {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    dateFilter = { date: { gte: startOfMonth } }
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId: session.userId, ...dateFilter },
    orderBy: { date: 'desc' },
  })

  // Totais
  const total = appointments.length
  const totalValue = appointments.reduce((s, a) => s + a.value, 0)
  const completed = appointments.filter(a => a.status === 'completed')
  const completedValue = completed.reduce((s, a) => s + a.value, 0)
  const scheduled = appointments.filter(a => a.status === 'scheduled')
  const cancelled = appointments.filter(a => a.status === 'cancelled')

  return NextResponse.json({
    appointments,
    summary: {
      total,
      totalValue,
      completed: completed.length,
      completedValue,
      scheduled: scheduled.length,
      cancelled: cancelled.length,
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { clientName, service, value, date, notes } = await req.json()
  if (!clientName || value === undefined || !date) {
    return NextResponse.json({ error: 'clientName, value e date são obrigatórios' }, { status: 400 })
  }

  // Limite de 30 agendamentos por mês
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthCount = await prisma.appointment.count({
    where: { userId: session.userId, date: { gte: startOfMonth } },
  })
  if (monthCount >= 30) {
    return NextResponse.json({ error: 'Limite de 30 agendamentos por mês atingido' }, { status: 429 })
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientName,
      service: service ?? null,
      value: parseFloat(value),
      date: new Date(date),
      notes: notes ?? null,
      userId: session.userId,
    },
  })
  return NextResponse.json(appointment)
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, status, clientName, service, value, date, notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (status !== undefined) data.status = status
  if (clientName !== undefined) data.clientName = clientName
  if (service !== undefined) data.service = service
  if (value !== undefined) data.value = parseFloat(value)
  if (date !== undefined) data.date = new Date(date)
  if (notes !== undefined) data.notes = notes

  await prisma.appointment.updateMany({ where: { id, userId: session.userId }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  await prisma.appointment.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
