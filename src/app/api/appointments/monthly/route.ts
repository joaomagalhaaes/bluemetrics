import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const clientIdParam = req.nextUrl.searchParams.get('clientId')

    // Monta filtro por clientId (respeitando compartilhamento por adAccountId)
    let clientFilter: Record<string, unknown> = {}

    if (clientIdParam) {
      const client = await prisma.client.findUnique({
        where: { id: clientIdParam },
        select: { adAccountId: true },
      })
      if (client) {
        const sameAccount = await prisma.client.findMany({
          where: { adAccountId: client.adAccountId },
          select: { id: true },
        })
        clientFilter = { clientId: { in: sameAccount.map(c => c.id) } }
      }
    } else {
      // Sem filtro: pega todos os clients do user + compartilhados
      const userClients = await prisma.client.findMany({
        where: { userId: session.userId },
        select: { id: true, adAccountId: true },
      })
      if (userClients.length > 0) {
        const adAccountIds = userClients.map(c => c.adAccountId)
        const adAccountIdsUnique = adAccountIds.filter((id, i) => adAccountIds.indexOf(id) === i)
        const allClients = await prisma.client.findMany({
          where: { adAccountId: { in: adAccountIdsUnique } },
          select: { id: true },
        })
        clientFilter = { clientId: { in: allClients.map(c => c.id) } }
      } else {
        clientFilter = { userId: session.userId }
      }
    }

    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const label = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')

      const appointments = await prisma.appointment.findMany({
        where: { ...clientFilter, date: { gte: start, lte: end } },
        select: { value: true, status: true },
      })

      const total = appointments.length
      const completed = appointments.filter(a => a.status === 'completed')
      const revenue = completed.reduce((sum, a) => sum + a.value, 0)

      months.push({ month: label, appointments: total, revenue })
    }

    return NextResponse.json(months)
  } catch (err) {
    console.error('Monthly appointments error:', err)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
