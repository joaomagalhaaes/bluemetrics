import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — promover a conta logada para admin (requer ADMIN_SECRET)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { secret } = await req.json()
  const ADMIN_SECRET = process.env.ADMIN_SECRET
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Código secreto inválido' }, { status: 403 })
  }

  await prisma.user.update({ where: { id: session.userId }, data: { role: 'admin' } })
  return NextResponse.json({ ok: true, message: 'Você agora é administrador!' })
}
