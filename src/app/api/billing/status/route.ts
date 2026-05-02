import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })

  if (user?.role === 'admin') {
    return NextResponse.json({ status: 'admin', allowed: true })
  }

  const sub = await prisma.subscription.findUnique({ where: { userId: session.userId } })
  if (!sub) return NextResponse.json({ status: 'none', allowed: false })

  const now = new Date()

  // Auto-suspender se período de graça expirou
  if (sub.status === 'grace' && sub.gracePeriodEnd && sub.gracePeriodEnd < now) {
    await prisma.subscription.update({
      where: { userId: session.userId },
      data: { status: 'suspended', suspendedAt: now },
    })
    return NextResponse.json({ ...sub, status: 'suspended', allowed: false })
  }

  const allowed = ['active', 'trial', 'grace'].includes(sub.status) &&
    (sub.status !== 'trial' || !sub.trialEnd || sub.trialEnd > now)

  return NextResponse.json({ ...sub, allowed })
}
