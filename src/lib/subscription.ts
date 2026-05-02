import { prisma } from './prisma'

export function addBusinessDays(date: Date, days: number): Date {
  let count = 0
  const result = new Date(date)
  while (count < days) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return result
}

export async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } })
}

export type SubscriptionCheck =
  | { allowed: true; status: string; banner: 'trial_warning' | 'grace_warning' | null; daysLeft?: number }
  | { allowed: false; reason: 'no_subscription' | 'trial_expired' | 'suspended' | 'cancelled' }

export async function checkSubscription(userId: string, role: string): Promise<SubscriptionCheck> {
  if (role === 'admin') return { allowed: true, status: 'admin', banner: null }

  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub) return { allowed: false, reason: 'no_subscription' }

  const now = new Date()

  if (sub.status === 'active') {
    return { allowed: true, status: 'active', banner: null }
  }

  if (sub.status === 'trial') {
    if (!sub.trialEnd || sub.trialEnd < now) {
      return { allowed: false, reason: 'trial_expired' }
    }
    const msLeft = sub.trialEnd.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
    const banner = daysLeft <= 3 ? 'trial_warning' : null
    return { allowed: true, status: 'trial', banner, daysLeft }
  }

  if (sub.status === 'grace') {
    if (!sub.gracePeriodEnd || sub.gracePeriodEnd < now) {
      await prisma.subscription.update({
        where: { userId },
        data: { status: 'suspended', suspendedAt: now },
      })
      return { allowed: false, reason: 'suspended' }
    }
    const msLeft = sub.gracePeriodEnd.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
    return { allowed: true, status: 'grace', banner: 'grace_warning', daysLeft }
  }

  if (sub.status === 'suspended') return { allowed: false, reason: 'suspended' }
  if (sub.status === 'cancelled') return { allowed: false, reason: 'cancelled' }

  return { allowed: false, reason: 'suspended' }
}
