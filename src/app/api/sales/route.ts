import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Dado um clientId, retorna todos os clientIds que compartilham o mesmo adAccountId.
 */
async function getSameAccountClientIds(clientId: string): Promise<string[]> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { adAccountId: true },
  })
  if (!client) return [clientId]

  const sameAccount = await prisma.client.findMany({
    where: { adAccountId: client.adAccountId },
    select: { id: true },
  })
  return sameAccount.map(c => c.id)
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const period = req.nextUrl.searchParams.get('period')
    const sinceParam = req.nextUrl.searchParams.get('since')
    const untilParam = req.nextUrl.searchParams.get('until')
    const clientIdParam = req.nextUrl.searchParams.get('clientId')

    let dateFilter = {}
    // Usa horário de Brasília (UTC-3) para filtros de período
    const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))

    if (sinceParam && untilParam) {
      const start = new Date(sinceParam + 'T00:00:00-03:00')
      const end = new Date(untilParam + 'T23:59:59.999-03:00')
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        dateFilter = { date: { gte: start, lte: end } }
      }
    } else if (period === 'today') {
      const start = new Date(`${nowBR.getFullYear()}-${String(nowBR.getMonth()+1).padStart(2,'0')}-${String(nowBR.getDate()).padStart(2,'0')}T00:00:00-03:00`)
      const end = new Date(`${nowBR.getFullYear()}-${String(nowBR.getMonth()+1).padStart(2,'0')}-${String(nowBR.getDate()).padStart(2,'0')}T23:59:59.999-03:00`)
      dateFilter = { date: { gte: start, lte: end } }
    } else if (period === 'yesterday') {
      const yday = new Date(nowBR); yday.setDate(yday.getDate() - 1)
      const start = new Date(`${yday.getFullYear()}-${String(yday.getMonth()+1).padStart(2,'0')}-${String(yday.getDate()).padStart(2,'0')}T00:00:00-03:00`)
      const end = new Date(`${yday.getFullYear()}-${String(yday.getMonth()+1).padStart(2,'0')}-${String(yday.getDate()).padStart(2,'0')}T23:59:59.999-03:00`)
      dateFilter = { date: { gte: start, lte: end } }
    } else if (period === 'last_7d') {
      const d = new Date(nowBR); d.setDate(d.getDate() - 7)
      const start = new Date(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00-03:00`)
      dateFilter = { date: { gte: start } }
    } else if (period === 'last_30d') {
      const d = new Date(nowBR); d.setDate(d.getDate() - 30)
      const start = new Date(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00-03:00`)
      dateFilter = { date: { gte: start } }
    } else if (period === 'last_month') {
      const start = new Date(nowBR.getFullYear(), nowBR.getMonth() - 1, 1)
      const end = new Date(nowBR.getFullYear(), nowBR.getMonth(), 0, 23, 59, 59, 999)
      dateFilter = { date: { gte: start, lte: end } }
    } else if (period === 'week') {
      const d = new Date(nowBR)
      d.setDate(nowBR.getDate() - nowBR.getDay())
      const start = new Date(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00-03:00`)
      dateFilter = { date: { gte: start } }
    } else if (period === 'this_month' || period === 'month') {
      const start = new Date(`${nowBR.getFullYear()}-${String(nowBR.getMonth()+1).padStart(2,'0')}-01T00:00:00-03:00`)
      dateFilter = { date: { gte: start } }
    } else if (period === 'last_90d') {
      const d = new Date(nowBR); d.setDate(d.getDate() - 90)
      const start = new Date(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00-03:00`)
      dateFilter = { date: { gte: start } }
    }

    let where: Record<string, unknown>

    if (clientIdParam) {
      const sharedClientIds = await getSameAccountClientIds(clientIdParam)
      where = { clientId: { in: sharedClientIds }, ...dateFilter }
    } else {
      const userClients = await prisma.client.findMany({
        where: { userId: session.userId },
        select: { id: true },
      })
      const userClientIds = userClients.map(c => c.id)

      if (userClientIds.length > 0) {
        const allSharedIds: string[] = []
        for (const cid of userClientIds) {
          const shared = await getSameAccountClientIds(cid)
          for (const sid of shared) {
            if (allSharedIds.indexOf(sid) === -1) allSharedIds.push(sid)
          }
        }
        where = { clientId: { in: allSharedIds }, ...dateFilter }
      } else {
        where = { userId: session.userId, ...dateFilter }
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, adAccountId: true } },
      },
      orderBy: { date: 'desc' },
    })

    const total = sales.length
    const totalValue = sales.reduce((s, a) => s + a.value, 0)
    const completed = sales.filter(a => a.status === 'completed')
    const completedValue = completed.reduce((s, a) => s + a.value, 0)
    const cancelled = sales.filter(a => a.status === 'cancelled')

    return NextResponse.json({
      sales,
      summary: {
        total,
        totalValue,
        completed: completed.length,
        completedValue,
        cancelled: cancelled.length,
      },
    })
  } catch (err) {
    console.error('Sales GET error:', err)
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { product, clientName, value, date, notes, clientId } = await req.json()
    if (!product || !clientName || value === undefined) {
      return NextResponse.json({ error: 'Produto, nome do cliente e valor são obrigatórios' }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ error: 'Selecione a conta de anúncios' }, { status: 400 })
    }

    const parsedValue = parseFloat(value)
    if (isNaN(parsedValue) || parsedValue < 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    const parsedDate = date ? new Date(date) : new Date()
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

    const sale = await prisma.sale.create({
      data: {
        product: product.trim().slice(0, 200),
        clientName: clientName.trim().slice(0, 200),
        value: parsedValue,
        date: parsedDate,
        notes: notes ? String(notes).trim().slice(0, 500) : null,
        userId: session.userId,
        clientId,
      },
    })
    return NextResponse.json(sale)
  } catch (err) {
    console.error('Sales POST error:', err)
    return NextResponse.json({ error: 'Erro ao criar venda' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id, status, product, clientName, value, date, notes, clientId } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    if (status && !['completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { client: { select: { adAccountId: true } } },
    })
    if (!sale) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    let hasAccess = sale.userId === session.userId
    if (!hasAccess && sale.client) {
      const userHas = await prisma.client.findFirst({
        where: { userId: session.userId, adAccountId: sale.client.adAccountId },
      })
      hasAccess = !!userHas
    }
    if (!hasAccess) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (product !== undefined) data.product = String(product).trim().slice(0, 200)
    if (clientName !== undefined) data.clientName = String(clientName).trim().slice(0, 200)
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

    await prisma.sale.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Sales PUT error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar venda' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { client: { select: { adAccountId: true } } },
    })
    if (!sale) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    let hasAccess = sale.userId === session.userId
    if (!hasAccess && sale.client) {
      const userHas = await prisma.client.findFirst({
        where: { userId: session.userId, adAccountId: sale.client.adAccountId },
      })
      hasAccess = !!userHas
    }
    if (!hasAccess) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    await prisma.sale.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Sales DELETE error:', err)
    return NextResponse.json({ error: 'Erro ao remover venda' }, { status: 500 })
  }
}
