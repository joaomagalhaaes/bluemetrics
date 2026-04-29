import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EVOLUTION_URL = process.env.EVOLUTION_API_URL ?? ''
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? ''

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const instanceName = req.nextUrl.searchParams.get('instance')
  if (!instanceName) return NextResponse.json({ error: 'instance obrigatório' }, { status: 400 })

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return NextResponse.json({ state: 'unknown' })
  }

  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_KEY },
    })
    const data = await res.json()
    // { instance: { instanceName, state: 'open' | 'connecting' | 'close' } }
    const state: string = data?.instance?.state ?? data?.state ?? 'unknown'

    // Atualiza status no banco
    await prisma.whatsappInstance.updateMany({
      where: { instanceName, userId: session.userId },
      data: { status: state },
    })

    return NextResponse.json({ state })
  } catch (e) {
    console.error('Status error:', e)
    return NextResponse.json({ state: 'unknown' })
  }
}
