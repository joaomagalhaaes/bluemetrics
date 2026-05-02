import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, role: true } })
  if (!user || user.role !== 'admin') return null
  return user
}

// GET — listar todos os usuários (sem senhas, sem dados sensíveis de negócio)
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      suspended: true,
      createdAt: true,
      _count: { select: { appointments: true, clients: true, leads: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

// PUT — suspender, reativar ou alterar role
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { userId, action } = await req.json()
  if (!userId || !action) return NextResponse.json({ error: 'userId e action obrigatórios' }, { status: 400 })

  // Impedir que o admin se auto-suspenda
  if (userId === admin.id && (action === 'suspend' || action === 'delete')) {
    return NextResponse.json({ error: 'Você não pode suspender/excluir sua própria conta' }, { status: 400 })
  }

  if (action === 'suspend') {
    await prisma.user.update({ where: { id: userId }, data: { suspended: true } })
    return NextResponse.json({ ok: true, message: 'Conta suspensa' })
  }

  if (action === 'reactivate') {
    await prisma.user.update({ where: { id: userId }, data: { suspended: false } })
    return NextResponse.json({ ok: true, message: 'Conta reativada' })
  }

  if (action === 'delete') {
    // Deletar em cascata: appointments, clients, leads, etc.
    await prisma.appointment.deleteMany({ where: { userId } })
    await prisma.conversation.deleteMany({ where: { lead: { userId } } })
    await prisma.lead.deleteMany({ where: { userId } })
    await prisma.client.deleteMany({ where: { userId } })
    await prisma.whatsappInstance.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ ok: true, message: 'Conta excluída permanentemente' })
  }

  return NextResponse.json({ error: 'Ação inválida. Use: suspend, reactivate ou delete' }, { status: 400 })
}
