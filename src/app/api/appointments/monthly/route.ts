import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Retorna agendamentos e faturamento agrupados por mês (últimos 6 meses).
 * Filtra por userId. Aceita ?clientId= para filtrar por conta específica.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const clientIdParam = req.nextUrl.searchParams.get('clientId')

    const baseFilter: Record<string, unknown> = { userId: session.userId }
    if (clientIdParam) {
      baseFilter.clientId = clientIdParam
    }

    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const label = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')

      const appointments = await prisma.appointment.findMany({
        where: {
          ...baseFilter,
          date: { gte: start, lte: end },
        },
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
