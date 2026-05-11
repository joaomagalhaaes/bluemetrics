import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Salva o pixel selecionado no client
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { clientId, pixelId } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })

    await prisma.client.update({
      where: { id: clientId },
      data: { pixelId: pixelId || null },
    })

    return NextResponse.json({ ok: true, pixelId })
  } catch (err) {
    console.error('Set pixel error:', err)
    return NextResponse.json({ error: 'Erro ao salvar pixel' }, { status: 500 })
  }
}
