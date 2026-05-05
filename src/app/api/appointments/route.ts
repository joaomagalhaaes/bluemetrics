import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const period = req.nextUrl.searchParams.get('period')
    const sinceParam = req.nextUrl.searchParams.get('since')
    const untilParam = req.nextUrl.searchParams.get('until')
    const clientIdParam = req.nextUrl.searchParams.get('clientId')

    let dateFilter = {}
    const now = new Date()

    if (sinceParam && untilParam) {
      const start = new Date(sinceParam + 'T00:00:00')
      const end = new Date(untilParam + 'T23:59:59.999')
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        dateFilter = { date: { gte: start, lte: end } }
      }
    } else if (period === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0)
      const end = new Date(now); end.setHours(23, 59, 59, 999)
      dateFilter = { date: { gte: start, lte: end } }
    } else if (period === 'yesterday') {
      const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0)
      const end = new Date(now); end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999)
      dateFilter = { date: { gte: start, lte: end } }
    } else if (period === 'last_7d') {
      const start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0)
      dateFilter = { date: { gte: start } }
    } else if (period === 'last_30d') {
      const start = new Date(now); start.setDate(start.getDate() - 30); start.setHours(0, 0, 0, 0)
      dateFilter = { date: { gte: start } }
    } else if (period === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      dateFilter = { date: { gte: start, lte: end } }
    } else if (period === 'week') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      dateFilter = { date: { gte: start } }
    } else if (period === 'this_month' || period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      dateFilter = { date: { gte: start } }
    } else if (period === 'last_90d') {
      const start = new Date(now); start.setDate(start.getDate() - 90); start.setHours(0, 0, 0, 0)
      dateFilter = { date: { gte: start } }
    }

    // ═══ FILTRO SIMPLES: sempre por userId, opcionalmente por clientId ═══
    const where: Record<string, unknown> = {
      userId: session.userId,
      ...dateFilter,
    }

    if (clientIdParam) {
      where.clientId = clientIdParam
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, adAccountId: true } },
      },
      orderBy: { date: 'desc' },
    })

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
  } catch (err) {
    console.error('Appointments GET error:', err)
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { clientName, service, value, date, notes, clientId } = await req.json()
    if (!clientName || value === undefined || !date) {
      return NextResponse.json({ error: 'clientName, value e date são obrigatórios' }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ error: 'Selecione a conta de anúncios' }, { status: 400 })
    }

    const parsedValue = parseFloat(value)
    if (isNaN(parsedValue) || parsedValue < 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }

    // Valida que o client pertence ao user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.userId },
    })
    if (!client) {
      return NextResponse.json({ error: 'Conta de anúncios não encontrada' }, { status: 404 })
    }

    // Limite por mês
    const startOfMonth = new Date(now().getFullYear(), now().getMonth(), 1)
    const monthCount = await prisma.appointment.count({
      where: { userId: session.userId, createdAt: { gte: startOfMonth } },
    })
    if (monthCount >= 100) {
      return NextResponse.json({ error: 'Limite de agendamentos por mês atingido' }, { status: 429 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientName: clientName.trim().slice(0, 200),
        service: service ? String(service).trim().slice(0, 200) : null,
        value: parsedValue,
        date: parsedDate,
        notes: notes ? String(notes).trim().slice(0, 500) : null,
        userId: session.userId,
        clientId,
      },
    })
    return NextResponse.json(appointment)
  } catch (err) {
    console.error('Appointments POST error:', err)
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }
}

function now() { return new Date() }

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id, status, clientName, service, value, date, notes, clientId } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (clientName !== undefined) data.clientName = String(clientName).trim().slice(0, 200)
    if (service !== undefined) data.service = service ? String(service).trim().slice(0, 200) : null
    if (value !== undefined) {
      const pv = parseFloat(value)
      if (isNaN(pv) || pv < 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
      data.value = pv
    }
    if (date !== undefined) {
      const pd = new Date(date)
      if (isNaN(pd.getTime())) return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
      data.date = pd
    }
    if (notes !== undefined) data.notes = notes ? String(notes).trim().slice(0, 500) : null
    if (clientId !== undefined) data.clientId = clientId || null

    // Só edita agendamentos do PRÓPRIO user
    await prisma.appointment.updateMany({ where: { id, userId: session.userId }, data })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Appointments PUT error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Só deleta agendamentos do PRÓPRIO user
    await prisma.appointment.deleteMany({ where: { id, userId: session.userId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Appointments DELETE error:', err)
    return NextResponse.json({ error: 'Erro ao remover agendamento' }, { status: 500 })
  }
}
