import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, cpf, phone } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const data: Record<string, unknown> = { name }

  // CPF — limpa e valida
  if (cpf !== undefined) {
    const cpfClean = typeof cpf === 'string' && cpf.replace(/\D/g, '').length === 11
      ? cpf.replace(/\D/g, '') : null
    if (cpfClean) {
      const cpfExists = await prisma.user.findFirst({
        where: { cpf: cpfClean, id: { not: session.userId } },
      })
      if (cpfExists) return NextResponse.json({ error: 'CPF já cadastrado em outra conta' }, { status: 409 })
    }
    data.cpf = cpfClean
  }

  // Telefone
  if (phone !== undefined) {
    data.phone = phone || null
  }

  const user = await prisma.user.update({ where: { id: session.userId }, data })
  return NextResponse.json({ ok: true, name: user.name })
}
