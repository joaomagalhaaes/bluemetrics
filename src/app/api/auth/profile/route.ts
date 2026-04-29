import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  const user = await prisma.user.update({ where: { id: session.userId }, data: { name } })
  return NextResponse.json({ ok: true, name: user.name })
}
