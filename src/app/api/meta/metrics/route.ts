import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { fetchMetaMetrics, fetchMonthlyData, getMockMetrics, getMockMonthlyData } from '@/lib/meta'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clientId   = req.nextUrl.searchParams.get('clientId')
  const datePreset = req.nextUrl.searchParams.get('datePreset') ?? 'last_30d'

  if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

  const client = await prisma.client.findFirst({ where: { id: clientId, userId: session.userId } })
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  if (client.accessToken) {
    try {
      const [metrics, monthly] = await Promise.all([
        fetchMetaMetrics(client.adAccountId, client.accessToken, datePreset),
        fetchMonthlyData(client.adAccountId, client.accessToken),
      ])
      return NextResponse.json({ metrics, monthly, mock: false })
    } catch (err) {
      console.error('Meta API error:', err)
      return NextResponse.json({ error: 'Erro ao buscar dados da Meta API. Verifique o token.' }, { status: 502 })
    }
  }

  return NextResponse.json({ metrics: getMockMetrics(), monthly: getMockMonthlyData(), mock: true })
}
